import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional() // Handled by default value in class or external default
  PORT: number = 3553;

  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters long for security',
  })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  DATABASE_PATH: string;

  @IsOptional()
  @IsString()
  TYPEORM_SYNCHRONIZE: string;

  @IsOptional()
  @IsString()
  TYPEORM_LOGGING: string;

  @IsOptional()
  @IsNumber()
  LOG_RETENTION_DAYS: number = 30;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsOptional()
  @IsString()
  GOOGLE_CALLBACK_URL: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL: string = 'http://localhost:5005';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
