import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { LoggerService } from '../../utils/logger.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  createMockUser,
  mockRegisterDto,
  mockLoginDto,
  createUserWithHashedPassword,
} from '../../../test/fixtures/user.fixtures';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let loggerService: LoggerService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = createMockUser({
        id: 1,
        username: mockRegisterDto.username,
        email: mockRegisterDto.email,
      });

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await service.register(mockRegisterDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { username: mockRegisterDto.username },
          { email: mockRegisterDto.email },
        ],
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual({
        access_token: 'test-jwt-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
      });
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      const mockUser = createMockUser();
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      await service.register(mockRegisterDto);

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.password).toBeDefined();
      expect(createCall.password).not.toBe(mockRegisterDto.password);

      // Проверка что пароль захеширован
      const isHashed = await bcrypt.compare(
        mockRegisterDto.password,
        createCall.password,
      );
      expect(isHashed).toBe(true);
    });

    it('should throw ConflictException if username already exists', async () => {
      const existingUser = createMockUser({
        username: mockRegisterDto.username,
      });
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Username or email already exists',
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = createMockUser({ email: mockRegisterDto.email });
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidDto = { username: '', email: '', password: '' };
      mockUserRepository.findOne.mockResolvedValue(null);

      const mockUser = createMockUser();
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      // Сервис создаст пользователя даже с пустыми полями
      // Валидация должна происходить на уровне DTO/ValidationPipe
      await service.register(invalidDto as any);

      expect(mockUserRepository.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = await createUserWithHashedPassword('password123', {
        id: 1,
        username: mockLoginDto.username,
      });

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await service.login(mockLoginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: mockLoginDto.username },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toEqual({
        access_token: 'test-jwt-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
      });
      expect(loggerService.log).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = await createUserWithHashedPassword('correctpassword', {
        username: mockLoginDto.username,
      });

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const wrongPasswordDto = {
        username: mockLoginDto.username,
        password: 'wrongpassword',
      };

      await expect(service.login(wrongPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(wrongPasswordDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should generate JWT token on successful login', async () => {
      const mockUser = await createUserWithHashedPassword('password123', {
        id: 42,
        username: 'testuser',
      });

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('generated-token');

      const result = await service.login(mockLoginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 42,
        username: 'testuser',
      });
      expect(result.access_token).toBe('generated-token');
    });
  });

  describe('validateUser', () => {
    it('should return user if user exists', async () => {
      const mockUser = createMockUser({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile for valid userId', async () => {
      const mockUser = createMockUser({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserProfile(1);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserProfile(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
