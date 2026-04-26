import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsDateString,
  IsObject,
  IsBoolean,
} from 'class-validator';
import type { UserPreferences } from '../entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  // Принимаем preferences как opaque-объект и сохраняем в JSON-колонке.
  // Тип берём из entity, чтобы schema фронта и БД оставались синхронны.
  @IsOptional()
  @IsObject()
  preferences?: UserPreferences;

  @IsOptional()
  @IsBoolean()
  hasCompletedOnboarding?: boolean;
}
