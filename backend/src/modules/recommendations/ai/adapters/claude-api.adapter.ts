import Anthropic, {
  APIError,
  AuthenticationError,
  BadRequestError,
  RateLimitError,
} from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { RecommendationContextBuilder } from '../recommendation-context.builder';
import {
  AiRequestParams,
  AiSourceAdapter,
  AiStreamEvent,
  BuiltContext,
} from '../types';

@Injectable()
export class ClaudeApiAdapter implements AiSourceAdapter {
  constructor(private readonly contextBuilder: RecommendationContextBuilder) {}

  async *stream(
    ctx: BuiltContext,
    params: AiRequestParams,
    abortSignal: AbortSignal,
  ): AsyncIterable<AiStreamEvent> {
    if (!params.apiKey) {
      yield {
        kind: 'error',
        code: 'api_auth',
        message: 'Anthropic API key не задан в настройках',
      };
      return;
    }

    const startedAt = Date.now();
    const model = params.model ?? 'claude-sonnet-4-6';
    const client = new Anthropic({ apiKey: params.apiKey });

    const tools = this.buildTools(ctx.useWebSearch);

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: ctx.userMessage },
    ];

    yield {
      kind: 'progress',
      stage: 'starting',
      message: 'Подключаюсь к Anthropic…',
    };

    let totalInput = 0;
    let totalOutput = 0;
    let totalCacheRead = 0;
    let webSearched = false;
    let emitted = 0;

    const MAX_ITERATIONS = 8;
    let iter = 0;

    try {
      while (iter < MAX_ITERATIONS) {
        if (abortSignal.aborted) break;
        iter++;

        const response = await client.messages.create(
          {
            model,
            max_tokens: 16000,
            system: [
              {
                type: 'text',
                text: ctx.systemPrompt,
                cache_control: { type: 'ephemeral' },
              },
            ],
            tools,
            messages,
          },
          { signal: abortSignal },
        );

        totalInput += response.usage.input_tokens;
        totalOutput += response.usage.output_tokens;
        totalCacheRead += response.usage.cache_read_input_tokens ?? 0;

        for (const block of response.content) {
          if (
            block.type === 'tool_use' &&
            block.name === 'recommendation_card'
          ) {
            const card = this.contextBuilder.toolInputToCard(
              block.input,
              ctx.userTitleSet,
            );
            if (!card) continue;
            const tmdbEnriched = ctx.tmdbApiKey
              ? await this.contextBuilder.enrichWithPoster(card, ctx.tmdbApiKey)
              : card;
            const enriched = tmdbEnriched.posterUrl
              ? tmdbEnriched
              : await this.contextBuilder.enrichWithCover(tmdbEnriched);
            yield { kind: 'card', card: enriched };
            emitted++;
            if (emitted >= ctx.count) break;
          } else if (block.type === 'server_tool_use') {
            if (!webSearched) {
              webSearched = true;
              yield {
                kind: 'progress',
                stage: 'web_searching',
                message: 'Ищу в вебе свежие релизы…',
              };
            }
          } else if (block.type === 'text' && block.text.trim()) {
            yield {
              kind: 'progress',
              stage: 'thinking',
              detail: block.text.trim().slice(0, 200),
            };
          }
        }

        if (emitted >= ctx.count) break;
        if (response.stop_reason === 'end_turn') break;

        if (
          response.stop_reason === 'pause_turn' ||
          response.stop_reason === 'tool_use'
        ) {
          messages.push({ role: 'assistant', content: response.content });
          const hasOurToolCalls = response.content.some(
            (b: Anthropic.ContentBlock) =>
              b.type === 'tool_use' && b.name === 'recommendation_card',
          );
          const hasServerToolCalls = response.content.some(
            (b: Anthropic.ContentBlock) => b.type === 'server_tool_use',
          );
          if (hasOurToolCalls && !hasServerToolCalls) {
            messages.push({
              role: 'user',
              content: 'Continue with the remaining recommendations or finish.',
            });
          }
          continue;
        }

        break;
      }

      yield {
        kind: 'meta',
        tokensInput: totalInput,
        tokensOutput: totalOutput,
        cacheReadTokens: totalCacheRead,
        modelUsed: model,
        webSearched,
        libraryTruncated: ctx.libraryTruncated,
        librarySize: ctx.librarySize,
      };

      yield {
        kind: 'done',
        recommendations: emitted,
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      yield this.mapError(err);
    }
  }

  private buildTools(useWebSearch: boolean): Anthropic.ToolUnion[] {
    const recommendationTool: Anthropic.Tool = {
      name: 'recommendation_card',
      description:
        'Создать одну карточку рекомендации для пользователя. Вызови один раз для КАЖДОЙ рекомендации (всего N штук). Не пиши длинные пояснения текстом — структурированный вывод только через эту функцию.',
      input_schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Название как пользователь привык его видеть.',
          },
          originalTitle: {
            type: 'string',
            description:
              'Оригинальное название латиницей (например, для поиска постера в TMDB). Опционально.',
          },
          type: {
            type: 'string',
            enum: ['movie', 'series', 'anime', 'book', 'game', 'other'],
          },
          year: {
            type: 'integer',
            description: 'Год выхода. Опционально.',
          },
          genres: {
            type: 'array',
            items: { type: 'string' },
            description: 'Жанры (на русском или английском).',
          },
          whyRecommended: {
            type: 'string',
            description:
              'Объяснение ИМЕННО ДЛЯ ЭТОГО пользователя на основе его истории. Ссылайся на конкретные тайтлы из его библиотеки в кавычках. Максимум 300 символов.',
            maxLength: 300,
          },
          estimatedRating: {
            type: 'number',
            description: 'Прогноз оценки пользователем (1-10). Опционально.',
            minimum: 1,
            maximum: 10,
          },
          releasedRecently: {
            type: 'boolean',
            description: 'true если вышло за последние ~6 месяцев.',
          },
        },
        required: ['title', 'type', 'genres', 'whyRecommended'],
      },
    };

    const tools: Anthropic.ToolUnion[] = [recommendationTool];
    if (useWebSearch) {
      tools.push({
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5,
      });
    }
    return tools;
  }

  private mapError(error: unknown): AiStreamEvent {
    if (error instanceof AuthenticationError) {
      return {
        kind: 'error',
        code: 'api_auth',
        status: 401,
        message:
          'Anthropic API key не принят. Проверьте его в Настройках → AI.',
      };
    }
    if (error instanceof RateLimitError) {
      return {
        kind: 'error',
        code: 'api_rate_limit',
        status: 429,
        message: 'Превышен лимит Anthropic. Подождите минуту и повторите.',
      };
    }
    if (error instanceof BadRequestError) {
      return {
        kind: 'error',
        code: 'api_failed',
        status: 400,
        message: `Ошибка запроса: ${error.message}`,
      };
    }
    if (error instanceof APIError) {
      const rawStatus: unknown = error.status;
      const status = typeof rawStatus === 'number' ? rawStatus : 500;
      return {
        kind: 'error',
        code: 'api_failed',
        status,
        message: `Ошибка Anthropic (${status}): ${error.message}`,
      };
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        kind: 'error',
        code: 'unknown',
        message: 'Запрос отменён',
      };
    }
    if (error instanceof Error) {
      return { kind: 'error', code: 'unknown', message: error.message };
    }
    return { kind: 'error', code: 'unknown', message: 'Неизвестная ошибка' };
  }
}
