import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: any) {
    const user = await this.profileService.getProfile(req.user.userId);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Put()
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.profileService.updateProfile(
      req.user.userId,
      updateProfileDto,
    );
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
