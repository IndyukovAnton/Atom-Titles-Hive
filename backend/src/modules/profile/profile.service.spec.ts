import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { MediaEntry } from '../../entities/media-entry.entity';
import { LoggerService } from '../../utils/logger.service';
import { NotFoundException } from '@nestjs/common';

describe('ProfileService - Statistics', () => {
  let service: ProfileService;
  let userRepository: Repository<User>;
  let mediaRepository: Repository<MediaEntry>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    createdAt: new Date(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MediaEntry),
          useValue: {
            count: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    mediaRepository = module.get<Repository<MediaEntry>>(
      getRepositoryToken(MediaEntry),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return statistics with zero values for user with no entries', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(0);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue([]);

      const result = await service.getStats(1);

      expect(result).toEqual({
        totalEntries: 0,
        favoriteCategory: null,
        favoriteGenre: null,
        totalWatchTime: 0,
        currentMonthWatchTime: 0,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getStats(999)).rejects.toThrow(NotFoundException);
    });

    it('should correctly calculate total entries', async () => {
      const mockEntries = [
        { id: 1, title: 'Movie 1', userId: 1 },
        { id: 2, title: 'Movie 2', userId: 1 },
        { id: 3, title: 'Movie 3', userId: 1 },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(3);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.totalEntries).toBe(3);
    });

    it('should correctly identify favorite category', async () => {
      const mockEntries = [
        { id: 1, category: 'Фильм', userId: 1 },
        { id: 2, category: 'Сериал', userId: 1 },
        { id: 3, category: 'Фильм', userId: 1 },
        { id: 4, category: 'Аниме', userId: 1 },
        { id: 5, category: 'Фильм', userId: 1 },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(5);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.favoriteCategory).toBe('Фильм');
    });

    it('should return null for favorite category when no entries have categories', async () => {
      const mockEntries = [
        { id: 1, category: null, userId: 1 },
        { id: 2, category: null, userId: 1 },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(2);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.favoriteCategory).toBeNull();
    });

    it('should correctly identify favorite genre', async () => {
      const mockEntries = [
        { id: 1, genres: '["Драма","Триллер"]', userId: 1 },
        { id: 2, genres: '["Комедия"]', userId: 1 },
        { id: 3, genres: '["Драма","Боевик"]', userId: 1 },
        { id: 4, genres: '["Драма"]', userId: 1 },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(4);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.favoriteGenre).toBe('Драма');
    });

    it('should handle invalid JSON in genres gracefully', async () => {
      const mockEntries = [
        { id: 1, genres: 'invalid json', userId: 1 },
        { id: 2, genres: '["Драма"]', userId: 1 },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(2);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.favoriteGenre).toBe('Драма');
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });

    it('should correctly calculate total watch time in hours', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const mockEntries = [
        {
          id: 1,
          userId: 1,
          startDate: twoDaysAgo,
          endDate: yesterday, // 24 hours
        },
        {
          id: 2,
          userId: 1,
          startDate: yesterday,
          endDate: now, // 24 hours
        },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(2);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.totalWatchTime).toBe(48);
    });

    it('should skip entries without dates in watch time calculation', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const mockEntries = [
        {
          id: 1,
          userId: 1,
          startDate: yesterday,
          endDate: now, // 24 hours
        },
        {
          id: 2,
          userId: 1,
          startDate: null,
          endDate: null, // Should be skipped
        },
        {
          id: 3,
          userId: 1,
          startDate: yesterday,
          endDate: null, // Should be skipped
        },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(3);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.totalWatchTime).toBe(24);
    });

    it('should correctly calculate current month watch time', async () => {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 20);

      const mockEntries = [
        {
          id: 1,
          userId: 1,
          startDate: thisMonthStart,
          endDate: new Date(thisMonthStart.getTime() + 24 * 60 * 60 * 1000), // 24 hours in current month
        },
        {
          id: 2,
          userId: 1,
          startDate: lastMonth,
          endDate: lastMonthEnd, // Should not count (last month)
        },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(2);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.currentMonthWatchTime).toBe(24);
    });

    it('should ignore negative time differences', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockEntries = [
        {
          id: 1,
          userId: 1,
          startDate: future, // Start is after end
          endDate: now,
        },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(1);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.totalWatchTime).toBe(0);
    });

    it('should round watch time to 1 decimal place', async () => {
      const now = new Date();
      // Create a time difference that results in a decimal
      const start = new Date(now.getTime() - 90 * 60 * 1000); // 1.5 hours ago

      const mockEntries = [
        {
          id: 1,
          userId: 1,
          startDate: start,
          endDate: now,
        },
      ] as MediaEntry[];

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(1);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue(mockEntries);

      const result = await service.getStats(1);

      expect(result.totalWatchTime).toBe(1.5);
      // Verify it's rounded to 1 decimal place
      expect(
        result.totalWatchTime.toString().split('.')[1]?.length || 0,
      ).toBeLessThanOrEqual(1);
    });

    it('should log statistics access', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(mediaRepository, 'count').mockResolvedValue(0);
      jest.spyOn(mediaRepository, 'find').mockResolvedValue([]);

      await service.getStats(1);

      expect(mockLoggerService.log).toHaveBeenCalledWith(
        expect.stringContaining('Statistics accessed by user 1'),
      );
    });
  });
});
