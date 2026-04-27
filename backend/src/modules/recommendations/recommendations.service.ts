import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { User } from '../../entities/user.entity';

type Recommendation = {
  title: string;
  image?: string;
  description?: string;
  rating?: number;
  genres: string[];
  category?: string;
  reason: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(MediaEntry)
    private mediaRepository: Repository<MediaEntry>,
    @InjectRepository(User) // Inject User repository
    private userRepository: Repository<User>,
  ) {}

  private genreMappingJikan: Record<string, number> = {
    Action: 1,
    Adventure: 2,
    Comedy: 4,
    'Sci-Fi': 24,
    'Slice of Life': 36,
    Fantasy: 10,
    Drama: 8,
    Romance: 22,
    Mystery: 7,
    Horror: 14,
    Thriller: 41,
    Supernatural: 37,
  };

  private genreMappingTmdb: Record<string, number> = {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 14,
    History: 36,
    Horror: 27,
    Music: 10402,
    Mystery: 9648,
    Romance: 10749,
    'Science Fiction': 878,
    'Sci-Fi': 878,
    Thriller: 53,
    War: 10752,
    Western: 37,
  };

  async getTopRatedInLibrary(userId: number, limit: number = 10) {
    // Возвращаем топ записи ДРУГИХ пользователей (исключая свои)
    return this.mediaRepository
      .createQueryBuilder('media')
      .where('media.userId != :userId', { userId })
      .orderBy('media.rating', 'DESC')
      .take(limit)
      .getMany();
  }

  async getRecommendationsByGenre(userId: number): Promise<Recommendation[]> {
    // 1. Fetch User Data (Preferences & Media)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const allMedia = await this.mediaRepository.find({
      where: { userId },
      select: [
        'id',
        'title',
        'genres',
        'rating',
        'image',
        'description',
        'category',
        'startDate',
      ],
    });

    if (allMedia.length === 0) {
      return [];
    }

    // Helper to safely parse genres
    const parseGenres = (genresData: unknown): string[] => {
      if (!genresData) return [];
      try {
        if (Array.isArray(genresData)) {
          return genresData.filter((g): g is string => typeof g === 'string');
        }
        if (typeof genresData !== 'string') return [];
        const parsed: unknown = JSON.parse(genresData);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((g): g is string => typeof g === 'string');
      } catch {
        if (typeof genresData === 'string') {
          return genresData.split(',').map((s) => s.trim());
        }
        return [];
      }
    };

    const parsedMedia = allMedia.map((m) => ({
      ...m,
      genresList: parseGenres(m.genres),
    }));

    // 2. Analyze User Preferences (Adaptive)
    const ratedMedia = parsedMedia
      .filter((m) => m.rating > 0)
      .sort((a, b) => b.rating - a.rating);
    let sourceMedia: typeof parsedMedia = [];

    if (ratedMedia.length === 0) {
      sourceMedia = parsedMedia;
    } else {
      const topCount = Math.max(3, Math.ceil(ratedMedia.length * 0.25));
      const thresholdIndex = Math.min(topCount, ratedMedia.length) - 1;
      const thresholdRating = ratedMedia[thresholdIndex].rating;
      sourceMedia = ratedMedia.filter((m) => m.rating >= thresholdRating);
    }

    const genreCounts: Record<string, number> = {};
    sourceMedia.forEach((m) => {
      m.genresList.forEach((g) => {
        if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([genre]) => genre)
      .slice(0, 3); // Top 3 genres for external search

    // 3. Internal Candidates (Backlog)
    let candidates = parsedMedia.filter((m) => !m.startDate);
    if (candidates.length === 0) {
      candidates = parsedMedia.filter((m) => m.rating === 0 || m.rating === 5);
    }

    // Score Internal
    const internalRecommendations = candidates
      .map((m) => {
        const matchCount = m.genresList.filter((g) =>
          topGenres.includes(g),
        ).length;
        const primaryBoost =
          topGenres[0] && m.genresList.includes(topGenres[0]) ? 2 : 0;
        return { ...m, score: matchCount + primaryBoost };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => ({
        title: r.title,
        image: r.image ?? undefined,
        description: r.description ?? undefined,
        rating: r.rating,
        genres: r.genresList,
        category: r.category ?? undefined,
        reason: 'Recommended from your backlog',
      }));

    // 4. External Recommendations
    let externalRecommendations: Recommendation[] = [];
    const tmdbKey = user?.preferences?.tmdbApiKey;

    // Fetch Jikan (Async, fail-safe)
    const jikanPromise = this.fetchJikanRecommendations(topGenres);

    // Fetch TMDB (only if key exists)
    const tmdbPromise = tmdbKey
      ? this.fetchTmdbRecommendations(topGenres, tmdbKey)
      : Promise.resolve([]);

    try {
      const [kikanResults, tmdbResults] = await Promise.all([
        jikanPromise,
        tmdbPromise,
      ]);
      externalRecommendations = [...kikanResults, ...tmdbResults];
    } catch {
      // Fail-safe: external sources should never break recommendations endpoint
    }

    // 5. Merge & Shuffle
    const allRecs = [...internalRecommendations, ...externalRecommendations];

    // Simple shuffle
    const shuffled = allRecs.sort(() => 0.5 - Math.random());
    return shuffled;
  }

  private async fetchJikanRecommendations(
    genres: string[],
  ): Promise<Recommendation[]> {
    try {
      // Map first valid genre
      const genreId = genres
        .map((g) => this.genreMappingJikan[g])
        .find((id) => id !== undefined);

      if (!genreId) return [];

      const response = await fetch(
        `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&limit=10`,
      );
      if (!response.ok) return [];

      const json: unknown = await response.json();
      if (!isRecord(json)) return [];

      const items = json.data;
      if (!Array.isArray(items)) return [];

      return items
        .map((raw): Recommendation | null => {
          if (!isRecord(raw)) return null;

          const title =
            typeof raw.title === 'string' ? raw.title : 'Unknown title';

          const images = isRecord(raw.images) ? raw.images : undefined;
          const jpg = images && isRecord(images.jpg) ? images.jpg : undefined;
          const image =
            jpg && typeof jpg.image_url === 'string'
              ? jpg.image_url
              : undefined;

          const synopsis =
            typeof raw.synopsis === 'string' ? raw.synopsis : undefined;
          const description = synopsis
            ? `${synopsis.slice(0, 200)}...`
            : undefined;

          const rating = typeof raw.score === 'number' ? raw.score : undefined;

          const genresRaw = Array.isArray(raw.genres) ? raw.genres : [];
          const genres = genresRaw
            .map((g) =>
              isRecord(g) && typeof g.name === 'string' ? g.name : null,
            )
            .filter((g): g is string => Boolean(g));

          return {
            title,
            image,
            description,
            rating,
            genres,
            category: 'Anime',
            reason: 'Popular Anime in your favorite genres',
          };
        })
        .filter((r): r is Recommendation => r !== null);
    } catch {
      return [];
    }
  }

  private async fetchTmdbRecommendations(
    genres: string[],
    apiKey: string,
  ): Promise<Recommendation[]> {
    try {
      const genreId = genres
        .map((g) => this.genreMappingTmdb[g])
        .find((id) => id !== undefined);

      if (!genreId) return [];

      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=1000&page=1`,
      );
      if (!response.ok) return [];

      const json: unknown = await response.json();
      if (!isRecord(json)) return [];

      const results = json.results;
      if (!Array.isArray(results)) return [];

      return results.slice(0, 8).map((raw): Recommendation => {
        const item = isRecord(raw) ? raw : {};
        const title = typeof item.title === 'string' ? item.title : 'Unknown';
        const posterPath =
          typeof item.poster_path === 'string' ? item.poster_path : undefined;
        const image = posterPath
          ? `https://image.tmdb.org/t/p/w500${posterPath}`
          : undefined;
        const description =
          typeof item.overview === 'string' ? item.overview : undefined;
        const rating =
          typeof item.vote_average === 'number' ? item.vote_average : undefined;

        return {
          title,
          image,
          description,
          rating,
          genres: [],
          category: 'Movie',
          reason: 'Top Rated Movie matching your taste',
        };
      });
    } catch {
      return [];
    }
  }
}
