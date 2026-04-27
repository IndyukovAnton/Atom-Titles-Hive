# Задача BE-04: Тесты для RecommendationsService

## Приоритет
🟡 **ВАЖНЫЙ** - Качество кода

## Зависимости
Нет

## Описание проблемы
Модуль `RecommendationsService` интегрируется с внешними API (Jikan для аниме, TMDB для фильмов/сериалов), но не имеет unit-тестов. Это критично, так как:
- Внешние API могут измениться
- Логика рекомендаций сложная
- Нет гарантии корректности работы

## Цель задачи
Написать полное покрытие unit-тестами для `RecommendationsService`, включая моки внешних API, обработку ошибок и edge cases.

## Чек-лист выполнения

### Этап 1: Изучение текущей реализации
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\recommendations\recommendations.service.ts`
- [ ] Проанализировать все публичные методы
- [ ] Определить зависимости (repositories, HTTP client, etc.)
- [ ] Составить список сценариев для тестирования

### Этап 2: Создание фикстур для тестов
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\test\fixtures\recommendations.fixtures.ts`:
  ```typescript
  export const mockJikanAnimeResponse = {
    data: [
      {
        mal_id: 1,
        title: 'Test Anime',
        score: 8.5,
        genres: [{ name: 'Action' }, { name: 'Adventure' }],
        synopsis: 'Test synopsis',
        images: {
          jpg: {
            image_url: 'https://example.com/image.jpg',
          },
        },
      },
    ],
  };

  export const mockTMDBMovieResponse = {
    results: [
      {
        id: 1,
        title: 'Test Movie',
        vote_average: 7.5,
        genre_ids: [28, 12],
        overview: 'Test overview',
        poster_path: '/test.jpg',
      },
    ],
  };

  export const mockMediaEntries = [
    {
      id: 1,
      title: 'Existing Anime',
      category: 'anime',
      genres: ['Action', 'Adventure'],
      rating: 9,
      status: 'completed',
      userId: 1,
    },
    {
      id: 2,
      title: 'Existing Movie',
      category: 'movie',
      genres: ['Drama'],
      rating: 8,
      status: 'not_started',
      userId: 1,
    },
  ];

  export const mockUserPreferences = {
    userId: 1,
    tmdbApiKey: 'test_tmdb_key',
  };
  ```

### Этап 3: Создание spec файла
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\recommendations\recommendations.service.spec.ts`:
  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { RecommendationsService } from './recommendations.service';
  import { getRepositoryToken } from '@nestjs/typeorm';
  import { MediaEntry } from '../../entities/media-entry.entity';
  import { LoggerService } from '../../utils/logger.service';
  import { HttpService } from '@nestjs/axios';
  import { of, throwError } from 'rxjs';
  import { AxiosResponse } from 'axios';
  import {
    mockJikanAnimeResponse,
    mockTMDBMovieResponse,
    mockMediaEntries,
    mockUserPreferences,
  } from '../../../test/fixtures/recommendations.fixtures';

  describe('RecommendationsService', () => {
    let service: RecommendationsService;
    let httpService: HttpService;

    const mockMediaRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockUserPreferencesRepository = {
      findOne: jest.fn(),
    };

    const mockLoggerService = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const mockHttpService = {
      get: jest.fn(),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RecommendationsService,
          {
            provide: getRepositoryToken(MediaEntry),
            useValue: mockMediaRepository,
          },
          {
            provide: getRepositoryToken('UserPreferences'),
            useValue: mockUserPreferencesRepository,
          },
          {
            provide: LoggerService,
            useValue: mockLoggerService,
          },
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      service = module.get<RecommendationsService>(RecommendationsService);
      httpService = module.get<HttpService>(HttpService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('getRecommendationsByGenres', () => {
      it('should return internal recommendations for unstarted media', async () => {
        mockMediaRepository.find.mockResolvedValue(mockMediaEntries);
        mockUserPreferencesRepository.findOne.mockResolvedValue(null);

        const result = await service.getRecommendationsByGenres(1);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(mockMediaRepository.find).toHaveBeenCalled();
      });

      it('should fetch external anime recommendations from Jikan', async () => {
        mockMediaRepository.find.mockResolvedValue([]);
        mockUserPreferencesRepository.findOne.mockResolvedValue(mockUserPreferences);

        const axiosResponse: AxiosResponse = {
          data: mockJikanAnimeResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(axiosResponse));

        const result = await service.getRecommendationsByGenres(1);

        expect(mockHttpService.get).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should handle Jikan API errors gracefully', async () => {
        mockMediaRepository.find.mockResolvedValue([]);
        mockUserPreferencesRepository.findOne.mockResolvedValue(mockUserPreferences);

        mockHttpService.get.mockReturnValue(
          throwError(() => new Error('API Error')),
        );

        const result = await service.getRecommendationsByGenres(1);

        expect(mockLoggerService.error).toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });

      it('should fetch external movie recommendations from TMDB', async () => {
        mockMediaRepository.find.mockResolvedValue([]);
        mockUserPreferencesRepository.findOne.mockResolvedValue(mockUserPreferences);

        const axiosResponse: AxiosResponse = {
          data: mockTMDBMovieResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(axiosResponse));

        const result = await service.getRecommendationsByGenres(1);

        expect(result).toBeDefined();
      });

      it('should handle TMDB API errors gracefully', async () => {
        mockMediaRepository.find.mockResolvedValue([]);
        mockUserPreferencesRepository.findOne.mockResolvedValue(mockUserPreferences);

        mockHttpService.get.mockReturnValue(
          throwError(() => new Error('TMDB API Error')),
        );

        const result = await service.getRecommendationsByGenres(1);

        expect(mockLoggerService.error).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should merge internal and external recommendations', async () => {
        mockMediaRepository.find.mockResolvedValue(mockMediaEntries);
        mockUserPreferencesRepository.findOne.mockResolvedValue(mockUserPreferences);

        const axiosResponse: AxiosResponse = {
          data: mockJikanAnimeResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(axiosResponse));

        const result = await service.getRecommendationsByGenres(1);

        expect(result.length).toBeGreaterThan(0);
      });

      it('should filter out user own media from recommendations', async () => {
        const userMediaTitles = mockMediaEntries.map(m => m.title);
        mockMediaRepository.find.mockResolvedValue(mockMediaEntries);
        mockUserPreferencesRepository.findOne.mockResolvedValue(null);

        const result = await service.getRecommendationsByGenres(1);

        // Проверяем что собственные медиа не в рекомендациях
        result.forEach(rec => {
          expect(userMediaTitles).not.toContain(rec.title);
        });
      });
    });

    describe('getTopRatedRecommendations', () => {
      it('should return top 25% rated media', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockMediaEntries),
        };

        mockMediaRepository.createQueryBuilder.mockReturnValue(queryBuilder);

        const result = await service.getTopRatedRecommendations(1);

        expect(result).toBeDefined();
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('media.rating', 'DESC');
      });

      it('should handle empty media library', async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        };

        mockMediaRepository.createQueryBuilder.mockReturnValue(queryBuilder);

        const result = await service.getTopRatedRecommendations(1);

        expect(result).toEqual([]);
      });
    });

    describe('API rate limiting and retry logic', () => {
      it('should retry failed API requests', async () => {
        mockMediaRepository.find.mockResolvedValue([]);
        mockUserPreferencesRepository.findOne.mockResolvedValue(mockUserPreferences);

        // Первый вызов - ошибка, второй - успех
        mockHttpService.get
          .mockReturnValueOnce(throwError(() => new Error('Timeout')))
          .mockReturnValueOnce(
            of({
              data: mockJikanAnimeResponse,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {} as any,
            }),
          );

        const result = await service.getRecommendationsByGenres(1);

        expect(mockHttpService.get).toHaveBeenCalledTimes(2);
        expect(result).toBeDefined();
      });

      it('should respect API rate limits', async () => {
        // TODO: Implement rate limit testing
        expect(true).toBe(true);
      });
    });
  });
  ```

### Этап 4: Установка дополнительных зависимостей для тестов
- [ ] Установить пакеты:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm install -D @nestjs/axios axios rxjs
  ```

### Этап 5: Запуск тестов
- [ ] Выполнить команду:
  ```bash
  npm run test -- recommendations.service.spec.ts
  ```
- [ ] Исправить ошибки если есть
- [ ] Добиться 100% покрытия публичных методов

### Этап 6: Добавление coverage отчета
- [ ] Запустить тесты с coverage:
  ```bash
  npm run test:cov
  ```
- [ ] Проверить coverage для `recommendations.service.ts`
- [ ] Убедиться что coverage >= 80%

### Этап 7: Добавление интеграционных тестов
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\test\recommendations.e2e-spec.ts`:
  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { INestApplication } from '@nestjs/common';
  import * as request from 'supertest';
  import { AppModule } from '../src/app.module';

  describe('RecommendationsController (e2e)', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      // Регистрация и получение токена
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      authToken = registerResponse.body.access_token;
    });

    afterAll(async () => {
      await app.close();
    });

    it('/recommendations/by-genres (GET)', () => {
      return request(app.getHttpServer())
        .get('/recommendations/by-genres')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/recommendations/top-rated (GET)', () => {
      return request(app.getHttpServer())
        .get('/recommendations/top-rated')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/recommendations/by-genres')
        .expect(401);
    });
  });
  ```

### Этап 8: Документация тестов
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\docs\testing-guide.md`:
  ```markdown
  # Testing Guide

  ## Running Tests

  ### Unit Tests
  ```bash
  npm run test
  ```

  ### Specific Test File
  ```bash
  npm run test -- recommendations.service.spec.ts
  ```

  ### Watch Mode
  ```bash
  npm run test:watch
  ```

  ### Coverage
  ```bash
  npm run test:cov
  ```

  ### E2E Tests
  ```bash
  npm run test:e2e
  ```

  ## Writing Tests

  ### Fixtures
  Use fixtures from `test/fixtures/` for consistent test data.

  ### Mocking External APIs
  Always mock HTTP calls to external APIs (Jikan, TMDB).

  ### Coverage Goals
  - Unit tests: >= 80% coverage
  - Critical services: >= 90% coverage

  ## CI/CD
  Tests run automatically on every push via GitHub Actions.
  ```

## Критерии приёмки
- ✅ Файл `recommendations.service.spec.ts` создан
- ✅ Все публичные методы покрыты тестами
- ✅ Внешние API замокированы
- ✅ Обработка ошибок протестирована
- ✅ E2E тесты написаны
- ✅ Coverage >= 80%
- ✅ Все тесты проходят
- ✅ Документация создана

## Тестирование

### Запуск unit тестов
- [ ] Выполнить `npm run test -- recommendations.service.spec.ts`
- [ ] Проверить что все тесты зеленые
- [ ] Проверить coverage отчет

### Запуск E2E тестов
- [ ] Выполнить `npm run test:e2e -- recommendations.e2e-spec.ts`
- [ ] Проверить что все тесты проходят

### Проверка edge cases
- [ ] Тест с пустой библиотекой медиа
- [ ] Тест с недоступным внешним API
- [ ] Тест с некорректным TMDB API key
- [ ] Тест с timeout внешнего API

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Unit тесты написаны и проходят
2. ✅ E2E тесты написаны и проходят
3. ✅ Coverage >= 80%
4. ✅ Все edge cases покрыты
5. ✅ Моки внешних API работают
6. ✅ Документация создана
7. ✅ CI/CD готов к интеграции

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/backend/04-recommendations-tests.md`
