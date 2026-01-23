import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsDateString,
  IsObject,
  IsBoolean,
} from 'class-validator';

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

  @IsOptional()
  @IsObject()
  preferences?: {
    theme?: string;
    background?: string;
    fontSize?: number;
  };

  @IsOptional()
  @IsBoolean()
  hasCompletedOnboarding?: boolean;
}
