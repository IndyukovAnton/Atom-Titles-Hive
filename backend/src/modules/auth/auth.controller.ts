import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { ChangePasswordDto } from '../../dto/change-password.dto';
import type { AuthenticatedRequest } from '../../types/authenticated-request.interface';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  AUTH_THROTTLE_LIMIT,
  THROTTLE_TTL_MS,
} from '../../config/throttle.config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // Жёсткий лимит на попытки входа/регистрации — защита от брутфорса.
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: THROTTLE_TTL_MS } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getUserProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Метод инициирует перенаправление на Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: unknown, @Res() res: Response) {
    const result = await this.authService.googleLogin(req);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5005';

    // Токен передаём во фрагменте (#), а не в query: фрагмент не попадает
    // в access-логи серверов, Referer и сетевые журналы.
    res.redirect(`${frontendUrl}/auth/callback#token=${result.access_token}`);
  }
}
