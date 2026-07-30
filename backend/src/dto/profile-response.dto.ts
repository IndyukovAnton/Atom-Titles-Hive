import {
  IsNumber,
  IsString,
  IsEmail,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ProfileStatsDto } from './profile-stats.dto';

/**
 * DTO для возврата информации о профиле пользователя
 */
export class ProfileResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsOptional()
  @IsEmail()
  email: string | null;

  @IsDate()
  createdAt: Date;

  /**
   * Статистика пользователя (опционально)
   * Включается при запросе GET /profile или GET /profile/stats
   */
  stats?: ProfileStatsDto;
}
