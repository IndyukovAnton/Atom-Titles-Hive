import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import {
  mockCreateMediaDto,
  mockUpdateMediaDto,
  createMockMediaEntry,
} from '../../../test/fixtures/media.fixtures';
import { NotFoundException } from '@nestjs/common';
import { AuthenticatedRequest } from '../../types/authenticated-request.interface';

describe('MediaController', () => {
  let controller: MediaController;

  const mockMediaService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    search: jest.fn(),
    getCategories: jest.fn(),
  };

  const mockAuthenticatedRequest = {
    user: { userId: 1, username: 'testuser' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MediaController>(MediaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create media entry', async () => {
      const expectedResult = createMockMediaEntry();
      mockMediaService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(
        mockAuthenticatedRequest,
        mockCreateMediaDto,
      );

      expect(mockMediaService.create).toHaveBeenCalledWith(
        1,
        mockCreateMediaDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all media entries with parsed filters', async () => {
      const mockResult = [createMockMediaEntry()];
      mockMediaService.findAll.mockResolvedValue(mockResult);

      await controller.findAll(
        mockAuthenticatedRequest,
        '1', // groupId
        'Film', // category
        'query', // search
      );

      expect(mockMediaService.findAll).toHaveBeenCalledWith(1, {
        groupId: 1,
        category: 'Film',
        search: 'query',
      });
    });

    it('should handle null groupId filter', async () => {
      mockMediaService.findAll.mockResolvedValue([]);

      await controller.findAll(mockAuthenticatedRequest, 'null');

      expect(mockMediaService.findAll).toHaveBeenCalledWith(1, {
        groupId: null,
      });
    });

    it('should handle undefined filters', async () => {
      mockMediaService.findAll.mockResolvedValue([]);

      await controller.findAll(mockAuthenticatedRequest);

      expect(mockMediaService.findAll).toHaveBeenCalledWith(1, {});
    });
  });

  describe('findOne', () => {
    it('should return media entry', async () => {
      const expectedResult = createMockMediaEntry();
      mockMediaService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockAuthenticatedRequest, '1');

      expect(mockMediaService.findOne).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if media not found', async () => {
      mockMediaService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne(mockAuthenticatedRequest, '999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update media entry', async () => {
      const expectedResult = createMockMediaEntry();
      mockMediaService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(
        mockAuthenticatedRequest,
        '1',
        mockUpdateMediaDto,
      );

      expect(mockMediaService.update).toHaveBeenCalledWith(
        1,
        1,
        mockUpdateMediaDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove media entry', async () => {
      mockMediaService.remove.mockResolvedValue(undefined);

      await controller.remove(mockAuthenticatedRequest, '1');

      expect(mockMediaService.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('search', () => {
    it('should search media entries', async () => {
      const expectedResult = [createMockMediaEntry()];
      mockMediaService.search.mockResolvedValue(expectedResult);

      const result = await controller.search(mockAuthenticatedRequest, 'query');

      expect(mockMediaService.search).toHaveBeenCalledWith(1, 'query');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getCategories', () => {
    it('should return categories', async () => {
      const expectedResult = ['Movie', 'Series'];
      mockMediaService.getCategories.mockResolvedValue(expectedResult);

      const result = await controller.getCategories(mockAuthenticatedRequest);

      expect(mockMediaService.getCategories).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });
  });
});
