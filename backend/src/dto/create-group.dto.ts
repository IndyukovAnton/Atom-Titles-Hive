import { IsString, MinLength, MaxLength, IsOptional, IsNumber } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}
