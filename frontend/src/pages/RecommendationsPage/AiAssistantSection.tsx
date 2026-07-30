import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Brain, Globe, Loader2, Settings as SettingsIcon, SlidersHorizontal, Sparkles, Square } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { streamAiRecommendations } from '@/api/recommendations';
import type {
  AICard as AICardData,
  AiSource,
  AiStreamError,
  AiStreamErrorDetails,
  AiStreamMeta,
  AiStreamEvent,
  AiStreamProgressStage,
  ClaudeContentType,
  ClaudeMoodTag,
  RecommendationItem,
} from '@/api/recommendations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { AICard } from '@/components/recommendations/AICard';
import { aiCardToAddMediaInitial } from '@/components/recommendations/aiCardMapping';
import { ConsentDialog } from '@/components/recommendations/ConsentDialog';
import { MoodPicker } from '@/components/recommendations/MoodPicker';
import {
  aiCardToSavePayload,
  libraryApi,
  type SavedRecommendation,
  type SavedRecStatus,
} from '@/api/library';
import {
  SAVED_RECS_QUERY_KEY,
  useSavedRecommendations,
} from '@/hooks/useSavedRecommendations';
import { useAuthStore } from '@/store/authStore';
import { isTauri } from '@/utils/tauri';

const cardKey = (c: { title: string; type: string }) =>
  `${c.title.toLowerCase()}|${c.type}`;

type ProgressEntry = {
  stage: AiStreamProgressStage;
  message?: string;
  detail?: string;
  ts: number;
};

const STAGE_LABELS: Record<AiStreamProgressStage, string> = {
  starting: 'Запускаю…',
  analyzing_library: 'Анализирую вашу библиотеку…',
  thinking: 'Думаю…',
  web_searching: 'Ищу в интернете свежие релизы…',
  web_search_done: 'Получил результаты веб-поиска',
  tool_use: 'Использую инструмент…',
  cards_streaming: 'Формирую карточки…',
};

function stageLabel(entry?: ProgressEntry): string {
  if (entry?.message) return entry.message;
  return entry ? STAGE_LABELS[entry.stage] : STAGE_LABELS.thinking;
}

type ContentTypeFilter = Exclude<ClaudeContentType, 'other'>;

const CONTENT_TYPE_LABELS: Record<ContentTypeFilter, string> = {
  movie: 'Фильмы',
  series: 'Сериалы',
  anime: 'Аниме',
  book: 'Книги',
  game: 'Игры',
};

const ALL_CONTENT_TYPES: ContentTypeFilter[] = [
  'movie',
  'series',
  'anime',
  'book',
  'game',
];

const PRESET_GENRES = [
  'Боевик',
  'Драма',
  'Фантастика',
  'Фэнтези',
  'Комедия',
  'Романтика',
  'Триллер',
  'Хоррор',
  'Детектив',
  'Мистика',
  'Повседневность',
  'Приключения',
  'Документальное',
  'Анимация',
  'Криминал',
  'Военный',
  'Психологический',
  'Спорт',
];

const DEFAULT_CONTENT_TYPES: ContentTypeFilter[] = [
  'movie',
  'series',
  'anime',
];

const COUNT_OPTIONS = [5, 10, 15, 20];

interface AiAssistantSectionProps {
  /** Compatibility shim for old RecommendationsPage callback. The new flow
   *  works with AICardData → MediaEntry directly via aiCardToAddMediaInitial.
   *  savedRecId — id закреплённой рекомендации, подлежащей удалению после
   *  успешного добавления в библиотеку. */
  onAdd: (item: RecommendationItem, savedRecId?: number) => void;
}

const SOURCE_LABEL: Record<AiSource, string> = {
  'claude-api': 'Claude API',
  'claude-cli': 'Claude CLI',
  'codex-cli': 'Codex CLI',
};

const RESULTS_CACHE_KEY = (userId: number) =>
  `claude_recs_last_${userId}`;
const RESULTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedResults {
  cards: AICardData[];
  meta: AiStreamMeta | null;
  durationMs: number | null;
  ts: number;
}

const loadCachedResults = (userId?: number): CachedResults | null => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(RESULTS_CACHE_KEY(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedResults;
    if (
      !parsed ||
      typeof parsed.ts !== 'number' ||
      Date.now() - parsed.ts > RESULTS_CACHE_TTL_MS
    ) {
      localStorage.removeItem(RESULTS_CACHE_KEY(userId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const saveCachedResults = (userId: number | undefined, data: CachedResults) => {
  if (!userId) return;
  try {
    localStorage.setItem(RESULTS_CACHE_KEY(userId), JSON.stringify(data));
  } catch {
    // quota or anything — ignore
  }
};

/**
 * Native notification when recommendations finish — useful when the user
 * minimised the window and we kept generating in the background. Browser-mode
 * fallback uses the Web Notification API.
 */
async function notifyRecommendationsReady(
  count: number,
  durationMs: number,
): Promise<void> {
  // If the document is in foreground, the toast already informs the user.
  // Notify only when the window is hidden / minimised / not focused.
  if (typeof document !== 'undefined' && document.hasFocus()) {
    return;
  }

  const body = `Готово: ${count} карточек за ${(durationMs / 1000).toFixed(1)}с`;
  const title = 'Рекомендации готовы';

  if (isTauri()) {
    try {
      const mod = await import('@tauri-apps/plugin-notification');
      let allowed = await mod.isPermissionGranted();
      if (!allowed) {
        const result = await mod.requestPermission();
        allowed = result === 'granted';
      }
      if (allowed) {
        await mod.sendNotification({ title, body });
      }
    } catch {
      // plugin missing in dev/browser — skip
    }
    return;
  }

  if (typeof Notification !== 'undefined') {
    try {
      let perm = Notification.permission;
      if (perm === 'default') perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, { body });
      }
    } catch {
      // ignore
    }
  }
}

export function AiAssistantSection({ onAdd: _onAdd }: AiAssistantSectionProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userId = user?.id;
  const prefs = user?.preferences;

  const source: AiSource = prefs?.aiSource ?? 'claude-api';
  const sourceLabel = SOURCE_LABEL[source];

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState('');
  const [mood, setMood] = useState<ClaudeMoodTag | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<ContentTypeFilter[]>(
    DEFAULT_CONTENT_TYPES,
  );

  // Авто-ресайз по контенту; границы задаются классами min-h/max-h на textarea
  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // scrollHeight — это padding-box; для border-box добавляем рамку,
    // иначе последняя строка подрезается на пару пикселей
    const borderHeight = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + borderHeight}px`;
  }, [prompt]);

  const [genres, setGenres] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [newForMe, setNewForMe] = useState(false);
  const [paramsOpen, setParamsOpen] = useState(false);

  const initialCache = useMemo(() => loadCachedResults(userId), [userId]);

  const [cards, setCards] = useState<AICardData[]>(
    () => initialCache?.cards ?? [],
  );
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [meta, setMeta] = useState<AiStreamMeta | null>(
    () => initialCache?.meta ?? null,
  );
  const [error, setError] = useState<
    | (Pick<AiStreamError, 'message' | 'code'> & {
        details?: AiStreamErrorDetails;
      })
    | null
  >(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(
    () => initialCache?.durationMs ?? null,
  );

  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Общий кэш сохранённых рекомендаций: consume-флоу страницы инвалидирует
  // его после добавления карточки в библиотеку, бейджи сбрасываются сами.
  const { data: savedRecRows } = useSavedRecommendations();

  // Map: cardKey (title|type) -> savedRecommendation row id, for active state
  const savedByKey = useMemo(() => {
    const next: Record<string, { id: number; status: SavedRecStatus }> = {};
    for (const r of savedRecRows ?? []) {
      next[cardKey(r)] = { id: r.id, status: r.status };
    }
    return next;
  }, [savedRecRows]);

  const upsertSaved = (next: SavedRecommendation): void => {
    queryClient.setQueryData<SavedRecommendation[]>(
      SAVED_RECS_QUERY_KEY,
      (rows) => {
        const list = rows ?? [];
        const idx = list.findIndex((r) => r.id === next.id);
        return idx === -1
          ? [...list, next]
          : list.map((r) => (r.id === next.id ? next : r));
      },
    );
  };

  const removeSaved = (id: number): void => {
    queryClient.setQueryData<SavedRecommendation[]>(
      SAVED_RECS_QUERY_KEY,
      (rows) => (rows ?? []).filter((r) => r.id !== id),
    );
  };

  const persistSavedStatus = async (
    card: AICardData,
    targetStatus: SavedRecStatus,
  ): Promise<void> => {
    const existing = savedByKey[cardKey(card)];
    try {
      if (!existing) {
        const created = await libraryApi.saveRecommendation(
          aiCardToSavePayload(card, targetStatus, meta?.modelUsed),
        );
        upsertSaved(created);
        toast.success(
          targetStatus === 'considering'
            ? 'Добавлено в «Подумаю»'
            : 'Добавлено в «Избранное»',
        );
      } else if (existing.status === targetStatus) {
        await libraryApi.removeSavedRecommendation(existing.id);
        removeSaved(existing.id);
        toast.success('Убрано');
      } else {
        const updated = await libraryApi.updateSavedRecommendationStatus(
          existing.id,
          targetStatus,
        );
        upsertSaved(updated);
        toast.success(
          targetStatus === 'considering'
            ? 'Перемещено в «Подумаю»'
            : 'Перемещено в «Избранное»',
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Не удалось сохранить';
      toast.error(msg);
    }
  };

  const handleConsider = (card: AICardData) => {
    void persistSavedStatus(card, 'considering');
  };

  const handleFavorite = (card: AICardData) => {
    void persistSavedStatus(card, 'favorited');
  };

  const consentKey = useMemo(
    () => (userId && source === 'claude-api' ? `claude_consent_${userId}` : null),
    [userId, source],
  );
  const [consentGiven, setConsentGiven] = useState<boolean>(() =>
    consentKey ? localStorage.getItem(consentKey) === '1' : true,
  );
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);

  // Local CLIs don't need consent (runs locally) — auto-accept whenever source flips
  useEffect(() => {
    if (source === 'claude-cli' || source === 'codex-cli') {
      setConsentGiven(true);
    } else if (consentKey) {
      setConsentGiven(localStorage.getItem(consentKey) === '1');
    }
  }, [source, consentKey]);

  const sourceMisconfigured = useMemo(() => {
    if (source === 'claude-api') {
      return !prefs?.hasAnthropicApiKey
        ? 'Не задан Anthropic API key — добавьте в Настройках → AI'
        : null;
    }
    return null;
  }, [source, prefs?.hasAnthropicApiKey]);

  const activeExtrasCount =
    (mood ? 1 : 0) + genres.length + (newForMe ? 1 : 0);
  const hasNonDefaultParams =
    activeExtrasCount > 0 ||
    count !== 10 ||
    selectedTypes.length !== DEFAULT_CONTENT_TYPES.length ||
    selectedTypes.some((t) => !DEFAULT_CONTENT_TYPES.includes(t));

  const resetParams = () => {
    setMood(null);
    setSelectedTypes(DEFAULT_CONTENT_TYPES);
    setCount(10);
    setGenres([]);
    setNewForMe(false);
  };

  const toggleType = (t: ContentTypeFilter) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const beginStream = async () => {
    setCards([]);
    setProgress([]);
    setMeta(null);
    setError(null);
    setDurationMs(null);
    setIsStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const typesPicked =
        selectedTypes.length > 0 &&
        selectedTypes.length < ALL_CONTENT_TYPES.length;
      const hasGenres = genres.length > 0;

      const filters =
        typesPicked || hasGenres
          ? {
              ...(typesPicked ? { types: selectedTypes } : {}),
              ...(hasGenres ? { genres } : {}),
            }
          : undefined;

      // Exclude titles already shown in last batch — don't repeat them
      const excludeTitles = cards
        .map((c) => c.title)
        .filter((t): t is string => typeof t === 'string' && t.length > 0);

      const payload = {
        source,
        prompt: prompt.trim() || undefined,
        mood: mood ?? undefined,
        filters,
        count,
        newForMe,
        excludeTitles: excludeTitles.length > 0 ? excludeTitles : undefined,
      };

      let receivedTerminal = false;
      for await (const evt of streamAiRecommendations(payload, ac.signal)) {
        applyEvent(evt);
        if (evt.kind === 'done' || evt.kind === 'error') {
          receivedTerminal = true;
        }
      }
      if (!receivedTerminal && !ac.signal.aborted) {
        setError({
          code: 'unknown',
          message: 'Стрим прервался без финального события',
        });
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        // user-initiated cancel
      } else {
        const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
        const stack = err instanceof Error ? err.stack : undefined;
        setError({
          message: msg,
          code: 'unknown',
          details: stack ? { stderr: stack } : undefined,
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const applyEvent = (evt: AiStreamEvent) => {
    switch (evt.kind) {
      case 'open':
        break;
      case 'progress':
        setProgress((prev) => [
          ...prev.slice(-19),
          {
            stage: evt.stage,
            message: evt.message,
            detail: evt.detail,
            ts: Date.now(),
          },
        ]);
        break;
      case 'card':
        setCards((prev) => [...prev, evt.card]);
        break;
      case 'meta': {
        const { kind, ...rest } = evt;
        void kind;
        setMeta(rest);
        break;
      }
      case 'done':
        setDurationMs(evt.durationMs);
        if (evt.recommendations === 0) {
          toast.warning(
            'Получено 0 рекомендаций. Попробуйте уточнить запрос или сменить источник.',
          );
        } else {
          toast.success(
            `Готово: ${evt.recommendations} карточек за ${(evt.durationMs / 1000).toFixed(1)}с`,
          );
          void notifyRecommendationsReady(evt.recommendations, evt.durationMs);
        }
        break;
      case 'error':
        setError({
          message: evt.message,
          code: evt.code,
          details: evt.details,
        });
        toast.error(evt.message);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStreaming) return;
    if (sourceMisconfigured) {
      toast.error(sourceMisconfigured);
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error('Выберите хотя бы один тип контента');
      return;
    }
    if (!consentGiven) {
      setConsentDialogOpen(true);
      return;
    }
    void beginStream();
  };

  const handleConsentAccept = () => {
    if (consentKey) localStorage.setItem(consentKey, '1');
    setConsentGiven(true);
    setConsentDialogOpen(false);
    void beginStream();
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  // Cancel on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Persist cards across reloads — write whenever cards/meta change post-stream
  useEffect(() => {
    if (isStreaming) return;
    if (!userId) return;
    if (cards.length === 0 && !meta && durationMs === null) return;
    saveCachedResults(userId, {
      cards,
      meta,
      durationMs,
      ts: Date.now(),
    });
  }, [cards, meta, durationMs, isStreaming, userId]);

  const showSkeletons = isStreaming && cards.length < count;
  const skeletonCount = Math.max(0, count - cards.length);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 shrink-0">
                  <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">
                    AI-ассистент
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight truncate">
                    Персональные рекомендации на основе вашей библиотеки
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium bg-background/60"
                >
                  {sourceLabel}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Настройки AI"
                  onClick={() => navigate('/settings?tab=integrations')}
                >
                  <SettingsIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setParamsOpen(true)}
                disabled={isStreaming}
                title="Параметры рекомендаций: настроение, тип, жанры"
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                Параметры
                {activeExtrasCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                    {activeExtrasCount}
                  </span>
                )}
              </Button>
            </div>

            {sourceMisconfigured && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {sourceMisconfigured}
                  <button
                    type="button"
                    className="ml-1 inline-flex items-center gap-1 underline"
                    onClick={() => navigate('/settings?tab=integrations')}
                  >
                    Открыть
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <textarea
                ref={promptRef}
                rows={1}
                className="flex-1 rounded-xl border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-11.5 max-h-60 resize-none overflow-y-auto pretty-scrollbar"
                placeholder="Что хотите увидеть? Опишите своими словами или оставьте пустым — AI решит сам по вашей истории"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={2000}
                disabled={isStreaming}
              />
              <div className="flex sm:flex-col gap-2 sm:w-44 shrink-0">
                {!isStreaming ? (
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none h-11.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 text-white border-0 shadow-lg"
                    size="lg"
                    disabled={!!sourceMisconfigured}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Спросить
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      className="flex-1 sm:flex-none h-11.5"
                      size="lg"
                      variant="secondary"
                      disabled
                    >
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Думает...
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="destructive"
                      onClick={handleCancel}
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Остановить
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Dialog open={paramsOpen} onOpenChange={setParamsOpen}>
              <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Параметры рекомендаций</DialogTitle>
                  <DialogDescription>
                    Тонкая настройка выдачи — всё опционально
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  <MoodPicker value={mood} onChange={setMood} />

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Тип контента</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_CONTENT_TYPES.map((t) => {
                        const active = selectedTypes.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleType(t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                              active
                                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                                : 'border-border bg-background/60 text-muted-foreground hover:bg-muted/40'
                            }`}
                          >
                            {CONTENT_TYPE_LABELS[t]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Количество карточек
                    </label>
                    <Select
                      value={String(count)}
                      onValueChange={(v) => setCount(Number(v))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNT_OPTIONS.map((c) => (
                          <SelectItem key={c} value={String(c)}>
                            {c} карточек
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Жанры{' '}
                      <span className="text-muted-foreground font-normal text-xs">
                        (опционально)
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_GENRES.map((g) => {
                        const active = genres.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGenre(g)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                              active
                                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                                : 'border-border bg-background/60 text-muted-foreground hover:bg-muted/40'
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewForMe((v) => !v)}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                      newForMe
                        ? 'border-fuchsia-500 bg-gradient-to-br from-fuchsia-500/10 via-pink-500/10 to-rose-500/10'
                        : 'border-border bg-background/40 hover:border-fuchsia-500/40'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        ✨ Новое для меня
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {newForMe
                          ? 'AI предложит жанры, которых нет в библиотеке'
                          : 'Опираться на ваши вкусы из библиотеки'}
                      </div>
                    </div>
                    <div
                      className={`ml-3 w-10 h-6 rounded-full transition-all flex items-center px-1 shrink-0 ${
                        newForMe
                          ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 justify-end'
                          : 'bg-muted justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </button>
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!hasNonDefaultParams}
                    onClick={resetParams}
                  >
                    Сбросить
                  </Button>
                  <Button type="button" onClick={() => setParamsOpen(false)}>
                    Готово
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 min-w-0">
        {isStreaming && (
          <ProgressTimeline
            entries={progress}
            cardsCount={cards.length}
            target={count}
          />
        )}

        {(meta || durationMs !== null) && cards.length > 0 && (
          <ResultsHeader
            meta={meta}
            durationMs={durationMs}
            count={cards.length}
          />
        )}

        {error && (
          <ErrorPanel
            error={error}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails((v) => !v)}
            onClose={() => {
              setError(null);
              setShowDetails(false);
            }}
          />
        )}

        {(cards.length > 0 || isStreaming) && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {cards.map((card, idx) => {
              const saved = savedByKey[cardKey(card)];
              return (
                <AICard
                  key={`${card.title}-${idx}`}
                  card={card}
                  index={idx}
                  onAdd={(c) => {
                    const initial = aiCardToAddMediaInitial(c);
                    _onAdd(
                      {
                        title: initial.title,
                        description: initial.description,
                        image: initial.image,
                        rating: initial.rating,
                        genres: initial.genres,
                        category: initial.category,
                        source: initial.source,
                      },
                      saved?.id,
                    );
                  }}
                  onConsider={handleConsider}
                  onFavorite={handleFavorite}
                  considerActive={saved?.status === 'considering'}
                  favoriteActive={saved?.status === 'favorited'}
                />
              );
            })}
            {showSkeletons &&
              Array.from({ length: Math.min(skeletonCount, 6) }).map(
                (_, i) => (
                  <div key={`skel-${i}`} className="space-y-3">
                    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ),
              )}
          </div>
        )}

        {!isStreaming && cards.length === 0 && !error && progress.length === 0 && (
          <EmptyState />
        )}
      </div>

      <ConsentDialog
        open={consentDialogOpen}
        onCancel={() => setConsentDialogOpen(false)}
        onAccept={handleConsentAccept}
      />
    </div>
  );
}

function ProgressTimeline({
  entries,
  cardsCount,
  target,
}: {
  entries: ProgressEntry[];
  cardsCount: number;
  target: number;
}) {
  const last = entries[entries.length - 1];
  const startedAt = entries[0]?.ts;
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const elapsed = startedAt ? ((now - startedAt) / 1000).toFixed(0) : '0';
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span className="text-sm font-semibold">
            {stageLabel(last)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {cardsCount}/{target} карточек · {elapsed}с
        </div>
      </div>

      {target > 0 && (
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, (cardsCount / target) * 100)}%`,
            }}
          />
        </div>
      )}

      {last?.detail && (
        <div className="rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground italic max-h-24 overflow-y-auto whitespace-pre-wrap break-words">
          {last.detail}
        </div>
      )}

      {entries.length > 1 && (
        <details className="text-[11px] text-muted-foreground">
          <summary className="cursor-pointer select-none hover:text-foreground">
            История ({entries.length} событий)
          </summary>
          <ol className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-2">
            {entries
              .slice()
              .reverse()
              .map((e, idx) => (
                <li
                  key={`${e.ts}-${idx}`}
                  className="flex items-start gap-2 leading-tight"
                >
                  <span className="text-muted-foreground/50 tabular-nums min-w-[40px]">
                    +{((e.ts - (startedAt ?? e.ts)) / 1000).toFixed(1)}с
                  </span>
                  <span className="font-medium">
                    {stageLabel(e)}
                  </span>
                </li>
              ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function ErrorPanel({
  error,
  showDetails,
  onToggleDetails,
  onClose,
}: {
  error: Pick<AiStreamError, 'message' | 'code'> & {
    details?: AiStreamErrorDetails;
  };
  showDetails: boolean;
  onToggleDetails: () => void;
  onClose: () => void;
}) {
  const hasDetails = !!error.details && Object.keys(error.details).length > 0;
  const isCodex = (error.details?.binPath ?? '')
    .toLowerCase()
    .includes('codex');
  const copy = () => {
    if (!error.details) return;
    void navigator.clipboard.writeText(
      JSON.stringify(
        { code: error.code, message: error.message, details: error.details },
        null,
        2,
      ),
    );
    toast.success('Скопировано в буфер обмена');
  };

  return (
    <div className="border border-rose-500/30 bg-rose-500/5 rounded-2xl p-6 space-y-3">
      <div className="text-center space-y-2">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-semibold">Не получилось</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {error.message}
        </p>
        {error.code === 'cli_not_installed' && (
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Установите CLI:{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded">
              {isCodex
                ? 'npm install -g @openai/codex'
                : 'npm install -g @anthropic-ai/claude-code'}
            </code>
          </p>
        )}
        {error.code === 'cli_not_authed' && (
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Запустите в терминале:{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded">
              {isCodex ? 'codex login' : 'claude'}
            </code>{' '}
            и выполните вход.
          </p>
        )}
      </div>

      <div className="flex justify-center gap-2">
        {hasDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDetails}
            className="gap-1"
          >
            {showDetails ? 'Скрыть подробности' : 'Подробнее'}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onClose}>
          Закрыть
        </Button>
      </div>

      {hasDetails && showDetails && (
        <div className="rounded-xl border bg-background/60 p-3 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Код: {error.code ?? 'неизвестно'}
              {error.details?.exitCode !== undefined && (
                <> · выход {error.details.exitCode}</>
              )}
              {error.details?.signal && <> · сигнал {error.details.signal}</>}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={copy}
              className="h-6 text-[11px]"
            >
              Копировать
            </Button>
          </div>
          {error.details?.binPath && (
            <KeyValue k="путь к CLI" v={error.details.binPath} />
          )}
          {error.details?.argv && (
            <KeyValue k="аргументы" v={error.details.argv.join(' ')} />
          )}
          {error.details?.stderr && (
            <Block k="stderr" v={error.details.stderr} />
          )}
          {error.details?.stdout && (
            <Block k="stdout (хвост)" v={error.details.stdout} />
          )}
        </div>
      )}
    </div>
  );
}

function KeyValue({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-[11px] font-mono leading-relaxed">
      <span className="text-muted-foreground">{k}:</span>{' '}
      <span className="break-all">{v}</span>
    </div>
  );
}

function Block({ k, v }: { k: string; v: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] text-muted-foreground font-semibold">{k}</div>
      <pre className="text-[11px] font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-40 overflow-auto">
        {v.trim() || '(пусто)'}
      </pre>
    </div>
  );
}

function ResultsHeader({
  meta,
  durationMs,
  count,
}: {
  meta: AiStreamMeta | null;
  durationMs: number | null;
  count: number;
}) {
  const totalTokens =
    meta && (meta.tokensInput ?? 0) + (meta.tokensOutput ?? 0);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="font-medium">
          {count} карточек
        </Badge>
        {meta?.modelUsed && (
          <Badge variant="outline" className="font-medium">
            {meta.modelUsed}
          </Badge>
        )}
        {totalTokens && totalTokens > 0 && (
          <span>{totalTokens.toLocaleString('ru-RU')} токенов</span>
        )}
        {meta?.webSearched && (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
            <Globe className="w-3 h-3 mr-1" />
            веб-поиск
          </Badge>
        )}
        {meta?.libraryTruncated && (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0">
            библиотека усечена
          </Badge>
        )}
        {meta?.librarySize !== undefined && (
          <span>· библиотека: {meta.librarySize}</span>
        )}
        {durationMs !== null && (
          <span>· {(durationMs / 1000).toFixed(1)}с</span>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center text-muted-foreground bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 mb-4">
        <Brain className="w-12 h-12 text-indigo-500/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Готов к работе
      </h3>
      <p className="max-w-md mt-2">
        Заполните форму выше — AI проанализирует всю вашу библиотеку и
        предложит как классику, которую вы могли пропустить, так и актуальные
        новинки.
      </p>
    </div>
  );
}
