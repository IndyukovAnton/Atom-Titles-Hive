import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import {
  createMockGroup,
  mockCreateGroupDto,
  mockUpdateGroupDto,
} from '../../../test/fixtures/group.fixtures';
import { NotFoundException } from '@nestjs/common';
import { AuthenticatedRequest } from '../../types/authenticated-request.interface';

describe('GroupsController', () => {
  let controller: GroupsController;

  const mockGroupsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getGroupStats: jest.fn(),
  };

  const mockAuthenticatedRequest = {
    user: { userId: 1, username: 'testuser' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GroupsController>(GroupsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create group', async () => {
      const expectedResult = createMockGroup();
      mockGroupsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(
        mockAuthenticatedRequest,
        mockCreateGroupDto,
      );

      expect(mockGroupsService.create).toHaveBeenCalledWith(
        1,
        mockCreateGroupDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all groups', async () => {
      const expectedResult = [createMockGroup()];
      mockGroupsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockAuthenticatedRequest);

      expect(mockGroupsService.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getStats', () => {
    it('should return group statistics', async () => {
      const expectedResult = {
        groups: [],
        ungrouped: 0,
      };
      mockGroupsService.getGroupStats.mockResolvedValue(expectedResult);

      const result = await controller.getStats(mockAuthenticatedRequest);

      expect(mockGroupsService.getGroupStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return group', async () => {
      const expectedResult = createMockGroup();
      mockGroupsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockAuthenticatedRequest, '1');

      expect(mockGroupsService.findOne).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if group not found', async () => {
      mockGroupsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne(mockAuthenticatedRequest, '999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update group', async () => {
      const expectedResult = createMockGroup();
      mockGroupsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(
        mockAuthenticatedRequest,
        '1',
        mockUpdateGroupDto,
      );

      expect(mockGroupsService.update).toHaveBeenCalledWith(
        1,
        1,
        mockUpdateGroupDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove group', async () => {
      mockGroupsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockAuthenticatedRequest, '1');

      expect(mockGroupsService.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ message: 'Group deleted successfully' });
    });
  });
});
