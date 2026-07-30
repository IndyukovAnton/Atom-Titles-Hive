import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { CodexCliAdapter } from './codex-cli.adapter';
import { RecommendationContextBuilder } from '../recommendation-context.builder';
import { LoggerService } from '../../../../utils/logger.service';
import { BuiltContext } from '../types';
import * as spawnHelpers from '../spawn-helpers';
import { CARD_CLOSE, CARD_OPEN } from '../card-stream-parser';

jest.mock('../spawn-helpers', () => ({
  resolveBinary: jest.fn(),
  safeSpawn: jest.fn(),
}));

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: jest.fn().mockRejectedValue(new Error('ENOENT')),
      unlink: jest.fn().mockResolvedValue(undefined),
    },
  };
});

const mockSafeSpawn = spawnHelpers.safeSpawn as jest.MockedFunction<
  typeof spawnHelpers.safeSpawn
>;

function makeStdout(lines: string[]): Readable {
  return Readable.from(lines.map((l) => Buffer.from(l + '\n')));
}

function fakeChild(stdoutLines: string[], exitCode = 0) {
  const child = new EventEmitter() as EventEmitter & {
    stdout: Readable;
    stderr: EventEmitter;
    stdin: { write: jest.Mock; end: jest.Mock };
    killed: boolean;
    kill: jest.Mock;
  };
  child.stdout = makeStdout(stdoutLines);
  child.stderr = new EventEmitter();
  child.stdin = { write: jest.fn(), end: jest.fn() };
  child.killed = false;
  child.kill = jest.fn(() => {
    child.killed = true;
    child.emit('close', exitCode || 1, 'SIGTERM');
  });

  // Defer close so stream() can attach listeners first.
  setTimeout(() => {
    if (!child.killed) child.emit('close', exitCode, null);
  }, 10);

  return child;
}

const baseCtx: BuiltContext = {
  systemPrompt: 'system',
  userMessage: 'recommend me something',
  userTitleSet: new Set(),
  libraryTruncated: false,
  librarySize: 3,
  count: 5,
  useWebSearch: false,
  newForMe: true,
};

async function collect(iter: AsyncIterable<unknown>): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

describe('CodexCliAdapter', () => {
  let adapter: CodexCliAdapter;
  const contextBuilder = {
    toolInputToCard: jest.fn((raw: { title?: string }) =>
      raw?.title
        ? {
            title: raw.title,
            type: 'movie',
            genres: [],
            whyRecommended: 'x',
            notInLibrary: true,
          }
        : null,
    ),
    enrichWithPoster: jest.fn((c: unknown) => Promise.resolve(c)),
    enrichWithCover: jest.fn((c: unknown) => Promise.resolve(c)),
  };
  const logger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    adapter = new CodexCliAdapter(
      contextBuilder as unknown as RecommendationContextBuilder,
      logger as unknown as LoggerService,
    );
    jest.clearAllMocks();
  });

  it('emits cli_not_installed on ENOENT spawn', async () => {
    const err = new Error('not found') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockSafeSpawn.mockRejectedValue(err);

    const events = await collect(
      adapter.stream(
        baseCtx,
        { source: 'codex-cli', useWebSearch: false, count: 5 },
        new AbortController().signal,
      ),
    );

    expect(
      events.some((e) => (e as { code?: string }).code === 'cli_not_installed'),
    ).toBe(true);
  });

  it('parses cards from JSONL agent_message items and emits done', async () => {
    const cardJson = JSON.stringify({
      title: 'Dune',
      type: 'movie',
      genres: ['Sci-Fi'],
      whyRecommended: 'epic',
    });
    const message = `${CARD_OPEN}\n${cardJson}\n${CARD_CLOSE}\n<<<DONE>>>`;

    mockSafeSpawn.mockImplementation(() =>
      Promise.resolve(
        fakeChild([
          JSON.stringify({ type: 'thread.started' }),
          JSON.stringify({
            type: 'item.completed',
            item: { type: 'agent_message', text: message },
          }),
          JSON.stringify({
            type: 'turn.completed',
            usage: { input_tokens: 10, output_tokens: 20 },
          }),
        ]) as never,
      ),
    );

    const events = await collect(
      adapter.stream(
        baseCtx,
        {
          source: 'codex-cli',
          useWebSearch: false,
          count: 5,
          codexModel: 'gpt-5.4',
        },
        new AbortController().signal,
      ),
    );

    const kinds = events.map((e) => (e as { kind: string }).kind);
    expect(kinds).toContain('card');
    expect(kinds).toContain('meta');
    expect(kinds).toContain('done');
    expect(contextBuilder.toolInputToCard).toHaveBeenCalled();
    expect(mockSafeSpawn.mock.calls[0][0]).toBe('codex');
    expect(mockSafeSpawn.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        'exec',
        '--json',
        '--sandbox',
        'read-only',
        '-m',
        'gpt-5.4',
      ]),
    );
  }, 15_000);

  it('never passes --search (unsupported by codex exec), even with web search on', async () => {
    mockSafeSpawn.mockImplementation(() =>
      Promise.resolve(fakeChild([]) as never),
    );

    await collect(
      adapter.stream(
        { ...baseCtx, useWebSearch: true },
        { source: 'codex-cli', useWebSearch: true, count: 5 },
        new AbortController().signal,
      ),
    );

    expect(mockSafeSpawn.mock.calls[0][1]).not.toContain('--search');
  }, 15_000);

  it('maps auth errors from non-zero exit', async () => {
    mockSafeSpawn.mockImplementation(() => {
      const child = fakeChild([], 1);
      setTimeout(() => {
        child.stderr.emit('data', Buffer.from('Please run codex login'));
      }, 0);
      return Promise.resolve(child as never);
    });

    const events = await collect(
      adapter.stream(
        baseCtx,
        { source: 'codex-cli', useWebSearch: false, count: 5 },
        new AbortController().signal,
      ),
    );

    expect(
      events.some((e) => (e as { code?: string }).code === 'cli_not_authed'),
    ).toBe(true);
  }, 15_000);

  it('kills the CLI on the first Cloudflare 403 stderr line without waiting for retries', async () => {
    let childRef: ReturnType<typeof fakeChild> | null = null;
    mockSafeSpawn.mockImplementation(() => {
      childRef = fakeChild([], 0);
      setTimeout(() => {
        childRef!.stderr.emit(
          'data',
          Buffer.from(
            'ERROR codex_api::endpoint::responses_websocket: failed to connect to websocket: HTTP error: 403 Forbidden, url: wss://chatgpt.com/backend-api/codex/responses',
          ),
        );
      }, 0);
      return Promise.resolve(childRef as never);
    });

    const events = await collect(
      adapter.stream(
        baseCtx,
        { source: 'codex-cli', useWebSearch: false, count: 5 },
        new AbortController().signal,
      ),
    );

    expect(childRef!.kill).toHaveBeenCalledWith('SIGTERM');
    const err = events.find(
      (e) => (e as { kind?: string }).kind === 'error',
    ) as { code?: string; message?: string } | undefined;
    expect(err?.code).toBe('cli_failed');
    expect(err?.message).toContain('Cloudflare');
  }, 15_000);

  it('does not kill the CLI on benign stderr output', async () => {
    let childRef: ReturnType<typeof fakeChild> | null = null;
    mockSafeSpawn.mockImplementation(() => {
      childRef = fakeChild([], 0);
      setTimeout(() => {
        childRef!.stderr.emit(
          'data',
          Buffer.from('WARN some harmless warning'),
        );
      }, 0);
      return Promise.resolve(childRef as never);
    });

    await collect(
      adapter.stream(
        baseCtx,
        { source: 'codex-cli', useWebSearch: false, count: 5 },
        new AbortController().signal,
      ),
    );

    expect(childRef!.kill).not.toHaveBeenCalled();
  }, 15_000);

  it('maps Cloudflare 403 websocket failures to an actionable message', async () => {
    mockSafeSpawn.mockImplementation(() => {
      const child = fakeChild(
        [
          JSON.stringify({
            type: 'error',
            message:
              'Reconnecting... 5/5 (unexpected status 403 Forbidden, url: wss://chatgpt.com/backend-api/codex/responses)',
          }),
        ],
        0,
      );
      setTimeout(() => {
        child.stderr.emit(
          'data',
          Buffer.from(
            'ERROR codex_api::endpoint::responses_websocket: failed to connect to websocket: HTTP error: 403 Forbidden, url: wss://chatgpt.com/backend-api/codex/responses, cf-ray: a2300bb7fa78f10b-DME',
          ),
        );
      }, 0);
      return Promise.resolve(child as never);
    });

    const events = await collect(
      adapter.stream(
        baseCtx,
        { source: 'codex-cli', useWebSearch: false, count: 5 },
        new AbortController().signal,
      ),
    );

    const err = events.find(
      (e) => (e as { kind?: string }).kind === 'error',
    ) as { code?: string; message?: string } | undefined;
    expect(err?.code).toBe('cli_failed');
    expect(err?.message).toContain('Cloudflare');
    expect(err?.message).toContain('VPN');
  }, 15_000);
});
