import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import * as crypto from 'crypto';
// Polyfill global crypto for TypeORM/pkg compatibility
const globalLike = globalThis as unknown as { crypto?: unknown };
if (!globalLike.crypto) {
  (globalThis as unknown as { crypto: unknown }).crypto = crypto.webcrypto;
}
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggerService } from './utils/logger.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

async function ensureMigrationsAndUpgradeLegacySqlite(
  dataSource: DataSource,
  logger: LoggerService,
): Promise<void> {
  if (dataSource.options.type !== 'sqlite') {
    await dataSource.runMigrations();
    return;
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const usersRows: unknown = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`,
    );
    const hasUsersTable = Array.isArray(usersRows) && usersRows.length > 0;

    const migrationsRows: unknown = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'`,
    );
    const hasMigrationsTable =
      Array.isArray(migrationsRows) && migrationsRows.length > 0;

    let migrationsCount = 0;
    if (hasMigrationsTable) {
      const countRows: unknown = await queryRunner.query(
        `SELECT COUNT(1) as cnt FROM "migrations"`,
      );
      if (Array.isArray(countRows) && countRows.length > 0) {
        const first = countRows[0] as { cnt?: unknown };
        const cnt = first?.cnt;
        migrationsCount = typeof cnt === 'number' ? cnt : Number(cnt ?? 0);
      }
    }

    const isLegacyDb =
      hasUsersTable && (!hasMigrationsTable || migrationsCount === 0);

    if (isLegacyDb) {
      await logger.warn(
        '[Database] Legacy DB detected (tables exist but migrations table missing). Running one-time synchronize + baseline migrations.',
      );

      // One-time schema alignment for legacy databases that previously relied on synchronize.
      await dataSource.synchronize();

      // Create migrations table and mark all known migrations as executed
      await queryRunner.query(
        `CREATE TABLE IF NOT EXISTS "migrations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" bigint NOT NULL, "name" varchar NOT NULL)`,
      );
      await queryRunner.query(`DELETE FROM "migrations"`);

      const migrationNames = dataSource.migrations
        .map((m) => m?.name)
        .filter(
          (name): name is string => typeof name === 'string' && name.length > 0,
        );

      for (const name of migrationNames) {
        const match = /(\d{10,})$/.exec(name);
        const timestamp = match ? Number(match[1]) : Date.now();
        await queryRunner.query(
          `INSERT INTO "migrations" ("timestamp", "name") VALUES (?, ?)`,
          [timestamp, name],
        );
      }
    }
  } finally {
    await queryRunner.release();
  }

  await dataSource.runMigrations();
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

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
      'http://localhost:4173',
      'tauri://localhost',
      'http://tauri.localhost',
    ],
    credentials: true,
  });

  // Ensure DB is ready before listening (supports legacy DB upgrades)
  const dataSource = app.get(DataSource);
  await ensureMigrationsAndUpgradeLegacySqlite(dataSource, logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 1221;
  await app.listen(port);

  const message = `Backend running on http://localhost:${port}`;
  console.log(`🚀 ${message}`);
  await logger.log(message);

  // Маркер готовности для Tauri sidecar
  // Формат: BACKEND_READY:PORT — Tauri парсит это для определения порта
  console.log(`BACKEND_READY:${port}`);

  // Запуск очистки старых логов при старте
  const retentionDays = configService.get<number>('LOG_RETENTION_DAYS') || 30;
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
