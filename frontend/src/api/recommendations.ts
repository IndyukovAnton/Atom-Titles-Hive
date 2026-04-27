import axios from './client';
import { config } from '../config';
import { useAuthStore } from '../store/authStore';

export interface RecommendationItem {
  title: string;
  image?: string;
  description?: string;
  rating?: number;
  genres?: string[];
  reason?: string;
  category?: string;
}

export type ClaudeContentType =
  | 'movie'
  | 'series'
  | 'anime'
  | 'book'
  | 'game'
  | 'other';

export type ClaudeMoodTag =
  | 'light'
  | 'cozy'
  | 'sad'
  | 'energetic'
  | 'thoughtful'
  | 'thrilling'
  | 'romantic'
  | 'escapist';

export type ClaudeModelId =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5';

export type AiSource = 'claude-api' | 'claude-cli';

export interface AICard {
  title: string;
  originalTitle?: string;
  type: ClaudeContentType;
  year?: number;
  genres: string[];
  whyRecommended: string;
  estimatedRating?: number;
  releasedRecently?: boolean;
  notInLibrary: boolean;
  posterUrl?: string;
}

export interface AiStreamMeta {
  tokensInput?: number;
  tokensOutput?: number;
  cacheReadTokens?: number;
  modelUsed?: string;
  webSearched?: boolean;
  libraryTruncated?: boolean;
  librarySize?: number;
}

export interface AiStreamErrorDetails {
  stderr?: string;
  stdout?: string;
  exitCode?: number;
  signal?: string;
  argv?: string[];
  binPath?: string;
}

export interface AiStreamError {
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
  details?: AiStreamErrorDetails;
}

export type AiStreamProgressStage =
  | 'starting'
  | 'analyzing_library'
  | 'thinking'
  | 'web_searching'
  | 'web_search_done'
  | 'tool_use'
  | 'cards_streaming';

export type AiStreamEvent =
  | { kind: 'open'; ts: number }
  | {
      kind: 'progress';
      stage: AiStreamProgressStage;
      message?: string;
      detail?: string;
    }
  | { kind: 'card'; card: AICard }
  | ({ kind: 'meta' } & AiStreamMeta)
  | { kind: 'done'; recommendations: number; durationMs: number }
  | ({ kind: 'error' } & AiStreamError);

export interface AiRequestPayload {
  source?: AiSource;
  prompt?: string;
  mood?: ClaudeMoodTag;
  filters?: {
    types?: Exclude<ClaudeContentType, 'other'>[];
    minRating?: number;
    genres?: string[];
  };
  count?: number;
  newForMe?: boolean;
  excludeTitles?: string[];
}

export interface CliStatus {
  installed: boolean;
  version?: string;
  authed: boolean;
  path?: string;
  error?: string;
}

const getAuthToken = (): string | null => {
  const fromStore = useAuthStore.getState().token;
  if (fromStore) return fromStore;
  const storage = localStorage.getItem('seen-auth-storage');
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage) as { state?: { token?: string } };
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
};

/**
 * Streams AI recommendations via SSE. Caller passes an AbortSignal to cancel
 * mid-stream (kills CLI / aborts API request server-side).
 */
export async function* streamAiRecommendations(
  payload: AiRequestPayload,
  signal: AbortSignal,
): AsyncGenerator<AiStreamEvent> {
  const baseUrl = config.getApiUrl();
  const token = getAuthToken();
  const response = await fetch(`${baseUrl}/recommendations/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    let message = `Stream request failed (HTTP ${response.status})`;
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let blockEnd: number;
    while ((blockEnd = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, blockEnd);
      buffer = buffer.slice(blockEnd + 2);
      const event = parseSseBlock(block);
      if (event) yield event;
    }
  }
}

function parseSseBlock(raw: string): AiStreamEvent | null {
  const lines = raw.split(/\r?\n/);
  let evtName = '';
  const dataParts: string[] = [];
  for (const line of lines) {
    if (line.startsWith('event: ')) evtName = line.slice(7).trim();
    else if (line.startsWith('data: ')) dataParts.push(line.slice(6));
  }
  if (!evtName || dataParts.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(dataParts.join('\n'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  return { kind: evtName, ...(parsed as object) } as AiStreamEvent;
}

export const recommendationsApi = {
  getTopRated: async (limit: number = 10) => {
    const response = await axios.get<RecommendationItem[]>(
      `/recommendations/top-rated?limit=${limit}`,
    );
    return response.data;
  },

  getByGenres: async () => {
    const response = await axios.get<RecommendationItem[]>(
      '/recommendations/genres',
    );
    return response.data;
  },

  getCliStatus: async (): Promise<CliStatus> => {
    const response = await axios.get<CliStatus>(
      '/recommendations/ai/cli-status',
    );
    return response.data;
  },
};
