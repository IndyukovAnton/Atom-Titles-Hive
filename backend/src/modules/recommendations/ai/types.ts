import { AICard, ContentType, MoodTag } from '../dto/claude-recommendation.dto';

export type AiSource = 'claude-api' | 'claude-cli';

export interface AiRequestParams {
  source: AiSource;
  prompt?: string;
  mood?: MoodTag;
  filters?: {
    types?: ContentType[];
    minRating?: number;
    genres?: string[];
  };
  count: number;
  newForMe?: boolean;
  excludeTitles?: string[];
  // API-only params
  apiKey?: string;
  model?: 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5';
  useWebSearch: boolean;
  // CLI-only params
  cliPath?: string;
}

export interface BuiltContext {
  systemPrompt: string;
  userMessage: string;
  userTitleSet: Set<string>;
  libraryTruncated: boolean;
  librarySize: number;
  count: number;
  useWebSearch: boolean;
  newForMe: boolean;
  tmdbApiKey?: string;
}

export type AiStreamEvent =
  | { kind: 'card'; card: AICard }
  | {
      kind: 'progress';
      stage:
        | 'starting'
        | 'analyzing_library'
        | 'thinking'
        | 'web_searching'
        | 'web_search_done'
        | 'tool_use'
        | 'cards_streaming';
      message?: string;
      detail?: string;
    }
  | {
      kind: 'meta';
      tokensInput?: number;
      tokensOutput?: number;
      cacheReadTokens?: number;
      modelUsed?: string;
      webSearched?: boolean;
      libraryTruncated?: boolean;
      librarySize?: number;
    }
  | { kind: 'done'; recommendations: number; durationMs: number }
  | {
      kind: 'error';
      code:
        | 'cli_not_installed'
        | 'cli_not_authed'
        | 'cli_timeout'
        | 'cli_failed'
        | 'api_auth'
        | 'api_rate_limit'
        | 'api_failed'
        | 'unknown';
      message: string;
      status?: number;
      details?: {
        stderr?: string;
        stdout?: string;
        exitCode?: number;
        signal?: string;
        argv?: string[];
        binPath?: string;
      };
    };

export interface AiSourceAdapter {
  /**
   * Streams cards + meta + final done/error event for a single recommendation
   * request. The orchestrator consumes the iterator and pipes events into SSE.
   * Implementations MUST emit exactly one terminal event ('done' or 'error').
   */
  stream(
    ctx: BuiltContext,
    params: AiRequestParams,
    abortSignal: AbortSignal,
  ): AsyncIterable<AiStreamEvent>;
}
