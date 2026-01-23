import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from '../../entities/group.entity';
import { MediaEntry } from '../../entities/media-entry.entity';
import { LoggerService } from '../../utils/logger.service';
import { NotFoundException } from '@nestjs/common';
import {
  createMockGroup,
  mockCreateGroupDto,
  mockUpdateGroupDto,
} from '../../../test/fixtures/group.fixtures';

describe('GroupsService', () => {
  let service: GroupsService;

  const mockGroupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockMediaRepository = {
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: getRepositoryToken(Group),
          useValue: mockGroupRepository,
        },
        {
          provide: getRepositoryToken(MediaEntry),
          useValue: mockMediaRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a group', async () => {
      const mockGroup = createMockGroup();
      mockGroupRepository.create.mockReturnValue(mockGroup);
      mockGroupRepository.save.mockResolvedValue(mockGroup);

      const result = await service.create(1, mockCreateGroupDto);

      expect(mockGroupRepository.create).toHaveBeenCalled();
      expect(mockGroupRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });
  });

  describe('findAll', () => {
    it('should return all groups for user', async () => {
      const mockResult = [createMockGroup()];
      mockGroupRepository.find.mockResolvedValue(mockResult);

      const result = await service.findAll(1);

      expect(mockGroupRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'ASC' },
        relations: ['mediaEntries'],
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a group', async () => {
      const mockGroup = createMockGroup();
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockGroup);
    });

    it('should throw NotFoundException if group not found', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update group and return it', async () => {
      const mockGroup = createMockGroup();
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockGroupRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(1, 1, mockUpdateGroupDto);

      expect(mockGroupRepository.update).toHaveBeenCalledWith(
        1,
        mockUpdateGroupDto,
      );
      expect(result).toEqual(mockGroup);
    });
  });

  describe('remove', () => {
    it('should delete group and move media to ungrouped', async () => {
      const mockGroup = createMockGroup();
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockGroupRepository.remove.mockResolvedValue(mockGroup);

      await service.remove(1, 1);

      expect(mockMediaRepository.update).toHaveBeenCalledWith(
        { groupId: 1 },
        { groupId: null },
      );
      expect(mockGroupRepository.remove).toHaveBeenCalledWith(mockGroup);
    });
  });

  describe('getGroupStats', () => {
    it('should return group statistics', async () => {
      const mockGroups = [
        createMockGroup({
          id: 1,
          name: 'Group 1',
          mediaEntries: [{ id: 1 } as MediaEntry],
        }),
      ];
      mockGroupRepository.find.mockResolvedValue(mockGroups);
      mockMediaRepository.count.mockResolvedValue(5);

      const result = await service.getGroupStats(1);

      expect(result).toEqual({
        groups: [{ id: 1, name: 'Group 1', count: 1 }],
        ungrouped: 5,
      });
    });
  });
});
