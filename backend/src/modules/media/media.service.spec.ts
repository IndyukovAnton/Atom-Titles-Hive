import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { MediaFile } from '../../entities/media-file.entity';
import { LoggerService } from '../../utils/logger.service';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  createMockMediaEntry,
  mockCreateMediaDto,
  mockUpdateMediaDto,
} from '../../../test/fixtures/media.fixtures';

describe('MediaService', () => {
  let service: MediaService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  };

  const mockMediaFileRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(MediaEntry),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(MediaFile),
          useValue: mockMediaFileRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);

    // Сброс моков перед каждым тестом
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a media entry', async () => {
      const mockMedia = createMockMediaEntry();
      mockRepository.save.mockResolvedValue(mockMedia);

      const result = await service.create(1, mockCreateMediaDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockMedia);
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should handle creation error', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(1, mockCreateMediaDto)).rejects.toThrow(
        'Database error',
      );
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return array of media entries', async () => {
      const mockMediaList = [createMockMediaEntry()];
      mockQueryBuilder.getMany.mockResolvedValue(mockMediaList);

      const result = await service.findAll(1);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'media.userId = :userId',
        {
          userId: 1,
        },
      );
      expect(result).toHaveLength(1);
      // Проверка что JSON распарсился
      expect(result[0].genres).toBeInstanceOf(Array);
    });

    it('should apply filters', async () => {
      const filters = {
        limit: 10,
        offset: 0,
        category: 'Movie',
        search: 'Test',
      };

      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll(1, filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'media.userId = :userId',
        {
          userId: 1,
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'media.category = :category',
        { category: 'Movie' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a single media entry with parsed JSON', async () => {
      const mockMedia = createMockMediaEntry();
      mockRepository.findOne.mockResolvedValue(mockMedia);

      const result = await service.findOne(1, 1);

      expect(result.id).toEqual(mockMedia.id);
      expect(result.genres).toEqual(JSON.parse(mockMedia.genres as string));
      expect(result.tags).toEqual(JSON.parse(mockMedia.tags as string));
    });

    it('should throw NotFoundException if media not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return media entry', async () => {
      const mockMedia = createMockMediaEntry();
      mockRepository.findOne.mockResolvedValue(mockMedia);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, 1, mockUpdateMediaDto);

      expect(mockRepository.update).toHaveBeenCalled();
      // Result это результат findOne, который возвращает распарсенный объект
      expect(result.id).toEqual(mockMedia.id);
      expect(result.genres).toEqual(JSON.parse(mockMedia.genres as string));
    });

    it('should throw NotFoundException if media to update not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, 1, mockUpdateMediaDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove media entry', async () => {
      const mockMedia = createMockMediaEntry();
      mockRepository.findOne.mockResolvedValue(mockMedia);
      mockRepository.remove.mockResolvedValue(mockMedia);

      await service.remove(1, 1);

      expect(mockRepository.remove).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if media to remove not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      const mockMediaList = [createMockMediaEntry()];
      mockRepository.find.mockResolvedValue(mockMediaList);

      const result = await service.search(1, 'query');

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].genres).toBeInstanceOf(Array);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { category: 'Movie' },
        { category: 'Series' },
      ]);

      const result = await service.getCategories(1);

      expect(result).toEqual(['Movie', 'Series']);
    });
  });
});
