import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from '../../entities/group.entity';
import { MediaEntry } from '../../entities/media-entry.entity';
import { LoggerService } from '../../utils/logger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
    manager: {
      // Транзакция выполняет коллбэк с тем же мок-репозиторием,
      // чтобы можно было проверять вызовы update/find внутри неё.
      transaction: jest.fn((callback: (manager: unknown) => unknown) =>
        callback({ getRepository: () => mockGroupRepository }),
      ),
    },
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

    it('should append a new group after the last sibling', async () => {
      mockGroupRepository.findOne.mockResolvedValue(
        createMockGroup({ id: 9, sortOrder: 4 }),
      );
      const mockGroup = createMockGroup({ sortOrder: 5 });
      mockGroupRepository.create.mockReturnValue(mockGroup);
      mockGroupRepository.save.mockResolvedValue(mockGroup);

      await service.create(1, mockCreateGroupDto);

      expect(mockGroupRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: null, sortOrder: 5 }),
      );
    });

    it('should reject a parent group owned by another user', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(1, { name: 'Sub', parentId: 42 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockGroupRepository.save).not.toHaveBeenCalled();
    });

    it('should accept a parent group owned by the user', async () => {
      const parent = createMockGroup({ id: 42, userId: 1 });
      mockGroupRepository.findOne.mockResolvedValue(parent);
      const mockGroup = createMockGroup({ parentId: 42 });
      mockGroupRepository.create.mockReturnValue(mockGroup);
      mockGroupRepository.save.mockResolvedValue(mockGroup);

      const result = await service.create(1, { name: 'Sub', parentId: 42 });

      expect(mockGroupRepository.findOne).toHaveBeenCalledWith({
        where: { id: 42, userId: 1 },
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('findAll', () => {
    it('should return all groups for user ordered by sortOrder', async () => {
      const mockResult = [createMockGroup()];
      mockGroupRepository.find.mockResolvedValue(mockResult);

      const result = await service.findAll(1);

      expect(mockGroupRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
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

    it('should move group to root when parentId is explicitly null', async () => {
      const mockGroup = createMockGroup({ id: 1, parentId: 5, sortOrder: 2 });
      mockGroupRepository.findOne
        .mockResolvedValueOnce(mockGroup) // исходная группа
        .mockResolvedValueOnce(null) // siblings корня: пусто → sortOrder 0
        .mockResolvedValue(mockGroup); // повторное чтение после update

      const result = await service.update(1, 1, { parentId: null });

      expect(mockGroupRepository.update).toHaveBeenCalledWith(1, {
        parentId: null,
        sortOrder: 0,
      });
      expect(result).toEqual(mockGroup);
    });

    it('should reject setting group as its own parent', async () => {
      const mockGroup = createMockGroup({ id: 1 });
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);

      await expect(service.update(1, 1, { parentId: 1 })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockGroupRepository.update).not.toHaveBeenCalled();
    });

    it('should reject a parent group owned by another user', async () => {
      const mockGroup = createMockGroup({ id: 1 });
      mockGroupRepository.findOne
        .mockResolvedValueOnce(mockGroup) // findOne самой группы
        .mockResolvedValueOnce(null); // родитель не найден/чужой

      await expect(service.update(1, 1, { parentId: 42 })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockGroupRepository.update).not.toHaveBeenCalled();
    });

    it('should reject moving a group into its own descendant', async () => {
      mockGroupRepository.findOne
        .mockResolvedValueOnce(createMockGroup({ id: 1 })) // сама группа
        .mockResolvedValueOnce(createMockGroup({ id: 3, parentId: 2 })); // родитель
      mockGroupRepository.find.mockResolvedValue([
        createMockGroup({ id: 1, parentId: null }),
        createMockGroup({ id: 2, parentId: 1 }),
        createMockGroup({ id: 3, parentId: 2 }),
      ]);

      await expect(service.update(1, 1, { parentId: 3 })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockGroupRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('should reorder a group before a sibling and normalize sortOrder', async () => {
      mockGroupRepository.findOne.mockResolvedValue(
        createMockGroup({ id: 2, parentId: null, sortOrder: 1 }),
      );
      mockGroupRepository.find.mockResolvedValue([
        createMockGroup({ id: 1, parentId: null, sortOrder: 0 }),
        createMockGroup({ id: 2, parentId: null, sortOrder: 1 }),
        createMockGroup({ id: 3, parentId: null, sortOrder: 2 }),
      ]);

      await service.move(2, 1, { parentId: null, beforeId: 1 });

      expect(mockGroupRepository.update).toHaveBeenNthCalledWith(1, 2, {
        sortOrder: 0,
        parentId: null,
      });
      expect(mockGroupRepository.update).toHaveBeenNthCalledWith(2, 1, {
        sortOrder: 1,
      });
      expect(mockGroupRepository.update).toHaveBeenNthCalledWith(3, 3, {
        sortOrder: 2,
      });
    });

    it('should reparent a group to the end when beforeId is omitted', async () => {
      mockGroupRepository.findOne
        .mockResolvedValueOnce(createMockGroup({ id: 3, parentId: null })) // сама группа
        .mockResolvedValueOnce(createMockGroup({ id: 5 })) // новый родитель
        .mockResolvedValue(createMockGroup({ id: 3, parentId: 5 })); // после move
      // Потомки группы 3 отсутствуют
      mockGroupRepository.find
        .mockResolvedValueOnce([
          createMockGroup({ id: 3, parentId: null }),
          createMockGroup({ id: 5, parentId: null }),
        ])
        // Siblings нового родителя
        .mockResolvedValueOnce([createMockGroup({ id: 6, parentId: 5 })]);

      await service.move(3, 1, { parentId: 5 });

      expect(mockGroupRepository.update).toHaveBeenNthCalledWith(1, 6, {
        sortOrder: 0,
      });
      expect(mockGroupRepository.update).toHaveBeenNthCalledWith(2, 3, {
        sortOrder: 1,
        parentId: 5,
      });
    });

    it('should reject moving into own descendant', async () => {
      mockGroupRepository.findOne
        .mockResolvedValueOnce(createMockGroup({ id: 1 }))
        .mockResolvedValueOnce(createMockGroup({ id: 3, parentId: 2 }));
      mockGroupRepository.find.mockResolvedValue([
        createMockGroup({ id: 1, parentId: null }),
        createMockGroup({ id: 2, parentId: 1 }),
        createMockGroup({ id: 3, parentId: 2 }),
      ]);

      await expect(service.move(1, 1, { parentId: 3 })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockGroupRepository.update).not.toHaveBeenCalled();
    });

    it('should reject beforeId equal to the moved group', async () => {
      mockGroupRepository.findOne.mockResolvedValue(createMockGroup({ id: 1 }));

      await expect(
        service.move(1, 1, { parentId: null, beforeId: 1 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockGroupRepository.update).not.toHaveBeenCalled();
    });

    it('should reject beforeId that is not a sibling of the target parent', async () => {
      mockGroupRepository.findOne.mockResolvedValue(createMockGroup({ id: 1 }));
      mockGroupRepository.find.mockResolvedValue([
        createMockGroup({ id: 1, parentId: null }),
        createMockGroup({ id: 2, parentId: null }),
      ]);

      await expect(
        service.move(1, 1, { parentId: null, beforeId: 99 }),
      ).rejects.toThrow(BadRequestException);
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
    it('should return group statistics with aggregated totals', async () => {
      const parent = createMockGroup({
        id: 1,
        name: 'Parent',
        parentId: null,
        mediaEntries: [{ id: 10 } as MediaEntry],
      });
      const child = createMockGroup({
        id: 2,
        name: 'Child',
        parentId: 1,
        mediaEntries: [{ id: 11 } as MediaEntry, { id: 12 } as MediaEntry],
      });
      mockGroupRepository.find.mockResolvedValue([parent, child]);
      mockMediaRepository.count.mockResolvedValue(5);

      const result = await service.getGroupStats(1);

      expect(result).toEqual({
        groups: [
          {
            id: 1,
            name: 'Parent',
            parentId: null,
            sortOrder: 0,
            count: 1,
            totalCount: 3,
          },
          {
            id: 2,
            name: 'Child',
            parentId: 1,
            sortOrder: 0,
            count: 2,
            totalCount: 2,
          },
        ],
        ungrouped: 5,
      });
    });

    it('should not hang on cyclic parentId data (legacy corruption)', async () => {
      // До введения cycle-check можно было создать цикл A ↔ B —
      // stats обязан терпеть такие данные, а не падать с 500.
      const cyclic = [
        createMockGroup({
          id: 1,
          parentId: 2,
          mediaEntries: [{ id: 10 } as MediaEntry],
        }),
        createMockGroup({
          id: 2,
          parentId: 1,
          mediaEntries: [{ id: 11 } as MediaEntry],
        }),
      ];
      mockGroupRepository.find.mockResolvedValue(cyclic);
      mockMediaRepository.count.mockResolvedValue(0);

      const result = await service.getGroupStats(1);

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].totalCount).toBe(2);
      expect(result.groups[1].totalCount).toBe(1);
    });
  });
});
