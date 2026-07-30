import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { MediaEntry } from '../../entities/media-entry.entity';
import { User } from '../../entities/user.entity';

const createMockUser = (
  overrides: Partial<User> = {},
): Pick<User, 'id' | 'preferences'> => ({
  id: 1,
  preferences: {},
  ...overrides,
});

const createMockMedia = (overrides: Partial<MediaEntry> = {}): MediaEntry =>
  ({
    id: 1,
    title: 'Title',
    image: null,
    description: null,
    rating: 8,
    startDate: null,
    endDate: null,
    genres: null,
    category: 'Movie',
    tags: null,
    userId: 2,
    groupId: null,
    ...overrides,
  }) as MediaEntry;

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  // Внешние источники (Jikan/TMDB) ходят через глобальный fetch — в юнит-тестах
  // сеть изолируем; конкретные ответы переопределяются в самих тестах.
  const originalFetch = global.fetch;
  const mockFetchEmpty = () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as unknown as Response);
  };

  const mockGetMany = jest.fn();
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: mockGetMany,
  };
  const mockMediaRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
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
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    mockFetchEmpty();
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  describe('getTopRatedInLibrary', () => {
    it('should query own library entries with rating above zero', async () => {
      mockGetMany.mockResolvedValue([]);

      await service.getTopRatedInLibrary(1, 5);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'media.userId = :userId',
        { userId: 1 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'media.rating > 0',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'media.rating',
        'DESC',
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockUserRepository.find).not.toHaveBeenCalled();
    });

    it('should map entities to Recommendation contract with genres parsed from JSON string', async () => {
      mockGetMany.mockResolvedValue([
        createMockMedia({
          title: 'My Favorite',
          genres: '["Драма","Комедия"]',
          rating: 9,
        }),
      ]);

      const result = await service.getTopRatedInLibrary(1);

      expect(result).toEqual([
        {
          title: 'My Favorite',
          image: undefined,
          description: undefined,
          rating: 9,
          genres: ['Драма', 'Комедия'],
          category: 'Movie',
          reason: 'Top rated in your library',
          inLibrary: true,
        },
      ]);
    });

    it('should not leak internal entity fields (userId, groupId, timestamps)', async () => {
      mockGetMany.mockResolvedValue([createMockMedia({ userId: 1 })]);

      const [item] = await service.getTopRatedInLibrary(1);

      expect(item).not.toHaveProperty('userId');
      expect(item).not.toHaveProperty('groupId');
      expect(item).not.toHaveProperty('createdAt');
      expect(item).not.toHaveProperty('updatedAt');
    });

    it('should tolerate malformed genres payloads', async () => {
      mockGetMany.mockResolvedValue([
        createMockMedia({ genres: 'not-a-json' }),
        createMockMedia({ id: 2, genres: '' }),
        createMockMedia({ id: 3, genres: null }),
      ]);

      const result = await service.getTopRatedInLibrary(1);

      expect(result[0].genres).toEqual(['not-a-json']);
      expect(result[1].genres).toEqual([]);
      expect(result[2].genres).toEqual([]);
    });
  });

  describe('getRecommendationsByGenre', () => {
    it('should return empty array when user has no media', async () => {
      mockUserRepository.findOne.mockResolvedValue(createMockUser());
      mockMediaRepository.find.mockResolvedValue([]);

      const result = await service.getRecommendationsByGenre(1);

      expect(result).toEqual([]);
    });

    it('should recommend backlog items matching top genres with genres as array', async () => {
      mockUserRepository.findOne.mockResolvedValue(createMockUser());
      mockMediaRepository.find.mockResolvedValue([
        createMockMedia({
          id: 1,
          userId: 1,
          title: 'Rated favorite',
          rating: 9,
          startDate: new Date('2026-01-01'),
          genres: '["Драма"]',
        }),
        createMockMedia({
          id: 2,
          userId: 1,
          title: 'Backlog match',
          rating: 0,
          startDate: null,
          genres: '["Драма","Комедия"]',
        }),
        createMockMedia({
          id: 3,
          userId: 1,
          title: 'Backlog without genres',
          rating: 0,
          startDate: null,
          genres: '[]',
        }),
      ]);

      const result = await service.getRecommendationsByGenre(1);

      const titles = result.map((r) => r.title);
      expect(titles).toContain('Backlog match');
      expect(titles).not.toContain('Backlog without genres');
      expect(titles).not.toContain('Rated favorite');

      const backlog = result.find((r) => r.title === 'Backlog match');
      expect(backlog?.genres).toEqual(['Драма', 'Комедия']);
      expect(backlog?.inLibrary).toBe(true);
    });

    describe('with Russian genres (external sources)', () => {
      const jikanResponse = {
        data: [
          {
            title: 'Jikan Anime Hit',
            images: { jpg: { image_url: 'https://cdn.example/poster.jpg' } },
            synopsis: 'A very long synopsis',
            score: 8.7,
            genres: [{ name: 'Drama' }],
          },
        ],
      };

      beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(jikanResponse),
        } as unknown as Response);
      });

      it('should resolve Russian genres to Jikan ids and mark external items as not in library', async () => {
        mockUserRepository.findOne.mockResolvedValue(createMockUser());
        mockMediaRepository.find.mockResolvedValue([
          createMockMedia({
            id: 1,
            userId: 1,
            title: 'Rated favorite',
            rating: 9,
            startDate: new Date('2026-01-01'),
            genres: '["Драма"]',
          }),
        ]);

        const result = await service.getRecommendationsByGenre(1);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('api.jikan.moe/v4/anime?genres=8'),
        );

        const external = result.find((r) => r.title === 'Jikan Anime Hit');
        expect(external).toBeDefined();
        expect(external?.inLibrary).toBe(false);
        expect(external?.category).toBe('Anime');
        expect(external?.rating).toBe(8.7);
      });

      it('should degrade to internal-only when external fetch fails', async () => {
        global.fetch = jest
          .fn()
          .mockRejectedValue(new Error('network down'));
        mockUserRepository.findOne.mockResolvedValue(createMockUser());
        mockMediaRepository.find.mockResolvedValue([
          createMockMedia({
            id: 1,
            userId: 1,
            title: 'Backlog drama',
            rating: 9,
            startDate: null,
            genres: '["Драма"]',
          }),
        ]);

        const result = await service.getRecommendationsByGenre(1);

        expect(result.map((r) => r.title)).toEqual(['Backlog drama']);
      });
    });
  });
});
