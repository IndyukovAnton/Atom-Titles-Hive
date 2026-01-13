import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { createMockUser } from '../../../test/fixtures/user.fixtures';
import {
  mockUpdateProfileDto,
  mockProfileStatsDto,
} from '../../../test/fixtures/profile.fixtures';
import { NotFoundException } from '@nestjs/common';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    getProfile: jest.fn(),
    getStats: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockAuthenticatedRequest = {
    user: { userId: 1 },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const expectedResult = createMockUser();
      mockProfileService.getProfile.mockResolvedValue(expectedResult);

      const result = await controller.getProfile(mockAuthenticatedRequest);

      expect(service.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockProfileService.getProfile.mockRejectedValue(new NotFoundException());

      await expect(
        controller.getProfile(mockAuthenticatedRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      mockProfileService.getStats.mockResolvedValue(mockProfileStatsDto);

      const result = await controller.getStats(mockAuthenticatedRequest);

      expect(service.getStats).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfileStatsDto);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const expectedResult = createMockUser({
        username: mockUpdateProfileDto.username,
        email: mockUpdateProfileDto.email,
      });
      mockProfileService.updateProfile.mockResolvedValue(expectedResult);

      const result = await controller.updateProfile(
        mockAuthenticatedRequest,
        mockUpdateProfileDto,
      );

      expect(service.updateProfile).toHaveBeenCalledWith(
        1,
        mockUpdateProfileDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
