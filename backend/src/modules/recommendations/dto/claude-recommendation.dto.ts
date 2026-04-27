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
import { Type } from 'class-transformer';

export const CLAUDE_MODELS = [
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
] as const;
export type ClaudeModelId = (typeof CLAUDE_MODELS)[number];

export const MOOD_TAGS = [
  'light',
  'cozy',
  'sad',
  'energetic',
  'thoughtful',
  'thrilling',
  'romantic',
  'escapist',
] as const;
export type MoodTag = (typeof MOOD_TAGS)[number];

export const CONTENT_TYPES = [
  'movie',
  'series',
  'anime',
  'book',
  'game',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export class ClaudeRecommendationFiltersDto {
  @IsOptional()
  @IsArray()
  @IsEnum(CONTENT_TYPES, { each: true })
  types?: ContentType[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  minRating?: number;
}

export class ClaudeRecommendationRequestDto {
  @IsString()
  @MaxLength(5000)
  apiKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;

  @IsOptional()
  @IsEnum(MOOD_TAGS)
  mood?: MoodTag;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClaudeRecommendationFiltersDto)
  filters?: ClaudeRecommendationFiltersDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;

  @IsOptional()
  @IsEnum(CLAUDE_MODELS)
  model?: ClaudeModelId;

  @IsOptional()
  useWebSearch?: boolean;
}

export interface AICard {
  title: string;
  originalTitle?: string;
  type: ContentType | 'other';
  year?: number;
  genres: string[];
  whyRecommended: string;
  estimatedRating?: number;
  releasedRecently?: boolean;
  notInLibrary: boolean;
  posterUrl?: string;
}

export interface ClaudeRecommendationResponse {
  recommendations: AICard[];
  meta: {
    tokensInput: number;
    tokensOutput: number;
    cacheReadTokens: number;
    modelUsed: string;
    webSearched: boolean;
    libraryTruncated: boolean;
    librarySize: number;
  };
}
