import { ChildProcessWithoutNullStreams } from 'child_process';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../utils/logger.service';
import { RecommendationContextBuilder } from '../recommendation-context.builder';
import { safeSpawn } from '../spawn-helpers';
import {
  AiRequestParams,
  AiSourceAdapter,
  AiStreamEvent,
  BuiltContext,
} from '../types';

const CARD_OPEN = '<<<CARD>>>';
const CARD_CLOSE = '<<</CARD>>>';

const CLI_SYSTEM_SUFFIX = `
=== ВЫХОДНОЙ ФОРМАТ — ВАЖНО ===
Каждую рекомендацию отдавай в виде блока ровно такого вида (включая маркеры):

${CARD_OPEN}
{"title":"...","originalTitle":"...","type":"movie","year":2024,"genres":["..."],"whyRecommended":"...","estimatedRating":8.5,"releasedRecently":false}
${CARD_CLOSE}

Поля внутри JSON:
- title (обязательно): строка
- originalTitle (опционально): строка
- type (обязательно): один из 'movie' | 'series' | 'anime' | 'book' | 'game' | 'other'
- year (опционально): число
- genres (обязательно): массив строк
- whyRecommended (обязательно): строка ≤ 300 символов
- estimatedRating (опционально): число 1..10
- releasedRecently (опционально): boolean

Между блоками не пиши ничего лишнего. После всех блоков выведи строку: <<<DONE>>>.

Если для оценки актуальности нужен веб-поиск — используй встроенный инструмент WebSearch.
`;

const CLI_TOTAL_TIMEOUT_MS = 5 * 60_000; // 5 минут общий timeout
const FIRST_BYTE_TIMEOUT_MS = 30_000; // если за 30с ни одного байта — считаем зависшим

interface StreamJsonEvent {
  type?: string;
  subtype?: string;
  message?: {
    content?: Array<{ type?: string; text?: string }>;
  };
  result?: string;
  is_error?: boolean;
  total_cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

@Injectable()
export class ClaudeCliAdapter implements AiSourceAdapter {
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
    const cliBin = (params.cliPath ?? 'claude').trim() || 'claude';

    yield {
      kind: 'progress',
      stage: 'starting',
      message: 'Запускаю Claude CLI…',
    };

    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--append-system-prompt',
      ctx.systemPrompt + '\n' + CLI_SYSTEM_SUFFIX,
      '--max-turns',
      '20',
      '--permission-mode',
      'default',
    ];

    if (ctx.useWebSearch) {
      args.push('--allowedTools', 'WebSearch');
    } else {
      args.push('--disallowedTools', 'WebSearch');
    }

    let child;
    try {
      child = await safeSpawn(cliBin, args, {
        env: { ...process.env },
        windowsHide: true,
      });
    } catch (err) {
      yield this.spawnError(err);
      return;
    }

    // Stream the user message via stdin so it never goes through cmd.exe
    // argv parsing on Windows.
    try {
      child.stdin?.write(ctx.userMessage);
      child.stdin?.end();
    } catch {
      // stdin may already be closed if spawn failed mid-flight
    }

    const cancelKill = () => {
      try {
        if (!child.killed) child.kill('SIGTERM');
      } catch {
        // ignore
      }
    };
    abortSignal.addEventListener('abort', cancelKill);

    const totalTimer = setTimeout(() => {
      cancelKill();
    }, CLI_TOTAL_TIMEOUT_MS);
    let firstByteTimer: NodeJS.Timeout | null = setTimeout(() => {
      cancelKill();
    }, FIRST_BYTE_TIMEOUT_MS);

    let stderrBuf = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString('utf8');
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
    let lineBuf = '';
    let cardBuf = '';
    let inCard = false;
    let sawDoneMarker = false;
    let resultText = '';

    const cardEvents: AiStreamEvent[] = [];
    const enqueueText = async (text: string): Promise<void> => {
      let cursor = 0;
      while (cursor < text.length) {
        if (!inCard) {
          const open = text.indexOf(CARD_OPEN, cursor);
          if (open < 0) {
            // check DONE marker
            if (text.includes('<<<DONE>>>', cursor)) sawDoneMarker = true;
            break;
          }
          cursor = open + CARD_OPEN.length;
          inCard = true;
          cardBuf = '';
        } else {
          const close = text.indexOf(CARD_CLOSE, cursor);
          if (close < 0) {
            cardBuf += text.slice(cursor);
            break;
          }
          cardBuf += text.slice(cursor, close);
          cursor = close + CARD_CLOSE.length;
          inCard = false;
          // try to parse cardBuf
          const trimmed = this.extractJsonObject(cardBuf);
          cardBuf = '';
          if (!trimmed) continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            continue;
          }
          const card = this.contextBuilder.toolInputToCard(
            parsed,
            ctx.userTitleSet,
          );
          if (!card) continue;
          if (emitted >= ctx.count) continue;
          const tmdbEnriched = ctx.tmdbApiKey
            ? await this.contextBuilder.enrichWithPoster(card, ctx.tmdbApiKey)
            : card;
          const enriched = tmdbEnriched.posterUrl
            ? tmdbEnriched
            : await this.contextBuilder.enrichWithCover(tmdbEnriched);
          cardEvents.push({ kind: 'card', card: enriched });
          emitted++;
        }
      }
    };

    const dataIter = this.iterStdoutLines(child, () => {
      if (firstByteTimer) {
        clearTimeout(firstByteTimer);
        firstByteTimer = null;
      }
    });

    try {
      for await (const line of dataIter) {
        if (abortSignal.aborted) break;
        lineBuf = line.trim();
        if (!lineBuf) continue;

        let evt: StreamJsonEvent | null = null;
        try {
          evt = JSON.parse(lineBuf) as StreamJsonEvent;
        } catch {
          // not JSON — skip
          continue;
        }

        const evtType = evt.type;
        if (evtType === 'assistant' && evt.message?.content) {
          for (const block of evt.message.content) {
            if (block.type === 'text' && typeof block.text === 'string') {
              const beforeCount = emitted;
              await enqueueText(block.text);
              while (cardEvents.length > 0) {
                const ev = cardEvents.shift();
                if (ev) yield ev;
              }
              if (emitted === beforeCount && block.text.trim()) {
                // text from model that wasn't a card — surface as thinking detail
                const snippet = block.text
                  .replace(/<<<\/?CARD>>>/g, '')
                  .replace(/<<<DONE>>>/g, '')
                  .trim();
                if (snippet.length > 0) {
                  yield {
                    kind: 'progress',
                    stage: 'thinking',
                    detail: snippet.slice(0, 200),
                  };
                }
              }
            } else if (
              block.type &&
              /tool_use/i.test(block.type) &&
              'name' in block
            ) {
              const rawName = (block as { name?: unknown }).name;
              const toolName =
                typeof rawName === 'string' && rawName.length > 0
                  ? rawName
                  : 'tool';
              if (/websearch/i.test(toolName)) {
                yield {
                  kind: 'progress',
                  stage: 'web_searching',
                  message: 'Ищу в вебе свежие релизы…',
                };
              } else {
                yield {
                  kind: 'progress',
                  stage: 'tool_use',
                  message: `Использую ${toolName}`,
                };
              }
            }
          }
        } else if (evtType === 'system' && evt.subtype === 'init') {
          yield {
            kind: 'progress',
            stage: 'analyzing_library',
            message: 'Анализирую вашу библиотеку…',
          };
        } else if (evtType === 'user' && evt.message?.content) {
          // tool_results — check for web_search tool usage
          for (const block of evt.message.content) {
            if (block.type && /web_search/i.test(block.type)) {
              if (!webSearched) {
                webSearched = true;
                yield {
                  kind: 'progress',
                  stage: 'web_search_done',
                  message: 'Получил результаты веб-поиска',
                };
              }
            }
          }
        } else if (evtType === 'result') {
          if (typeof evt.result === 'string') {
            resultText = evt.result;
            // Final result might contain remaining cards we haven't seen as
            // streaming text (some CLI versions only emit text in 'result').
            await enqueueText(resultText);
            while (cardEvents.length > 0) {
              const ev = cardEvents.shift();
              if (ev) yield ev;
            }
          }
          if (evt.usage) {
            totalInput += evt.usage.input_tokens ?? 0;
            totalOutput += evt.usage.output_tokens ?? 0;
            cacheRead += evt.usage.cache_read_input_tokens ?? 0;
          }
        }
      }
    } finally {
      if (firstByteTimer) clearTimeout(firstByteTimer);
      clearTimeout(totalTimer);
      abortSignal.removeEventListener('abort', cancelKill);
    }

    const exit = await exitPromise;

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
      stdout: resultText.slice(-2000),
      exitCode: exit.code ?? undefined,
      signal: exit.signal ?? undefined,
      argv: ['-p', '<stdin>', ...args.slice(1)],
      binPath: cliBin,
    };

    if (exit.code !== 0) {
      const stderrSnippet = stderrBuf.slice(-800).trim();
      const lower = (stderrSnippet + ' ' + resultText).toLowerCase();

      if (lower.includes('not found') || lower.includes('command not found')) {
        yield {
          kind: 'error',
          code: 'cli_not_installed',
          message:
            'Claude CLI не найден. Установите: `npm install -g @anthropic-ai/claude-code` или укажите путь в Настройках.',
          details: baseDetails,
        };
        return;
      }
      if (
        lower.includes('not authenticated') ||
        lower.includes('please run /login') ||
        lower.includes('login') ||
        lower.includes('unauthor')
      ) {
        yield {
          kind: 'error',
          code: 'cli_not_authed',
          message:
            'Claude CLI не авторизован. Выполните в терминале: `claude` → войдите.',
          details: baseDetails,
        };
        return;
      }

      void this.logger.warn(
        `claude CLI exited with code ${exit.code}, stderr: ${stderrSnippet}`,
      );
      yield {
        kind: 'error',
        code: 'cli_failed',
        message:
          `Claude CLI вернул ошибку (code ${exit.code}). ${stderrSnippet || ''}`.trim(),
        details: baseDetails,
      };
      return;
    }

    if (emitted === 0) {
      yield {
        kind: 'error',
        code: 'cli_failed',
        message:
          'Claude CLI завершился успешно, но не вернул ни одной карточки. Возможно, формат ответа отличается — см. подробности.',
        details: baseDetails,
      };
      return;
    }

    yield {
      kind: 'meta',
      tokensInput: totalInput || undefined,
      tokensOutput: totalOutput || undefined,
      cacheReadTokens: cacheRead || undefined,
      modelUsed: 'claude-code-cli',
      webSearched,
      libraryTruncated: ctx.libraryTruncated,
      librarySize: ctx.librarySize,
    };

    yield {
      kind: 'done',
      recommendations: emitted,
      durationMs: Date.now() - startedAt,
    };

    void sawDoneMarker; // not surfaced, but parsed for completeness
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
            'Claude CLI не найден в PATH. Установите: `npm install -g @anthropic-ai/claude-code` или укажите полный путь в Настройках → AI.',
          details: { stderr: errStack ?? errMessage },
        };
      }
    }
    return {
      kind: 'error',
      code: 'cli_failed',
      message: `Не удалось запустить claude CLI: ${errMessage}`,
      details: { stderr: errStack ?? errMessage },
    };
  }

  /**
   * Async generator that yields one stdout line at a time. Calls onFirstChunk
   * the first time any data arrives so the caller can clear "no first byte"
   * timers.
   */
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

  /**
   * Tries to extract the first balanced JSON object from a string. Useful when
   * the model adds whitespace/prose around the JSON.
   */
  private extractJsonObject(text: string): string | null {
    const trimmed = text.trim();
    const start = trimmed.indexOf('{');
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < trimmed.length; i++) {
      const c = trimmed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return trimmed.slice(start, i + 1);
      }
    }
    return null;
  }
}
