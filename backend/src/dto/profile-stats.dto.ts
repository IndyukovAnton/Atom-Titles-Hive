import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export interface AchievementProgressItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  group: 'collection' | 'rating' | 'diversity' | 'category' | 'genre';
  xp: number;
  value: number;
  target: number;
  unlocked: boolean;
}

export interface ResolvedTitleDto {
  code: string;
  label: string;
  source: 'category' | 'genre';
  basis: string;
}

/**
 * DTO для возврата статистики профиля пользователя.
 */
export class ProfileStatsDto {
  /** Общее количество медиа-записей пользователя. */
  @IsNumber()
  totalEntries: number;

  /** Сколько записей имеют рейтинг > 0 (для подсчёта прогресса «Критика»). */
  @IsNumber()
  ratedEntries: number;

  /** Средний рейтинг по записям с rating > 0. */
  @IsNumber()
  averageRating: number;

  /** Самая частая категория, либо null. */
  @IsOptional()
  @IsString()
  favoriteCategory: string | null;

  /** Самый частый жанр, либо null. */
  @IsOptional()
  @IsString()
  favoriteGenre: string | null;

  /** Распределение по категориям: { Movie: 12, Anime: 5, ... }. */
  @IsObject()
  byCategory: Record<string, number>;

  /** Распределение по жанрам: { Фэнтези: 8, Драма: 5, ... }. */
  @IsObject()
  byGenre: Record<string, number>;

  /** Общее «время просмотра» в часах (сумма endDate - startDate по записям). */
  @IsNumber()
  totalWatchTime: number;

  /** То же, но за текущий месяц. */
  @IsNumber()
  currentMonthWatchTime: number;

  /** Накопленные очки опыта. */
  @IsNumber()
  totalXp: number;

  /** Текущий уровень (1-based). */
  @IsNumber()
  level: number;

  /** XP, отнятые от старта текущего уровня. */
  @IsNumber()
  levelProgress: number;

  /** Сколько XP нужно набрать в этом уровне до следующего. */
  @IsNumber()
  levelTarget: number;

  /** Активное звание (закреплённое или авто-расчётное), либо null. */
  @IsOptional()
  @IsObject()
  title: ResolvedTitleDto | null;

  /** Все звания, которые пользователь уже заработал (можно выбрать одно для закрепления). */
  @IsArray()
  earnedTitles: ResolvedTitleDto[];

  /** Прогресс по каждому достижению из каталога. */
  @IsArray()
  achievements: AchievementProgressItem[];
}
