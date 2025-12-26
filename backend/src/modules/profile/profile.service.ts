import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { MediaEntry } from '../../entities/media-entry.entity';
import { UpdateProfileDto } from '../../dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MediaEntry)
    private mediaRepository: Repository<MediaEntry>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверка смены пароля
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to set new password');
      }

      const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      user.password = await bcrypt.hash(dto.newPassword, 10);
    }

    // Обновление других полей
    if (dto.username) {
      user.username = dto.username;
    }

    if (dto.email) {
      user.email = dto.email;
    }

    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }

  async getStats(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Общее количество записей
    const totalEntries = await this.mediaRepository.count({ where: { userId } });

    // Получить все записи для анализа
    const entries = await this.mediaRepository.find({ where: { userId } });

    // Любимая категория (наиболее частая)
    const categoryCount: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.category) {
        categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
      }
    });
    const favoriteCategory = Object.keys(categoryCount).length > 0
      ? Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Любимый жанр
    const genreCount: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.genres) {
        try {
          const genres = typeof entry.genres === 'string' ? JSON.parse(entry.genres) : entry.genres;
          if (Array.isArray(genres)) {
            genres.forEach((genre: string) => {
              genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
          }
        } catch (e) {
          // Игнорируем ошибки парсинга
        }
      }
    });
    const favoriteGenre = Object.keys(genreCount).length > 0
      ? Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Общее время просмотра (дни между startDate и endDate)
    let totalWatchTime = 0;
    let monthWatchTime = 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    entries.forEach(entry => {
      if (entry.startDate && entry.endDate) {
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (days > 0) {
          totalWatchTime += days;

          // Проверяем, попадает ли в текущий месяц
          if (end >= monthStart) {
            monthWatchTime += days;
          }
        }
      }
    });

    return {
      totalEntries,
      favoriteCategory,
      favoriteGenre,
      totalWatchTimeDays: totalWatchTime,
      currentMonthWatchTimeDays: monthWatchTime,
      entriesByCategory: categoryCount,
      entriesByGenre: genreCount,
    };
  }
}
