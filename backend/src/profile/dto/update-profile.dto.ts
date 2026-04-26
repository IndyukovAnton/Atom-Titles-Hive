import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AiLimitsDto {
  @IsOptional()
  @IsNumber()
  dailyRequests?: number;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}

class PrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  shareWatchHistory?: boolean;

  @IsOptional()
  @IsBoolean()
  shareBirthDate?: boolean;
}

class PreferencesDto {
  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: 'light' | 'dark';

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsNumber()
  fontSize?: number;

  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  aiProvider?: string;

  @IsOptional()
  @IsString()
  aiKey?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiLimitsDto)
  aiLimits?: AiLimitsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacySettings?: PrivacySettingsDto;

  @IsOptional()
  @IsString()
  tmdbApiKey?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsIn(['mirror', 'poster'])
  addEntryPreviewStyle?: 'mirror' | 'poster';
}

export class UpdateProfileDto {
  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;

  @IsOptional()
  @IsBoolean()
  hasCompletedOnboarding?: boolean;
}
