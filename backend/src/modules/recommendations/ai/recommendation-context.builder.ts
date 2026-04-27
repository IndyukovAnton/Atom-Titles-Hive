import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaEntry } from '../../../entities/media-entry.entity';
import { User } from '../../../entities/user.entity';
import { ImageSearchService } from '../../media/image-search.service';
import { AICard, ContentType, MoodTag } from '../dto/claude-recommendation.dto';
import { AiRequestParams, BuiltContext } from './types';

const CATEGORY_TO_TYPE: Record<string, ContentType | 'other'> = {
  Фильм: 'movie',
  Movie: 'movie',
  Сериал: 'series',
  Series: 'series',
  Аниме: 'anime',
  Anime: 'anime',
  Книга: 'book',
  Book: 'book',
  Игра: 'game',
  Game: 'game',
};

const MOOD_GUIDANCE: Record<MoodTag, string> = {
  light:
    'Лёгкое, весёлое настроение. Избегай тяжёлых драм, депрессивных сюжетов, медленного темпа.',
  cozy: 'Уютное настроение. Тёплые, комфортные истории; хороши романтические комедии, slice-of-life, фэнтези с дружбой.',
  sad: 'Грустное настроение. Подойдут проникновенные драмы, истории о потере и принятии — но без чернухи и безысходности.',
  energetic:
    'Энергичное/боевое настроение. Боевики, киберпанк, спортивная драма, динамичные триллеры.',
  thoughtful:
    'Хочется поразмыслить. Сложные сюжеты, философские темы, неоднозначные финалы — sci-fi, нуар, психологические триллеры.',
  thrilling:
    'Адреналин/страх. Хорроры, психологические триллеры, мистика — pure escapism через напряжение.',
  romantic:
    'Романтическое настроение. Истории любви разных жанров; can include romcom, мелодрама, slow burn.',
  escapist:
    'Эскапизм / уход в другой мир. Высокое фэнтези, sci-fi с world-building, эпические саги, изоляты типа Stranger Things.',
};

const TARGET_LIBRARY_TOKEN_BUDGET = 50_000;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const parseGenres = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw))
    return raw.filter((g): g is string => typeof g === 'string');
  if (typeof raw !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.filter((g): g is string => typeof g === 'string');
  } catch {
    // not JSON — fall through to comma-split
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const normalizeTitle = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[«»"'.!?,:;-]/g, '')
    .trim();

interface CachedLibrarySnapshot {
  ts: number;
  libraryBlock: string;
  libraryTruncated: boolean;
  librarySize: number;
  userTitleSet: Set<string>;
  tmdbApiKey?: string;
}

const LIBRARY_CACHE_TTL_MS = 10 * 60_000; // 10 минут

@Injectable()
export class RecommendationContextBuilder {
  // Per-user library snapshot cache. Library hardly changes within a session,
  // so reusing the snapshot avoids a heavy DB read + compaction on every retry.
  private readonly libraryCache = new Map<number, CachedLibrarySnapshot>();

  constructor(
    @InjectRepository(MediaEntry)
    private readonly mediaRepository: Repository<MediaEntry>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly imageSearch: ImageSearchService,
  ) {}

  invalidateUser(userId: number): void {
    this.libraryCache.delete(userId);
  }

  async build(userId: number, params: AiRequestParams): Promise<BuiltContext> {
    let snap = this.libraryCache.get(userId);
    if (!snap || Date.now() - snap.ts > LIBRARY_CACHE_TTL_MS) {
      const [user, allMedia] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.mediaRepository.find({
          where: { userId },
          select: [
            'id',
            'title',
            'rating',
            'genres',
            'category',
            'description',
            'startDate',
            'endDate',
            'updatedAt',
          ],
        }),
      ]);

      const tmdbApiKey = user?.preferences?.tmdbApiKey;
      const { libraryBlock, libraryTruncated } =
        this.buildLibrarySnapshot(allMedia);
      const userTitleSet = new Set(
        allMedia.map((m) => normalizeTitle(m.title)),
      );

      snap = {
        ts: Date.now(),
        libraryBlock,
        libraryTruncated,
        librarySize: allMedia.length,
        userTitleSet,
        tmdbApiKey,
      };
      this.libraryCache.set(userId, snap);
    }

    const newForMe = !!params.newForMe;
    const systemPrompt = this.buildSystemPrompt(params.count, newForMe);
    const userMessage = this.buildUserMessage(
      snap.libraryBlock,
      params.prompt,
      params.mood,
      params.filters,
      params.count,
      newForMe,
      params.excludeTitles ?? [],
    );

    return {
      systemPrompt,
      userMessage,
      userTitleSet: snap.userTitleSet,
      libraryTruncated: snap.libraryTruncated,
      librarySize: snap.librarySize,
      count: params.count,
      useWebSearch: params.useWebSearch,
      newForMe,
      tmdbApiKey: snap.tmdbApiKey,
    };
  }

  /**
   * Best-effort TMDB poster lookup. Searches by originalTitle (preferred) or
   * title, optionally year-narrowed. Picks /search/tv for series/anime,
   * /search/movie otherwise. Books and games skipped.
   */
  async enrichWithPoster(card: AICard, tmdbApiKey: string): Promise<AICard> {
    if (card.type === 'book' || card.type === 'game' || card.type === 'other') {
      return card;
    }
    try {
      const posterUrl = await this.fetchTmdbPoster(card, tmdbApiKey);
      return posterUrl ? { ...card, posterUrl } : card;
    } catch {
      return card;
    }
  }

  /**
   * Cover lookup that works for ALL media types (movies, books, games etc.)
   * via the same Bing-based search the rest of the app uses for cover picking.
   * Used as a fallback when TMDB has no key or no result.
   */
  async enrichWithCover(card: AICard): Promise<AICard> {
    if (card.posterUrl) return card;
    const queryParts = [
      card.originalTitle ?? card.title,
      card.year ? String(card.year) : '',
      this.coverQueryHint(card.type),
    ].filter(Boolean);
    const query = queryParts.join(' ').trim();
    if (!query) return card;

    try {
      const results = await this.imageSearch.searchImages(query, 0);
      if (results.length === 0) return card;
      const first = results[0];
      // Prefer thumbnail (smaller, faster, works inline) — fall back to murl
      const url = first.thumbnail || first.url;
      return { ...card, posterUrl: url };
    } catch {
      return card;
    }
  }

  private coverQueryHint(type: AICard['type']): string {
    switch (type) {
      case 'movie':
        return 'movie poster';
      case 'series':
        return 'tv series poster';
      case 'anime':
        return 'anime poster';
      case 'book':
        return 'book cover';
      case 'game':
        return 'game cover';
      default:
        return 'cover';
    }
  }

  private async fetchTmdbPoster(
    card: AICard,
    tmdbApiKey: string,
  ): Promise<string | undefined> {
    const path =
      card.type === 'series' || card.type === 'anime'
        ? 'search/tv'
        : 'search/movie';
    const yearParam =
      card.type === 'series' || card.type === 'anime'
        ? 'first_air_date_year'
        : 'year';
    const query = card.originalTitle ?? card.title;
    if (!query) return undefined;

    const params = new URLSearchParams({
      api_key: tmdbApiKey,
      query,
      language: 'ru-RU',
      include_adult: 'false',
    });
    if (card.year) params.set(yearParam, String(card.year));

    const response = await fetch(
      `https://api.themoviedb.org/3/${path}?${params.toString()}`,
    );
    if (!response.ok) return undefined;

    const json: unknown = await response.json();
    if (!isRecord(json)) return undefined;
    const results: unknown = json.results;
    if (!Array.isArray(results) || results.length === 0) return undefined;

    const first: unknown = results[0];
    if (!isRecord(first)) return undefined;
    const posterPath = first.poster_path;
    if (typeof posterPath !== 'string') return undefined;

    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  }

  /**
   * Validates and normalizes a raw card object received from any AI source.
   * Returns null if required fields are missing.
   */
  toolInputToCard(raw: unknown, userLibrary: Set<string>): AICard | null {
    if (!isRecord(raw)) return null;

    const title = typeof raw.title === 'string' ? raw.title : null;
    const type =
      typeof raw.type === 'string' &&
      ['movie', 'series', 'anime', 'book', 'game', 'other'].includes(raw.type)
        ? (raw.type as AICard['type'])
        : null;
    const why =
      typeof raw.whyRecommended === 'string' ? raw.whyRecommended : null;

    if (!title || !type || !why) return null;

    const notInLibrary = !userLibrary.has(normalizeTitle(title));

    return {
      title,
      originalTitle:
        typeof raw.originalTitle === 'string' ? raw.originalTitle : undefined,
      type,
      year: typeof raw.year === 'number' ? raw.year : undefined,
      genres: Array.isArray(raw.genres)
        ? raw.genres.filter((g): g is string => typeof g === 'string')
        : [],
      whyRecommended: why,
      estimatedRating:
        typeof raw.estimatedRating === 'number'
          ? raw.estimatedRating
          : undefined,
      releasedRecently:
        typeof raw.releasedRecently === 'boolean'
          ? raw.releasedRecently
          : undefined,
      notInLibrary,
    };
  }

  private buildSystemPrompt(count: number, newForMe: boolean): string {
    if (newForMe) {
      return `Ты — персональный рекомендатель медиа-контента в приложении Seen. Сейчас режим «Новое для меня» — пользователь хочет ВЫЙТИ за пределы своих обычных вкусов и попробовать что-то незнакомое.

Правила:
1. Изучи библиотеку пользователя — посмотри на ДОМИНИРУЮЩИЕ у него жанры/типы контента/настроения.
2. Предложи тайтлы в жанрах/настроениях, которых у него ПОЧТИ НЕТ или СОВСЕМ НЕТ в библиотеке. Это режим открытия — сознательно вытащи его из «зоны комфорта».
3. Но всё равно качественно — выбирай знаковые/культовые произведения, чтобы первое знакомство с жанром было удачным, а не разочаровывающим.
4. НЕ рекомендуй то, что уже есть в библиотеке пользователя.
5. Включай как актуальные новинки (через web_search), так и проверенную классику.
6. В \`whyRecommended\` объясни ИМЕННО почему этот тайтл — открытие нового. Например: «У вас почти нет хорроров, а это идеальная точка входа в жанр». Максимум 300 символов.
7. Каждую карточку отдавай в требуемом формате (структурированный вывод).
8. Сделай ровно ${count} карточек. Не больше, не меньше.
9. Отвечай на русском (внутри карточек).`;
    }
    return `Ты — персональный рекомендатель медиа-контента в приложении Seen. Пользователь даст тебе свою библиотеку (всё, что он смотрел/читал/играл с оценками и жанрами) и попросит ${count} рекомендаций.

ГЛАВНЫЙ ПРИНЦИП: жёстко опирайся на УЖЕ ПРЕДСТАВЛЕННЫЕ в библиотеке жанры/типы/настроения. Не предлагай тайтлы в жанрах, которых у пользователя НЕТ или ПОЧТИ НЕТ — это будет промах. Если у него 80% sci-fi и triller — рекомендуй из этих орбит, а не вдруг slice-of-life.

Правила:
1. Перед выбором каждой рекомендации проверь — соответствует ли её жанр/настроение тому, что пользователь УЖЕ смотрел и оценивал высоко.
2. Используй ВСЮ переданную статистику: какие жанры доминируют у высоких оценок, что пользователь не любит (низкие оценки), что давно в backlog без startDate.
3. Микс должен включать:
   - КЛАССИКУ в его жанрах, которую пользователь, возможно, не знает (заполняй пробелы внутри его вкусов)
   - АКТУАЛЬНЫЕ НОВИНКИ в его жанрах — релизы за последние 6 месяцев или ожидаемые. Используй web_search для проверки актуальности.
4. НЕ рекомендуй то, что уже есть в библиотеке пользователя.
5. В \`whyRecommended\` ссылайся на конкретные тайтлы пользователя по именам (например: «Вы поставили "Inception" 9/10 — этот фильм похож по теме сложной структуры реальности»). Максимум 300 символов.
6. Если задано настроение (mood) — оно сужает выбор внутри его жанров, но не оправдывает выход в чужие.
7. Если пользователь дал свободный текстовый запрос — он перевешивает автоматический анализ вкусов.
8. Для releasedRecently=true — реально проверь через web_search дату релиза.
9. Сделай ровно ${count} карточек. Не больше, не меньше.
10. Отвечай на русском (внутри карточек).`;
  }

  private buildUserMessage(
    libraryBlock: string,
    prompt: string | undefined,
    mood: MoodTag | undefined,
    filters:
      | { types?: ContentType[]; minRating?: number; genres?: string[] }
      | undefined,
    count: number,
    newForMe: boolean,
    excludeTitles: string[],
  ): string {
    const lines: string[] = [];

    lines.push('=== МОЯ БИБЛИОТЕКА ===');
    lines.push(libraryBlock);
    lines.push('');

    if (prompt && prompt.trim()) {
      lines.push('=== МОЙ ЗАПРОС ===');
      lines.push(prompt.trim());
      lines.push('');
    }

    if (mood) {
      lines.push('=== МОЁ НАСТРОЕНИЕ ===');
      lines.push(MOOD_GUIDANCE[mood]);
      lines.push('');
    }

    if (filters) {
      const constraints: string[] = [];
      if (filters.types && filters.types.length > 0) {
        constraints.push(
          `Только эти типы контента: ${filters.types.join(', ')}.`,
        );
      }
      if (typeof filters.minRating === 'number') {
        constraints.push(
          `Только тайтлы с публичным рейтингом ≥ ${filters.minRating}.`,
        );
      }
      if (filters.genres && filters.genres.length > 0) {
        constraints.push(
          `Приоритет жанрам: ${filters.genres.join(', ')}. Если возможно, рекомендации должны попадать хотя бы в один из них.`,
        );
      }
      if (constraints.length > 0) {
        lines.push('=== ОГРАНИЧЕНИЯ ===');
        lines.push(constraints.join('\n'));
        lines.push('');
      }
    }

    if (newForMe) {
      lines.push('=== РЕЖИМ ===');
      lines.push(
        'Новое для меня: предложи тайтлы в жанрах/настроениях, которых нет (или очень мало) в моей библиотеке. Хочу выйти из зоны комфорта.',
      );
      lines.push('');
    }

    if (excludeTitles.length > 0) {
      lines.push('=== УЖЕ ПРЕДЛАГАЛ В ПРЕДЫДУЩИХ ЗАПРОСАХ — НЕ ПОВТОРЯЙ ===');
      const limited = excludeTitles.slice(0, 60);
      lines.push(limited.map((t, i) => `${i + 1}. ${t}`).join('\n'));
      lines.push('');
    }

    lines.push(`Выдай ${count} рекомендаций в требуемом формате.`);

    return lines.join('\n');
  }

  /**
   * Compact representation of the user's library. Tries to fit within the token
   * budget; falls back to truncation if the library is enormous.
   */
  private buildLibrarySnapshot(media: MediaEntry[]): {
    libraryBlock: string;
    libraryTruncated: boolean;
  } {
    if (media.length === 0) {
      return {
        libraryBlock: '(пусто — ещё ничего не отмечено)',
        libraryTruncated: false,
      };
    }

    const enriched = media.map((m) => ({
      title: m.title,
      type: this.mapCategoryToType(m.category),
      rating: m.rating ?? 0,
      genres: parseGenres(m.genres),
      description: m.description,
      hasStartDate: !!m.startDate,
      hasEndDate: !!m.endDate,
      updatedAt: m.updatedAt,
    }));

    const compactLine = (e: (typeof enriched)[number], i: number): string => {
      const status = e.hasEndDate
        ? 'completed'
        : e.hasStartDate
          ? 'watching'
          : 'backlog';
      const rating = e.rating > 0 ? `${e.rating}★` : 'unrated';
      const genres = e.genres.join('/') || '—';
      return `${i + 1}. [${e.type}] ${e.title} — ${rating} — ${status} — ${genres}`;
    };

    const compactLines = enriched.map(compactLine);
    const compactBlock = compactLines.join('\n');

    const ratedSorted = enriched
      .filter((e) => e.rating > 0)
      .slice()
      .sort((a, b) => b.rating - a.rating);

    const top10 = ratedSorted.slice(0, 10);
    const worst10 = ratedSorted
      .slice()
      .reverse()
      .filter((e) => e.rating > 0)
      .slice(0, 10);

    const detailedBlock = (label: string, items: typeof enriched): string => {
      if (items.length === 0) return '';
      const lines = items.map((e) => {
        const desc = (e.description ?? '').slice(0, 200).replace(/\s+/g, ' ');
        return `- "${e.title}" (${e.type}) ★${e.rating} — ${desc || '(без описания)'}`;
      });
      return `\n=== ${label} ===\n${lines.join('\n')}`;
    };

    const aggregates = this.aggregateStats(enriched);

    let block =
      `Всего записей: ${media.length}\n\n` +
      `--- Все тайтлы (компактно) ---\n${compactBlock}` +
      detailedBlock('Топ-10 любимых (с описанием)', top10) +
      detailedBlock('Топ-10 нелюбимых (с описанием)', worst10) +
      `\n\n=== АГРЕГАТЫ ===\n${aggregates}`;

    let truncated = false;
    const estimatedTokens = block.length / 4;

    if (estimatedTokens > TARGET_LIBRARY_TOKEN_BUDGET) {
      truncated = true;
      const rated = enriched.filter((e) => e.rating > 0);
      const recent = enriched
        .slice()
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 200);
      const seen = new Set<string>();
      const subset = [...rated, ...recent].filter((e) => {
        const key = normalizeTitle(e.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const subsetCompact = subset.map(compactLine).join('\n');
      block =
        `Всего записей: ${media.length} (передан subset из ${subset.length} — оригинал слишком большой для контекста)\n\n` +
        `--- Subset тайтлов ---\n${subsetCompact}` +
        detailedBlock('Топ-10 любимых (с описанием)', top10) +
        detailedBlock('Топ-10 нелюбимых (с описанием)', worst10) +
        `\n\n=== АГРЕГАТЫ ===\n${aggregates}`;
    }

    return { libraryBlock: block, libraryTruncated: truncated };
  }

  private aggregateStats(
    items: Array<{
      type: ContentType | 'other';
      rating: number;
      genres: string[];
    }>,
  ): string {
    const genreStats = new Map<string, { count: number; sumRating: number }>();
    const typeCounts = new Map<string, number>();

    for (const e of items) {
      typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
      for (const g of e.genres) {
        const cur = genreStats.get(g) ?? { count: 0, sumRating: 0 };
        cur.count++;
        if (e.rating > 0) cur.sumRating += e.rating;
        genreStats.set(g, cur);
      }
    }

    const topGenres = [...genreStats.entries()]
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 7)
      .map(([g, s]) => {
        const avg = s.count > 0 ? (s.sumRating / s.count).toFixed(1) : '—';
        return `${g} (${s.count} тайтлов, avg ★${avg})`;
      })
      .join(', ');

    const typeDist = [...typeCounts.entries()]
      .map(([t, c]) => `${t}: ${c}`)
      .join(', ');

    return `Топ жанры: ${topGenres}\nТипы контента: ${typeDist}`;
  }

  private mapCategoryToType(category: string | null): ContentType | 'other' {
    if (!category) return 'other';
    return CATEGORY_TO_TYPE[category] ?? 'other';
  }
}
