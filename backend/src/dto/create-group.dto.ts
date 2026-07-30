import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsNumber,
  ValidateIf,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  // Явный null валиден — так группу выносят в корень
  @IsOptional()
  @ValidateIf((_dto, value) => value !== null)
  @IsNumber()
  parentId?: number | null;
}
