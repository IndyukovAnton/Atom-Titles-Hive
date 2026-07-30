import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MediaEntry } from '../../entities/media-entry.entity';
import { MediaFile } from '../../entities/media-file.entity';
import { Group } from '../../entities/group.entity';
import { LoggerService } from '../../utils/logger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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

  const mockGroupRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
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
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
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

    it('should persist source when provided', async () => {
      const mockMedia = createMockMediaEntry({ source: 'ai' });
      mockRepository.save.mockResolvedValue(mockMedia);

      await service.create(1, { ...mockCreateMediaDto, source: 'ai' });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'ai' }),
      );
    });

    it('should default source to null when not provided', async () => {
      const mockMedia = createMockMediaEntry();
      mockRepository.save.mockResolvedValue(mockMedia);

      await service.create(1, mockCreateMediaDto);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ source: null }),
      );
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

    it('should filter by ungrouped when groupId is null', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll(1, { groupId: null });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'media.groupId IS NULL',
      );
      expect(mockGroupRepository.find).not.toHaveBeenCalled();
    });

    it('should include media from descendant groups when filtering by group', async () => {
      mockGroupRepository.find.mockResolvedValue([
        { id: 1, parentId: null },
        { id: 2, parentId: 1 },
        { id: 3, parentId: 2 },
        { id: 4, parentId: null },
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll(1, { groupId: 1 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'media.groupId IN (:...groupIds)',
        { groupIds: [1, 2, 3] },
      );
    });

    it('should not hang on cyclic parentId data (legacy corruption)', async () => {
      mockGroupRepository.find.mockResolvedValue([
        { id: 1, parentId: 2 },
        { id: 2, parentId: 1 },
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll(1, { groupId: 1 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'media.groupId IN (:...groupIds)',
        { groupIds: [1, 2] },
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

    it('should update source when provided', async () => {
      const mockMedia = createMockMediaEntry({ source: 'ai' });
      mockRepository.findOne.mockResolvedValue(mockMedia);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.update(1, 1, { source: 'ai' });

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ source: 'ai' }),
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

  describe('group ownership', () => {
    it('create should reject a group owned by another user', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(1, { ...mockCreateMediaDto, groupId: 42 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('create should accept a group owned by the user', async () => {
      mockGroupRepository.findOne.mockResolvedValue({ id: 42, userId: 1 });
      const mockMedia = createMockMediaEntry({ groupId: 42 });
      mockRepository.save.mockResolvedValue(mockMedia);

      const result = await service.create(1, {
        ...mockCreateMediaDto,
        groupId: 42,
      });

      expect(mockGroupRepository.findOne).toHaveBeenCalledWith({
        where: { id: 42, userId: 1 },
      });
      expect(result).toEqual(mockMedia);
    });

    it('update should reject a group owned by another user', async () => {
      mockRepository.findOne.mockResolvedValue(createMockMediaEntry());
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, 1, { groupId: 42 })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('factoryReset', () => {
    const createMockQueryRunner = () => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      query: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    });

    it('should delete only the current user data', async () => {
      const queryRunner = createMockQueryRunner();
      mockDataSource.createQueryRunner.mockReturnValue(queryRunner);

      await service.factoryReset(7);

      const calls = queryRunner.query.mock.calls as [string, unknown[]?][];
      const sqlStatements = calls.map(([sql]) => sql);

      expect(sqlStatements).toContain(
        'DELETE FROM media_entries WHERE userId = ?;',
      );
      expect(sqlStatements).toContain('DELETE FROM groups WHERE userId = ?;');
      expect(
        sqlStatements.some((sql) => sql.includes('DELETE FROM media_files')),
      ).toBe(true);

      // Все DELETE параметризованы userId — данных других пользователей не касаемся
      const deleteCalls = calls.filter(([sql]) => sql.startsWith('DELETE'));
      for (const [, params] of deleteCalls) {
        expect(params).toEqual([7]);
      }

      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const queryRunner = createMockQueryRunner();
      queryRunner.query.mockRejectedValueOnce(new Error('DB failure'));
      mockDataSource.createQueryRunner.mockReturnValue(queryRunner);

      await expect(service.factoryReset(7)).rejects.toThrow('DB failure');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
