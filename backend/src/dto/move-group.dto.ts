import { IsDefined, IsNumber, IsOptional, ValidateIf } from 'class-validator';

/**
 * Перемещение группы: смена родителя и/или позиции среди siblings.
 * parentId: null — в корень. beforeId: null/отсутствует — в конец siblings.
 */
export class MoveGroupDto {
  @IsDefined()
  @ValidateIf((_dto, value) => value !== null)
  @IsNumber()
  parentId: number | null;

  @IsOptional()
  @ValidateIf((_dto, value) => value !== null)
  @IsNumber()
  beforeId?: number | null;
}
