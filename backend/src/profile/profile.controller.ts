import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    const user = await this.profileService.getProfile(req.user.userId);
    const userWithoutPassword = { ...user } as Record<string, unknown>;
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }

  @Put()
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.profileService.updateProfile(
      req.user.userId,
      updateProfileDto,
    );
    const userWithoutPassword = { ...updatedUser } as Record<string, unknown>;
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }
}
