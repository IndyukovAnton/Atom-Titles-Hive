import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.getProfile(userId);

    // Обновляем основные поля
    if (updateProfileDto.birthDate !== undefined) {
      user.birthDate = updateProfileDto.birthDate;
    }

    if (updateProfileDto.hasCompletedOnboarding !== undefined) {
      user.hasCompletedOnboarding = updateProfileDto.hasCompletedOnboarding;
    }

    // Обновляем preferences
    if (updateProfileDto.preferences) {
      user.preferences = {
        ...user.preferences,
        ...updateProfileDto.preferences,
      };
    }

    return await this.userRepository.save(user);
  }
}
