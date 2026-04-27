# Задача BE-05: Обработка ошибок внешних API (Jikan, TMDB)

## Приоритет
🟡 **ВАЖНЫЙ** - Надежность

## Зависимости
- BE-04: Тесты для RecommendationsService (для проверки обработки ошибок)

## Описание проблемы
RecommendationsService интегрируется с внешними API (Jikan для аниме, TMDB для фильмов), но нет надежной обработки:
- Таймаутов
- Rate limiting от API
- Недоступности сервиса
- Некорректных ответов
- Сетевых ошибок

Это может привести к падению приложения или зависанию запросов.

## Цель задачи
Реализовать надежную систему обработки ошибок внешних API с retry логикой, таймаутами, fallback механизмами и кэшированием.

## Чек-лист выполнения

### Этап 1: Установка зависимостей
- [ ] Установить пакеты:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm install axios-retry
  ```

### Этап 2: Создание HTTP Client с retry логикой
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\utils\http-client.service.ts`:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { HttpService } from '@nestjs/axios';
  import { ConfigService } from '@nestjs/config';
  import { LoggerService } from './logger.service';
  import { firstValueFrom, timeout, catchError, retry } from 'rxjs';
  import { AxiosError, AxiosRequestConfig } from 'axios';

  export interface HttpClientOptions {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    cacheTTL?: number;
  }

  @Injectable()
  export class HttpClientService {
    private cache = new Map<string, { data: any; expiresAt: number }>();

    constructor(
      private httpService: HttpService,
      private configService: ConfigService,
      private logger: LoggerService,
    ) {}

    async get<T>(
      url: string,
      config?: AxiosRequestConfig,
      options?: HttpClientOptions,
    ): Promise<T> {
      const cacheKey = `${url}${JSON.stringify(config)}`;
      
      // Проверка кэша
      if (options?.cacheTTL) {
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          await this.logger.log(`Cache hit for ${url}`);
          return cached.data;
        }
      }

      const timeoutMs = options?.timeout || 10000;
      const retries = options?.retries || 3;

      try {
        const response = await firstValueFrom(
          this.httpService.get<T>(url, config).pipe(
            timeout(timeoutMs),
            retry({
              count: retries,
              delay: (error, retryCount) => {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                this.logger.warn(
                  `Retry ${retryCount}/${retries} for ${url} after ${delay}ms`,
                );
                return new Promise(resolve => setTimeout(resolve, delay));
              },
            }),
            catchError((error: AxiosError) => {
              this.logger.error(
                `HTTP GET failed for ${url}`,
                error.message,
              );
              throw error;
            }),
          ),
        );

        // Сохранение в кэш
        if (options?.cacheTTL) {
          this.cache.set(cacheKey, {
            data: response.data,
            expiresAt: Date.now() + options.cacheTTL,
          });
        }

        return response.data;
      } catch (error) {
        if (error.name === 'TimeoutError') {
          await this.logger.error(`Request timeout for ${url}`);
          throw new Error(`Request timeout: ${url}`);
        }
        throw error;
      }
    }

    clearCache(): void {
      this.cache.clear();
      this.logger.log('HTTP cache cleared');
    }
  }
  ```

### Этап 3: Создание Jikan API Service
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\recommendations\jikan-api.service.ts`:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { HttpClientService } from '../../utils/http-client.service';
  import { LoggerService } from '../../utils/logger.service';

  interface JikanAnimeResponse {
    data: Array<{
      mal_id: number;
      title: string;
      score: number;
      genres: Array<{ name: string }>;
      synopsis: string;
      images: {
        jpg: { image_url: string };
      };
    }>;
  }

  @Injectable()
  export class JikanApiService {
    private readonly baseUrl = 'https://api.jikan.moe/v4';
    private readonly rateLimitDelay = 1000; // 1 запрос в секунду
    private lastRequestTime = 0;

    constructor(
      private httpClient: HttpClientService,
      private logger: LoggerService,
    ) {}

    private async waitForRateLimit(): Promise<void> {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.rateLimitDelay) {
        const waitTime = this.rateLimitDelay - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.lastRequestTime = Date.now();
    }

    async searchAnime(query: string, limit = 10): Promise<JikanAnimeResponse | null> {
      try {
        await this.waitForRateLimit();

        const url = `${this.baseUrl}/anime`;
        const params = { q: query, limit, order_by: 'score', sort: 'desc' };

        const response = await this.httpClient.get<JikanAnimeResponse>(
          url,
          { params },
          { timeout: 15000, retries: 3, cacheTTL: 3600000 }, // 1 час кэш
        );

        return response;
      } catch (error) {
        await this.logger.error(
          `Jikan API error for query "${query}"`,
          error.message,
        );
        return null; // Fallback: возвращаем null вместо падения
      }
    }

    async getAnimeByGenre(genreId: number, limit = 10): Promise<JikanAnimeResponse | null> {
      try {
        await this.waitForRateLimit();

        const url = `${this.baseUrl}/anime`;
        const params = { genres: genreId, limit, order_by: 'score', sort: 'desc' };

        const response = await this.httpClient.get<JikanAnimeResponse>(
          url,
          { params },
          { timeout: 15000, retries: 3, cacheTTL: 3600000 },
        );

        return response;
      } catch (error) {
        await this.logger.error(
          `Jikan API error for genre ${genreId}`,
          error.message,
        );
        return null;
      }
    }
  }
  ```

### Этап 4: Создание TMDB API Service
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\recommendations\tmdb-api.service.ts`:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { HttpClientService } from '../../utils/http-client.service';
  import { LoggerService } from '../../utils/logger.service';

  interface TMDBMovieResponse {
    results: Array<{
      id: number;
      title: string;
      vote_average: number;
      genre_ids: number[];
      overview: string;
      poster_path: string;
    }>;
  }

  @Injectable()
  export class TMDBApiService {
    private readonly baseUrl = 'https://api.themoviedb.org/3';

    constructor(
      private httpClient: HttpClientService,
      private logger: LoggerService,
    ) {}

    async searchMovies(
      query: string,
      apiKey: string,
      limit = 10,
    ): Promise<TMDBMovieResponse | null> {
      if (!apiKey) {
        await this.logger.warn('TMDB API key not provided');
        return null;
      }

      try {
        const url = `${this.baseUrl}/search/movie`;
        const params = { api_key: apiKey, query, page: 1 };

        const response = await this.httpClient.get<TMDBMovieResponse>(
          url,
          { params },
          { timeout: 10000, retries: 3, cacheTTL: 3600000 },
        );

        return response;
      } catch (error) {
        if (error.response?.status === 401) {
          await this.logger.error('Invalid TMDB API key');
        } else if (error.response?.status === 429) {
          await this.logger.error('TMDB rate limit exceeded');
        } else {
          await this.logger.error(
            `TMDB API error for query "${query}"`,
            error.message,
          );
        }
        return null;
      }
    }

    async getMoviesByGenre(
      genreId: number,
      apiKey: string,
      limit = 10,
    ): Promise<TMDBMovieResponse | null> {
      if (!apiKey) {
        await this.logger.warn('TMDB API key not provided');
        return null;
      }

      try {
        const url = `${this.baseUrl}/discover/movie`;
        const params = {
          api_key: apiKey,
          with_genres: genreId,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100,
          page: 1,
        };

        const response = await this.httpClient.get<TMDBMovieResponse>(
          url,
          { params },
          { timeout: 10000, retries: 3, cacheTTL: 3600000 },
        );

        return response;
      } catch (error) {
        await this.logger.error(
          `TMDB API error for genre ${genreId}`,
          error.message,
        );
        return null;
      }
    }
  }
  ```

### Этап 5: Обновление RecommendationsService
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\recommendations\recommendations.service.ts`
- [ ] Заменить прямые HTTP вызовы на использование JikanApiService и TMDBApiService:
  ```typescript
  import { JikanApiService } from './jikan-api.service';
  import { TMDBApiService } from './tmdb-api.service';

  @Injectable()
  export class RecommendationsService {
    constructor(
      @InjectRepository(MediaEntry)
      private mediaRepository: Repository<MediaEntry>,
      private jikanApi: JikanApiService,
      private tmdbApi: TMDBApiService,
      private logger: LoggerService,
    ) {}

    async getRecommendationsByGenres(userId: number): Promise<any[]> {
      try {
        // Получение внутренних рекомендаций
        const internalRecs = await this.getInternalRecommendations(userId);

        // Получение внешних рекомендаций
        const externalRecs = await this.getExternalRecommendations(userId);

        // Объединение и фильтрация
        return [...internalRecs, ...externalRecs].slice(0, 20);
      } catch (error) {
        await this.logger.error('Failed to get recommendations', error.message);
        // Fallback: возвращаем хотя бы внутренние рекомендации
        return this.getInternalRecommendations(userId);
      }
    }

    private async getExternalRecommendations(userId: number): Promise<any[]> {
      const recommendations = [];

      // Jikan API
      const animeRecs = await this.jikanApi.searchAnime('popular', 5);
      if (animeRecs?.data) {
        recommendations.push(...animeRecs.data.map(this.mapJikanToMedia));
      }

      // TMDB API
      const userPrefs = await this.getUserPreferences(userId);
      if (userPrefs?.tmdbApiKey) {
        const movieRecs = await this.tmdbApi.searchMovies(
          'popular',
          userPrefs.tmdbApiKey,
          5,
        );
        if (movieRecs?.results) {
          recommendations.push(...movieRecs.results.map(this.mapTMDBToMedia));
        }
      }

      return recommendations;
    }
  }
  ```

### Этап 6: Регистрация сервисов в модуле
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\recommendations\recommendations.module.ts`
- [ ] Добавить новые сервисы:
  ```typescript
  import { HttpModule } from '@nestjs/axios';
  import { HttpClientService } from '../../utils/http-client.service';
  import { JikanApiService } from './jikan-api.service';
  import { TMDBApiService } from './tmdb-api.service';

  @Module({
    imports: [
      TypeOrmModule.forFeature([MediaEntry]),
      HttpModule,
    ],
    providers: [
      RecommendationsService,
      HttpClientService,
      JikanApiService,
      TMDBApiService,
    ],
    controllers: [RecommendationsController],
  })
  export class RecommendationsModule {}
  ```

### Этап 7: Добавление Circuit Breaker (опционально)
- [ ] Установить пакет:
  ```bash
  npm install opossum
  npm install -D @types/opossum
  ```
- [ ] Обернуть API вызовы в circuit breaker для предотвращения каскадных отказов

### Этап 8: Создание health check эндпоинта
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\recommendations\recommendations.controller.ts`:
  ```typescript
  @Get('health')
  async checkHealth(): Promise<{
    jikan: string;
    tmdb: string;
  }> {
    const jikanStatus = await this.jikanApi.searchAnime('test', 1)
      ? 'healthy'
      : 'unhealthy';
    
    const tmdbStatus = 'unknown'; // Требует API key

    return { jikan: jikanStatus, tmdb: tmdbStatus };
  }
  ```

### Этап 9: Документация
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\docs\external-api-integration.md`:
  ```markdown
  # External API Integration

  ## Supported APIs
  - **Jikan API**: Anime recommendations (MyAnimeList)
  - **TMDB API**: Movie/TV recommendations

  ## Error Handling
  - Automatic retry (3 attempts)
  - Exponential backoff
  - Timeout: 10-15 seconds
  - Fallback to internal recommendations

  ## Rate Limiting
  - Jikan: 1 request/second
  - TMDB: Handled by API key limits

  ## Caching
  - Cache TTL: 1 hour
  - Reduces API calls
  - Improves performance

  ## Configuration
  ```env
  # Optional TMDB API Key
  TMDB_API_KEY=your_key_here
  ```
  ```

## Критерии приёмки
- ✅ HttpClientService создан с retry логикой
- ✅ JikanApiService реализован
- ✅ TMDBApiService реализован
- ✅ Rate limiting настроен
- ✅ Кэширование работает
- ✅ Fallback механизмы работают
- ✅ Health check эндпоинт создан
- ✅ Документация создана

## Тестирование

### Unit тесты
- [ ] Тест успешного API вызова
- [ ] Тест retry логики
- [ ] Тест timeout
- [ ] Тест rate limiting
- [ ] Тест кэширования
- [ ] Тест fallback

### Интеграционные тесты
- [ ] Реальный вызов Jikan API
- [ ] Реальный вызов TMDB API (с валидным ключом)
- [ ] Тест с недоступным API
- [ ] Тест с некорректным API key

### Ручное тестирование
- [ ] Отключить интернет и проверить fallback
- [ ] Проверить логи при ошибках API
- [ ] Проверить кэширование (второй запрос быстрее)

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все API сервисы работают
2. ✅ Retry логика работает
3. ✅ Кэширование работает
4. ✅ Fallback механизмы работают
5. ✅ Тесты проходят
6. ✅ Документация создана
7. ✅ Health check работает

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/backend/05-external-api-error-handling.md`
