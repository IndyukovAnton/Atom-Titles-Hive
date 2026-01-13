import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggerService } from './utils/logger.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Получаем LoggerService из контекста приложения
  const logger = app.get(LoggerService);

  // Глобальный Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS для frontend
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'tauri://localhost',
      'http://tauri.localhost',
    ],
    credentials: true,
  });

  const port = process.env.PORT || 1221;
  await app.listen(port);

  const message = `Backend running on http://localhost:${port}`;
  console.log(`🚀 ${message}`);
  await logger.log(message);

  // Запуск очистки старых логов при старте
  const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
  await logger.cleanOldLogs(retentionDays);
}

bootstrap().catch(async (err: unknown) => {
  const logger = new LoggerService();
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  const errorStack = err instanceof Error ? err.stack : undefined;
  await logger.error(
    `Application failed to start: ${errorMessage}`,
    errorStack,
  );
  process.exit(1);
});
