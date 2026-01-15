import { IsOptional, IsDateString, IsBoolean, IsObject, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AiLimitsDto {
  @IsOptional()
  @IsNumber()
  dailyRequests?: number;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}

class PreferencesDto {
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
