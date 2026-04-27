import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const SAVED_REC_STATUSES = ['considering', 'favorited'] as const;
export type SavedRecStatus = (typeof SAVED_REC_STATUSES)[number];

export const SAVED_REC_TYPES = [
  'movie',
  'series',
  'anime',
  'book',
  'game',
  'other',
] as const;
export type SavedRecType = (typeof SAVED_REC_TYPES)[number];

export class SaveRecommendationDto {
  @IsString()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  originalTitle?: string;

  @IsEnum(SAVED_REC_TYPES)
  type!: SavedRecType;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsString()
  @MaxLength(2000)
  whyRecommended!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  estimatedRating?: number;

  @IsOptional()
  @IsBoolean()
  releasedRecently?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  posterUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceModel?: string;

  @IsOptional()
  @IsEnum(SAVED_REC_STATUSES)
  status?: SavedRecStatus;
}

export class UpdateSavedRecommendationStatusDto {
  @IsEnum(SAVED_REC_STATUSES)
  status!: SavedRecStatus;
}
