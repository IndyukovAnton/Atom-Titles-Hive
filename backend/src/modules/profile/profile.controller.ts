import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from '../../dto/update-profile.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.profileService.getStats(req.user.userId);
  }

  @Patch()
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.userId, updateProfileDto);
  }
}
