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
import {
  ProfileStatsDto,
  type AchievementProgressItem,
} from '../../dto/profile-stats.dto';
import { LoggerService } from '../../utils/logger.service';
import {
  ACHIEVEMENT_CATALOG,
  XP_PER_ENTRY,
  levelFromXp,
  resolveTitle,
  xpForLevel,
  type AchievementInput,
} from '../../utils/achievements';

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
      birthDate: user.birthDate,
      preferences: user.preferences,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // Trigger rebuild 1
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

      if (!user.password) {
        await this.logger.warn(
          `Failed password change attempt for user ${userId}: User has no password (OAuth account)`,
        );
        throw new BadRequestException('User has no password set');
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

    if (dto.birthDate !== undefined) {
      user.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
      changes.push('birthDate');
    }

    if (dto.preferences !== undefined) {
      // PATCH-семантика: shallow-merge с существующими preferences, чтобы
      // частичный апдейт (например, только { theme }) не затирал avatar /
      // aiKey / tmdbApiKey и другие поля, которые отправитель в payload не включил.
      user.preferences = {
        ...(user.preferences ?? {}),
        ...dto.preferences,
      };
      changes.push('preferences');
    }

    if (dto.hasCompletedOnboarding !== undefined) {
      user.hasCompletedOnboarding = dto.hasCompletedOnboarding;
      changes.push('hasCompletedOnboarding');
    }

    // Trigger rebuild 2
    await this.userRepository.save(user);
    await this.logger.log(
      `Profile updated for user ${userId} (${user.username}). Changed fields: ${changes.join(', ')}`,
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      birthDate: user.birthDate,
      preferences: user.preferences,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
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

    const entries = await this.mediaRepository.find({ where: { userId } });

    // Базовые агрегаты
    const totalEntries = entries.length;
    const byCategory = this.aggregateByCategory(entries);
    const byGenre = this.aggregateByGenre(entries);
    const favoriteCategory = pickTop(byCategory);
    const favoriteGenre = pickTop(byGenre);
    const totalWatchTime = this.getTotalWatchTime(entries);
    const currentMonthWatchTime = this.getCurrentMonthWatchTime(entries);

    // Рейтинги
    const ratedEntries = entries.filter((e) => e.rating > 0);
    const averageRating =
      ratedEntries.length === 0
        ? 0
        : ratedEntries.reduce((sum, e) => sum + e.rating, 0) /
          ratedEntries.length;

    // Прогресс по достижениям
    const achievementInput: AchievementInput = {
      totalEntries,
      ratedEntries: ratedEntries.length,
      averageRating,
      byCategory,
      byGenre,
      uniqueCategories: Object.keys(byCategory).length,
    };
    const achievements: AchievementProgressItem[] = ACHIEVEMENT_CATALOG.map(
      (a) => {
        const { value, target } = a.evaluate(achievementInput);
        return {
          code: a.code,
          title: a.title,
          description: a.description,
          icon: a.icon,
          group: a.group,
          xp: a.xp,
          value: Math.min(value, target),
          target,
          unlocked: value >= target,
        };
      },
    );

    // XP — за каждую запись + за каждое разблокированное достижение
    const xpFromEntries = totalEntries * XP_PER_ENTRY;
    const xpFromAchievements = achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.xp, 0);
    const totalXp = xpFromEntries + xpFromAchievements;

    const level = levelFromXp(totalXp);
    const xpAtThisLevel = xpForLevel(level);
    const xpForNextLevel = xpForLevel(level + 1);
    const levelProgress = Math.max(0, totalXp - xpAtThisLevel);
    const levelTarget = Math.max(1, xpForNextLevel - xpAtThisLevel);

    const title = resolveTitle(favoriteCategory, favoriteGenre, totalEntries);

    await this.logger.log(
      `Statistics accessed by user ${userId} (${user.username})`,
    );

    return {
      totalEntries,
      ratedEntries: ratedEntries.length,
      averageRating: Math.round(averageRating * 10) / 10,
      favoriteCategory,
      favoriteGenre,
      byCategory,
      byGenre,
      totalWatchTime,
      currentMonthWatchTime,
      totalXp,
      level,
      levelProgress,
      levelTarget,
      title,
      achievements,
    };
  }

  private aggregateByCategory(entries: MediaEntry[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const e of entries) {
      if (e.category) out[e.category] = (out[e.category] ?? 0) + 1;
    }
    return out;
  }

  private aggregateByGenre(entries: MediaEntry[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const e of entries) {
      if (!e.genres) continue;
      try {
        const parsed: unknown =
          typeof e.genres === 'string' ? JSON.parse(e.genres) : e.genres;
        if (!Array.isArray(parsed)) continue;
        for (const g of parsed) {
          if (typeof g === 'string' && g) out[g] = (out[g] ?? 0) + 1;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        void this.logger.warn(
          `Failed to parse genres for entry ${e.id}: ${message}`,
        );
      }
    }
    return out;
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

function pickTop(counts: Record<string, number>): string | null {
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
