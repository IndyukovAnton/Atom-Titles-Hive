import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';

export const MEDIA_SOURCES = ['ai'] as const;
export type MediaSource = (typeof MEDIA_SOURCES)[number];

export class CreateMediaDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber({}, { message: 'groupId должен быть числом или null' })
  groupId?: number | null;

  @IsOptional()
  @IsIn(MEDIA_SOURCES, { message: 'Недопустимый источник записи' })
  source?: MediaSource;
}
