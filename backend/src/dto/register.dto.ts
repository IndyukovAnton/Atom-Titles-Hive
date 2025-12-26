import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail({}, { message: 'Некорректный формат email' })
  @MaxLength(100, { message: 'Email не должен превышать 100 символов' })
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
