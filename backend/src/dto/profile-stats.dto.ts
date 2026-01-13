import { IsNumber, IsString, IsOptional } from 'class-validator';

/**
 * DTO для возврата статистики профиля пользователя
 */
export class ProfileStatsDto {
  /**
   * Общее количество медиа-записей пользователя
   */
  @IsNumber()
  totalEntries: number;

  /**
   * Наиболее часто встречающаяся категория (Фильм, Сериал, Аниме и т.д.)
   * null если нет записей
   */
  @IsOptional()
  @IsString()
  favoriteCategory: string | null;

  /**
   * Наиболее часто встречающийся жанр
   * null если нет записей или жанров
   */
  @IsOptional()
  @IsString()
  favoriteGenre: string | null;

  /**
   * Общее время просмотра в часах
   * Вычисляется как сумма разниц между startDate и endDate всех записей
   */
  @IsNumber()
  totalWatchTime: number;

  /**
   * Время просмотра за текущий месяц в часах
   * Учитываются только записи, где endDate попадает в текущий месяц
   */
  @IsNumber()
  currentMonthWatchTime: number;
}
