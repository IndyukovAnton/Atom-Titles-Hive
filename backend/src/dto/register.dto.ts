import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  // Пустая строка нормализуется в undefined до валидации — иначе @IsEmail её отклонит
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsEmail({}, { message: 'Некорректный формат email' })
  @MaxLength(100, { message: 'Email не должен превышать 100 символов' })
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
