import { ChildProcessWithoutNullStreams } from 'child_process';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../utils/logger.service';
import {
  CLI_CARD_FORMAT_SUFFIX,
  createCardStreamParserState,
  feedCardText,
  stripCardMarkers,
} from '../card-stream-parser';
import { RecommendationContextBuilder } from '../recommendation-context.builder';
import { safeSpawn } from '../spawn-helpers';
import {
  AiRequestParams,
  AiSourceAdapter,
  AiStreamEvent,
  BuiltContext,
} from '../types';

const CLI_TOTAL_TIMEOUT_MS = 5 * 60_000;
const FIRST_BYTE_TIMEOUT_MS = 45_000;

/**
 * Loose shape of Codex `exec --json` JSONL events. The schema evolves; we
 * only rely on a few stable fields and fall back to last-message file.
 */
interface CodexJsonlEvent {
  type?: string;
  // nested item (item.completed / item.updated)
  item?: {
    type?: string;
    text?: string;
    content?: string | Array<{ type?: string; text?: string }>;
  };
  // older / alternate envelope
  msg?: {
    type?: string;
    content?: string;
    text?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cached_input_tokens?: number;
  };
  message?: string;
  error?: { message?: string } | string;
}

@Injectable()
export class CodexCliAdapter implements AiSourceAdapter {
  constructor(
    private readonly contextBuilder: RecommendationContextBuilder,
    private readonly logger: LoggerService,
  ) {}

  async *stream(
    ctx: BuiltContext,
    params: AiRequestParams,
    abortSignal: AbortSignal,
  ): AsyncIterable<AiStreamEvent> {
    const startedAt = Date.now();
    const cliBin = (params.cliPath ?? 'codex').trim() || 'codex';
    const outFile = join(tmpdir(), `ath-codex-${randomUUID()}.txt`);

    yield {
      kind: 'progress',
      stage: 'starting',
      message: 'Запускаю Codex CLI…',
    };

    const args = [
      'exec',
      '--json',
      '--sandbox',
      'read-only',
      '--ephemeral',
      '--output-last-message',
      outFile,
      '-', // read prompt from stdin
    ];

    if (params.codexModel?.trim()) {
      args.push('-m', params.codexModel.trim());
    }
    // NB: `--search` не поддержан в ряде версий codex exec — веб-поиск
    // контролируем через инструкции в промпте (см. searchRestriction).

    const searchRestriction = ctx.useWebSearch
      ? ''
      : '\n=== ОГРАНИЧЕНИЕ ===\nВеб-поиск и любые обращения к сети запрещены — опирайся только на данные из этого запроса.\n';

    let child: ChildProcessWithoutNullStreams;
    try {
      child = await safeSpawn(cliBin, args, {
        env: { ...process.env },
        windowsHide: true,
      });
    } catch (err) {
      await this.safeUnlink(outFile);
      yield this.spawnError(err);
      return;
    }

    const combinedPrompt = [
      ctx.systemPrompt,
      CLI_CARD_FORMAT_SUFFIX + searchRestriction,
      '',
      '=== ЗАПРОС ПОЛЬЗОВАТЕЛЯ ===',
      ctx.userMessage,
    ].join('\n');

    try {
      child.stdin?.write(combinedPrompt);
      child.stdin?.end();
    } catch {
      // stdin may already be closed
    }

    const cancelKill = () => {
      try {
        if (!child.killed) child.kill('SIGTERM');
      } catch {
        // ignore
      }
    };
    abortSignal.addEventListener('abort', cancelKill);

    const totalTimer = setTimeout(cancelKill, CLI_TOTAL_TIMEOUT_MS);
    let firstByteTimer: NodeJS.Timeout | null = setTimeout(
      cancelKill,
      FIRST_BYTE_TIMEOUT_MS,
    );

    let stderrBuf = '';
    let blockedMessage: string | null = null;
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString('utf8');
      // Edge-блок детерминирован по IP: ретраи CLI (~8 сек) бесполезны —
      // прерываем процесс при первой же сигнатуре, не дожидаясь их.
      if (!blockedMessage) {
        const friendly = this.describeConnectionIssue(stderrBuf);
        if (friendly) {
          blockedMessage = friendly;
          cancelKill();
        }
      }
    });

    let spawnErrored: Error | null = null;
    child.on('error', (err: Error) => {
      spawnErrored = err;
    });

    const exitPromise = new Promise<{
      code: number | null;
      signal: NodeJS.Signals | null;
    }>((resolve) => {
      child.on('close', (code, signal) => resolve({ code, signal }));
    });

    let emitted = 0;
    let webSearched = false;
    let totalInput = 0;
    let totalOutput = 0;
    let cacheRead = 0;
    const modelUsed = params.codexModel?.trim() || 'codex-cli';
    let streamError: string | null = null;
    const parserState = createCardStreamParserState();

    const emitCardsFromText = async function* (
      this: CodexCliAdapter,
      text: string,
    ): AsyncGenerator<AiStreamEvent> {
      for (const parsed of feedCardText(parserState, text)) {
        if (emitted >= ctx.count) continue;
        const card = this.contextBuilder.toolInputToCard(
          parsed,
          ctx.userTitleSet,
        );
        if (!card) continue;
        const tmdbEnriched = ctx.tmdbApiKey
          ? await this.contextBuilder.enrichWithPoster(card, ctx.tmdbApiKey)
          : card;
        const enriched = tmdbEnriched.posterUrl
          ? tmdbEnriched
          : await this.contextBuilder.enrichWithCover(tmdbEnriched);
        emitted++;
        yield { kind: 'card', card: enriched };
      }
    }.bind(this);

    const dataIter = this.iterStdoutLines(child, () => {
      if (firstByteTimer) {
        clearTimeout(firstByteTimer);
        firstByteTimer = null;
      }
    });

    try {
      for await (const line of dataIter) {
        if (abortSignal.aborted) break;
        const trimmed = line.trim();
        if (!trimmed) continue;

        let evt: CodexJsonlEvent | null = null;
        try {
          evt = JSON.parse(trimmed) as CodexJsonlEvent;
        } catch {
          continue;
        }

        const evtType = evt.type ?? evt.msg?.type ?? '';

        if (evtType === 'thread.started' || evtType === 'turn.started') {
          yield {
            kind: 'progress',
            stage: 'analyzing_library',
            message: 'Анализирую вашу библиотеку…',
          };
          continue;
        }

        if (evtType === 'error' || evtType === 'turn.failed') {
          streamError =
            evt.message ||
            (typeof evt.error === 'string' ? evt.error : evt.error?.message) ||
            'Codex вернул ошибку';
          continue;
        }

        if (evtType === 'turn.completed' && evt.usage) {
          totalInput += evt.usage.input_tokens ?? 0;
          totalOutput += evt.usage.output_tokens ?? 0;
          cacheRead += evt.usage.cached_input_tokens ?? 0;
          continue;
        }

        // Agent / assistant text — try several known shapes
        const text = this.extractEventText(evt);
        if (text) {
          const before = emitted;
          yield* emitCardsFromText(text);
          if (emitted === before) {
            const snippet = stripCardMarkers(text);
            if (snippet.length > 0) {
              yield {
                kind: 'progress',
                stage: 'thinking',
                detail: snippet.slice(0, 200),
              };
            }
          }
        }

        // Heuristic: web search tool usage
        const itemType = evt.item?.type ?? '';
        if (
          /web.?search|search/i.test(itemType) ||
          /web.?search/i.test(evtType)
        ) {
          if (!webSearched) {
            webSearched = true;
            yield {
              kind: 'progress',
              stage: 'web_searching',
              message: 'Ищу в интернете свежие релизы…',
            };
          }
        }
      }
    } finally {
      if (firstByteTimer) clearTimeout(firstByteTimer);
      clearTimeout(totalTimer);
      abortSignal.removeEventListener('abort', cancelKill);
    }

    const exit = await exitPromise;

    // Fallback: read final message file if we still have no cards
    if (emitted === 0 && !abortSignal.aborted) {
      try {
        const last = await fs.readFile(outFile, 'utf8');
        if (last.trim()) {
          yield* emitCardsFromText(last);
        }
      } catch {
        // file missing or empty — ignore
      }
    }
    await this.safeUnlink(outFile);

    if (spawnErrored) {
      yield this.spawnError(spawnErrored);
      return;
    }

    if (abortSignal.aborted) {
      yield {
        kind: 'error',
        code: 'unknown',
        message: 'Запрос отменён',
      };
      return;
    }

    const baseDetails = {
      stderr: stderrBuf.slice(-2000),
      exitCode: exit.code ?? undefined,
      signal: exit.signal ?? undefined,
      argv: args.map((a, i) =>
        i === args.length - 1 && a === '-' ? '<stdin>' : a,
      ),
      binPath: cliBin,
    };

    if (blockedMessage) {
      yield {
        kind: 'error',
        code: 'cli_failed',
        message: blockedMessage,
        details: baseDetails,
      };
      return;
    }

    if (streamError) {
      const friendly = this.describeConnectionIssue(
        `${streamError}\n${stderrBuf}`,
      );
      if (friendly) {
        yield {
          kind: 'error',
          code: 'cli_failed',
          message: friendly,
          details: baseDetails,
        };
        return;
      }
      const lower = streamError.toLowerCase();
      if (this.looksUnauthed(lower)) {
        yield {
          kind: 'error',
          code: 'cli_not_authed',
          message:
            'Codex CLI не авторизован. Выполните в терминале: `codex login`.',
          details: baseDetails,
        };
        return;
      }
      yield {
        kind: 'error',
        code: 'cli_failed',
        message: streamError,
        details: baseDetails,
      };
      return;
    }

    if (exit.code !== 0) {
      const stderrSnippet = stderrBuf.slice(-800).trim();
      const lower = (stderrSnippet + ' ' + (streamError ?? '')).toLowerCase();

      const friendly = this.describeConnectionIssue(stderrBuf);
      if (friendly) {
        yield {
          kind: 'error',
          code: 'cli_failed',
          message: friendly,
          details: baseDetails,
        };
        return;
      }

      if (
        lower.includes('not found') ||
        lower.includes('command not found') ||
        lower.includes('enoent')
      ) {
        yield {
          kind: 'error',
          code: 'cli_not_installed',
          message:
            'Codex CLI не найден. Установите: `npm install -g @openai/codex` или укажите путь в Настройках.',
          details: baseDetails,
        };
        return;
      }
      if (this.looksUnauthed(lower)) {
        yield {
          kind: 'error',
          code: 'cli_not_authed',
          message:
            'Codex CLI не авторизован. Выполните в терминале: `codex login`.',
          details: baseDetails,
        };
        return;
      }

      void this.logger.warn(
        `codex CLI exited with code ${exit.code}, stderr: ${stderrSnippet}`,
      );
      yield {
        kind: 'error',
        code: 'cli_failed',
        message:
          `Codex CLI вернул ошибку (code ${exit.code}). ${stderrSnippet || ''}`.trim(),
        details: baseDetails,
      };
      return;
    }

    if (emitted === 0) {
      yield {
        kind: 'error',
        code: 'cli_failed',
        message:
          'Codex CLI завершился успешно, но не вернул ни одной карточки. Возможно, формат ответа отличается — см. подробности.',
        details: baseDetails,
      };
      return;
    }

    yield {
      kind: 'meta',
      tokensInput: totalInput || undefined,
      tokensOutput: totalOutput || undefined,
      cacheReadTokens: cacheRead || undefined,
      modelUsed,
      webSearched: webSearched || ctx.useWebSearch,
      libraryTruncated: ctx.libraryTruncated,
      librarySize: ctx.librarySize,
    };

    yield {
      kind: 'done',
      recommendations: emitted,
      durationMs: Date.now() - startedAt,
    };
  }

  private extractEventText(evt: CodexJsonlEvent): string | null {
    if (evt.item) {
      if (typeof evt.item.text === 'string' && evt.item.text.trim()) {
        return evt.item.text;
      }
      if (typeof evt.item.content === 'string' && evt.item.content.trim()) {
        return evt.item.content;
      }
      if (Array.isArray(evt.item.content)) {
        const parts = evt.item.content
          .map((c) => (typeof c.text === 'string' ? c.text : ''))
          .filter(Boolean);
        if (parts.length) return parts.join('\n');
      }
    }
    if (evt.msg) {
      if (typeof evt.msg.content === 'string' && evt.msg.content.trim()) {
        return evt.msg.content;
      }
      if (typeof evt.msg.text === 'string' && evt.msg.text.trim()) {
        return evt.msg.text;
      }
    }
    return null;
  }

  private looksUnauthed(lower: string): boolean {
    return (
      lower.includes('not authenticated') ||
      lower.includes('not logged in') ||
      lower.includes('please run') ||
      lower.includes('login') ||
      lower.includes('unauthor') ||
      lower.includes('no api key') ||
      lower.includes('authentication required')
    );
  }

  /**
   * Cloudflare/edge 403 при подключении к chatgpt.com — типичный симптом
   * региональной блокировки. Даём actionable-сообщение вместо сырого stderr.
   */
  private describeConnectionIssue(text: string): string | null {
    const lower = text.toLowerCase();
    const mentionsEdge =
      lower.includes('chatgpt.com') ||
      lower.includes('cloudflare') ||
      lower.includes('cf-ray') ||
      lower.includes('websocket') ||
      lower.includes('wss://');
    const blocked = lower.includes('403') || lower.includes('forbidden');
    if (!mentionsEdge || !blocked) return null;
    return 'Codex CLI не смог подключиться к chatgpt.com (403 Forbidden — похоже, запрос блокируется на стороне Cloudflare; типично при региональных ограничениях). Попробуйте включить VPN/прокси и повторить, либо переключите источник: Настройки → Интеграции & AI.';
  }

  private spawnError(err: unknown): AiStreamEvent {
    const errMessage = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;

    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'ENOENT') {
        return {
          kind: 'error',
          code: 'cli_not_installed',
          message:
            'Codex CLI не найден в PATH. Установите: `npm install -g @openai/codex` или укажите полный путь в Настройках → AI.',
          details: { stderr: errStack ?? errMessage },
        };
      }
    }
    return {
      kind: 'error',
      code: 'cli_failed',
      message: `Не удалось запустить Codex CLI: ${errMessage}`,
      details: { stderr: errStack ?? errMessage },
    };
  }

  private async safeUnlink(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch {
      // ignore
    }
  }

  private async *iterStdoutLines(
    child: ChildProcessWithoutNullStreams,
    onFirstChunk: () => void,
  ): AsyncGenerator<string> {
    if (!child.stdout) return;
    let buf = '';
    let firstChunkSeen = false;
    for await (const chunk of child.stdout as AsyncIterable<Buffer>) {
      if (!firstChunkSeen) {
        firstChunkSeen = true;
        onFirstChunk();
      }
      buf += chunk.toString('utf8');
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        yield line;
      }
    }
    if (buf.length > 0) yield buf;
  }
}
