import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import { LoggerService } from '../../utils/logger.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async register(dto: RegisterDto) {
    // Проверка существования пользователя
    const existingUser = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      await this.logger.warn(
        `Registration failed: Username or email already exists - ${dto.username}/${dto.email}`,
      );
      throw new ConflictException('Username or email already exists');
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Создание пользователя
    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    await this.logger.log(
      `New user registered: ${user.username} (ID: ${user.id})`,
    );

    // Генерация JWT токена
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(dto: LoginDto) {
    // Поиск пользователя
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      await this.logger.warn(
        `Failed login attempt: User not found - ${dto.username}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверка пароля
    if (!user.password) {
      await this.logger.warn(
        `Failed login attempt: User has no password (OAuth account) - ${dto.username}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      await this.logger.warn(
        `Failed login attempt: Invalid password - ${dto.username}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.logger.log(`User logged in: ${user.username} (ID: ${user.id})`);

    // Генерация JWT токена
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async googleLogin(req: unknown) {
    type GoogleUserPayload = {
      googleId: string;
      email: string;
      picture?: string | null;
    };

    const maybeReq = req as { user?: unknown } | null;
    const maybeUser = maybeReq?.user as Partial<GoogleUserPayload> | null;

    if (
      !maybeUser ||
      typeof maybeUser.googleId !== 'string' ||
      typeof maybeUser.email !== 'string'
    ) {
      throw new UnauthorizedException('No user from google');
    }

    const googleId = maybeUser.googleId;
    const email = maybeUser.email;
    const picture =
      typeof maybeUser.picture === 'string' ? maybeUser.picture : undefined;

    // Поиск пользователя по googleId или email
    let user = await this.userRepository.findOne({
      where: [{ googleId }, { email }],
    });

    if (!user) {
      // Автоматическая регистрация нового пользователя
      // Генерируем уникальное имя пользователя из email
      const username =
        email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 7);

      user = this.userRepository.create({
        googleId,
        email,
        username,
        avatar: picture,
        hasCompletedOnboarding: false,
      });

      await this.userRepository.save(user);
      await this.logger.log(
        `New user registered via Google: ${user.username} (ID: ${user.id})`,
      );
    } else if (!user.googleId) {
      // Привязка Google к существующему аккаунту по email
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await this.userRepository.save(user);
      await this.logger.log(
        `Google account linked to existing user: ${user.username} (ID: ${user.id})`,
      );
    }

    // Генерация JWT токена
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.validateUser(userId);

    if (!user.password) {
      await this.logger.warn(
        `Change password failed: account has no password (OAuth-only) — user ${user.id}`,
      );
      throw new UnauthorizedException(
        'Account has no password set. Use OAuth provider.',
      );
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      await this.logger.warn(
        `Change password failed: invalid current password — user ${user.id}`,
      );
      throw new UnauthorizedException('Invalid current password');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    await this.logger.log(
      `Password changed: ${user.username} (ID: ${user.id})`,
    );

    return { success: true };
  }

  async getUserProfile(userId: number) {
    const user = await this.validateUser(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
