import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { MediaEntry } from '../../entities/media-entry.entity';
import { UpdateProfileDto } from '../../dto/update-profile.dto';
import { ProfileStatsDto } from '../../dto/profile-stats.dto';
import { LoggerService } from '../../utils/logger.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MediaEntry)
    private mediaRepository: Repository<MediaEntry>,
    private logger: LoggerService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.logger.log(
      `Profile accessed by user ${userId} (${user.username})`,
    );

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

    const changes: string[] = [];

    // Проверка смены пароля
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException(
          'Current password is required to set new password',
        );
      }

      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        await this.logger.warn(
          `Failed password change attempt for user ${userId}`,
        );
        throw new BadRequestException('Current password is incorrect');
      }

      user.password = await bcrypt.hash(dto.newPassword, 10);
      changes.push('password');
    }

    // Обновление других полей
    if (dto.username) {
      user.username = dto.username;
      changes.push('username');
    }

    if (dto.email) {
      user.email = dto.email;
      changes.push('email');
    }

    await this.userRepository.save(user);
    await this.logger.log(
      `Profile updated for user ${userId} (${user.username}). Changed fields: ${changes.join(', ')}`,
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }

  /**
   * Получить полную статистику пользователя
   * @param userId - ID пользователя
   * @returns Статистика профиля
   */
  async getStats(userId: number): Promise<ProfileStatsDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Получаем все записи пользователя одним запросом
    const entries = await this.mediaRepository.find({ where: { userId } });

    // Вычисляем все метрики
    const totalEntries = await this.getTotalEntries(userId);
    const favoriteCategory = this.getFavoriteCategory(entries);
    const favoriteGenre = this.getFavoriteGenre(entries);
    const totalWatchTime = this.getTotalWatchTime(entries);
    const currentMonthWatchTime = this.getCurrentMonthWatchTime(entries);

    await this.logger.log(
      `Statistics accessed by user ${userId} (${user.username})`,
    );

    return {
      totalEntries,
      favoriteCategory,
      favoriteGenre,
      totalWatchTime,
      currentMonthWatchTime,
    };
  }

  /**
   * Получить общее количество медиа-записей пользователя
   * @param userId - ID пользователя
   * @returns Количество записей
   */
  private async getTotalEntries(userId: number): Promise<number> {
    return await this.mediaRepository.count({ where: { userId } });
  }

  /**
   * Определить наиболее частую категорию из записей
   * @param entries - Массив медиа-записей
   * @returns Название наиболее частой категории или null
   */
  private getFavoriteCategory(entries: MediaEntry[]): string | null {
    if (entries.length === 0) {
      return null;
    }

    const categoryCount: Record<string, number> = {};

    entries.forEach((entry) => {
      if (entry.category) {
        categoryCount[entry.category] =
          (categoryCount[entry.category] || 0) + 1;
      }
    });

    if (Object.keys(categoryCount).length === 0) {
      return null;
    }

    // Находим категорию с максимальным количеством
    const [favoriteCategory] = Object.entries(categoryCount).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return favoriteCategory;
  }

  /**
   * Определить наиболее частый жанр из всех записей
   * @param entries - Массив медиа-записей
   * @returns Название наиболее частого жанра или null
   */
  private getFavoriteGenre(entries: MediaEntry[]): string | null {
    if (entries.length === 0) {
      return null;
    }

    const genreCount: Record<string, number> = {};

    entries.forEach((entry) => {
      if (entry.genres) {
        try {
          // Обработка JSON строки или уже распарсенного массива
          const genres: unknown =
            typeof entry.genres === 'string'
              ? JSON.parse(entry.genres)
              : entry.genres;

          if (Array.isArray(genres)) {
            genres.forEach((genre: string) => {
              if (genre && typeof genre === 'string') {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
              }
            });
          }
        } catch (e) {
          // Игнорируем некорректные JSON данные
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          void this.logger.warn(
            `Failed to parse genres for entry ${entry.id}: ${errorMessage}`,
          );
        }
      }
    });

    if (Object.keys(genreCount).length === 0) {
      return null;
    }

    // Находим жанр с максимальным количеством
    const [favoriteGenre] = Object.entries(genreCount).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return favoriteGenre;
  }

  /**
   * Вычислить общее время просмотра всех записей в часах
   * @param entries - Массив медиа-записей
   * @returns Время просмотра в часах (округлено до 1 десятичного знака)
   */
  private getTotalWatchTime(entries: MediaEntry[]): number {
    let totalHours = 0;

    entries.forEach((entry) => {
      if (entry.startDate && entry.endDate) {
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);

        // Вычисляем разницу в миллисекундах
        const diffMs = end.getTime() - start.getTime();

        // Конвертируем в часы
        if (diffMs > 0) {
          const hours = diffMs / (1000 * 60 * 60);
          totalHours += hours;
        }
      }
    });

    // Округляем до 1 десятичного знака
    return Math.round(totalHours * 10) / 10;
  }

  /**
   * Вычислить время просмотра за текущий месяц в часах
   * @param entries - Массив медиа-записей
   * @returns Время просмотра за текущий месяц в часах (округлено до 1 десятичного знака)
   */
  private getCurrentMonthWatchTime(entries: MediaEntry[]): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    let monthHours = 0;

    entries.forEach((entry) => {
      if (entry.startDate && entry.endDate) {
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);

        // Проверяем, попадает ли запись в текущий месяц
        // Учитываем записи, где endDate находится в текущем месяце
        if (end >= monthStart && end <= monthEnd) {
          const diffMs = end.getTime() - start.getTime();

          if (diffMs > 0) {
            const hours = diffMs / (1000 * 60 * 60);
            monthHours += hours;
          }
        }
      }
    });

    // Округляем до 1 десятичного знака
    return Math.round(monthHours * 10) / 10;
  }
}
