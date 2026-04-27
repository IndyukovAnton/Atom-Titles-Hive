import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CONTENT_TYPES, MOOD_TAGS } from './claude-recommendation.dto';
import type { ContentType, MoodTag } from './claude-recommendation.dto';

export const AI_SOURCES = ['claude-api', 'claude-cli'] as const;
export type AiSourceLiteral = (typeof AI_SOURCES)[number];

export class AiRecommendationFiltersDto {
  @IsOptional()
  @IsArray()
  @IsEnum(CONTENT_TYPES, { each: true })
  types?: ContentType[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  minRating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];
}

export class AiRecommendationModeDto {
  @IsOptional()
  newForMe?: boolean;
}

export class AiRecommendationRequestDto {
  @IsOptional()
  @IsEnum(AI_SOURCES)
  source?: AiSourceLiteral;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;

  @IsOptional()
  @IsEnum(MOOD_TAGS)
  mood?: MoodTag;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiRecommendationFiltersDto)
  filters?: AiRecommendationFiltersDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;

  @IsOptional()
  newForMe?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeTitles?: string[];
}
