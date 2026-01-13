import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from '../../dto/update-profile.dto';
import { ProfileStatsDto } from '../../dto/profile-stats.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../types/authenticated-request.interface';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Получить информацию о профиле текущего пользователя
   * @route GET /api/profile
   */
  @Get()
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.profileService.getProfile(req.user.userId);
  }

  /**
   * Получить статистику текущего пользователя
   * @route GET /api/profile/stats
   * @returns ProfileStatsDto
   */
  @Get('stats')
  getStats(@Request() req: AuthenticatedRequest): Promise<ProfileStatsDto> {
    return this.profileService.getStats(req.user.userId);
  }

  /**
   * Обновить профиль текущего пользователя
   * @route PATCH /api/profile
   */
  @Patch()
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(req.user.userId, updateProfileDto);
  }
}
