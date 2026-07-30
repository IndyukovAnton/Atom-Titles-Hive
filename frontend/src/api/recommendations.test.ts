import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { streamAiRecommendations } from './recommendations';
import type { AiRequestPayload, AiStreamEvent } from './recommendations';

const payload: AiRequestPayload = {
  source: 'codex-cli',
  useWebSearch: false,
  count: 5,
} as AiRequestPayload;

async function collect(
  iter: AsyncGenerator<AiStreamEvent>,
): Promise<AiStreamEvent[]> {
  const out: AiStreamEvent[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

/** fetch-мок, честно реагирующий на abort: pending-read завершается AbortError. */
function mockFetchWithChunks(chunks: string[] | 'hang') {
  return vi.fn((_url: string, init?: RequestInit) => {
    const signal = init?.signal;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        if (chunks === 'hang') {
          signal?.addEventListener('abort', () => {
            controller.error(
              new DOMException('The operation was aborted.', 'AbortError'),
            );
          });
          return;
        }
        const enc = new TextEncoder();
        for (const c of chunks) controller.enqueue(enc.encode(c));
        controller.close();
      },
    });
    return Promise.resolve({ ok: true, body: stream } as unknown as Response);
  });
}

describe('streamAiRecommendations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('парсит события и игнорирует keepalive-комментарии (: ping)', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchWithChunks([
        ': ping\n\n',
        'event: progress\ndata: {"kind":"progress","stage":"starting","message":"go"}\n\n',
        ': ping\n\n',
        'event: done\ndata: {"kind":"done","durationMs":5}\n\n',
      ]),
    );

    const events = await collect(
      streamAiRecommendations(payload, new AbortController().signal),
    );

    expect(events.map((e) => e.kind)).toEqual(['progress', 'done']);
  });

  it('stall-watchdog: тихий обрыв → понятная ошибка вместо вечного ожидания', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', mockFetchWithChunks('hang'));

    const promise = collect(
      streamAiRecommendations(payload, new AbortController().signal),
    );
    const assertion = expect(promise).rejects.toThrow(
      'Соединение с сервером потеряно',
    );

    await vi.advanceTimersByTimeAsync(90_000);
    await assertion;
  });

  it('внешняя отмена пользователем пробрасывается как AbortError', async () => {
    vi.stubGlobal('fetch', mockFetchWithChunks('hang'));

    const ac = new AbortController();
    const promise = collect(streamAiRecommendations(payload, ac.signal));
    ac.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
