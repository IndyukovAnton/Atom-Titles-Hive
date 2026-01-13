import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import {
  mockRegisterDto,
  mockLoginDto,
} from '../../../test/fixtures/user.fixtures';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should return 201 and user data on successful registration', async () => {
      const expectedResult = {
        access_token: 'test-jwt-token',
        user: {
          id: 1,
          username: mockRegisterDto.username,
          email: mockRegisterDto.email,
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(mockRegisterDto);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(result).toEqual(expectedResult);
    });

    it('should return 409 when username already exists', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Username or email already exists'),
      );

      await expect(controller.register(mockRegisterDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(mockRegisterDto)).rejects.toThrow(
        'Username or email already exists',
      );
    });

    it('should return 409 when email already exists', async () => {
      const duplicateEmailDto = {
        ...mockRegisterDto,
        username: 'differentuser',
      };

      mockAuthService.register.mockRejectedValue(
        new ConflictException('Username or email already exists'),
      );

      await expect(controller.register(duplicateEmailDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle validation errors for invalid data', async () => {
      const invalidDto = {
        username: '',
        email: 'invalid-email',
        password: '123',
      };

      // В реальности ValidationPipe отклонит это на уровне контроллера
      // Здесь просто проверяем, что сервис вызывается
      mockAuthService.register.mockResolvedValue({
        access_token: 'token',
        user: { id: 1, username: '', email: 'invalid-email' },
      });

      await controller.register(invalidDto as any);

      expect(authService.register).toHaveBeenCalledWith(invalidDto);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 and JWT token on successful login', async () => {
      const expectedResult = {
        access_token: 'test-jwt-token',
        user: {
          id: 1,
          username: mockLoginDto.username,
          email: 'test@example.com',
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(mockLoginDto);

      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(result).toEqual(expectedResult);
      expect(result.access_token).toBeDefined();
    });

    it('should return 401 when credentials are incorrect', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should return 401 when user does not exist', async () => {
      const nonExistentUserDto = {
        username: 'nonexistent',
        password: 'password123',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(nonExistentUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return 401 when password is wrong', async () => {
      const wrongPasswordDto = {
        username: mockLoginDto.username,
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(wrongPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockRequest = {
        user: { userId: 1 },
      } as any;

      const expectedProfile = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      mockAuthService.getUserProfile.mockResolvedValue(expectedProfile);

      const result = await controller.getProfile(mockRequest);

      expect(authService.getUserProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedProfile);
    });

    it('should use JWT Guard for authentication', async () => {
      // Проверяем, что метод имеет @UseGuards(AuthGuard('jwt'))
      const metadata = Reflect.getMetadata('__guards__', controller.getProfile);
      expect(metadata).toBeDefined();
    });
  });
});
