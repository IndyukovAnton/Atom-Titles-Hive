# Задача BE-01: Миграции TypeORM в runtime (MSI/sidecar) + запрет synchronize вне dev

## Приоритет
🔴 **КРИТИЧЕСКИЙ** - Стабильность БД

## Зависимости
- SEC-01: Удаление секретов из Git (для безопасной работы с .env)

## Описание проблемы
В текущей runtime‑конфигурации TypeORM:
- схема БД меняется через `synchronize` (управляется `TYPEORM_SYNCHRONIZE`);
- **миграции не используются** (в `backend/src/app.module.ts` стоит `migrations: []` и `migrationsRun: false`);
- в desktop sidecar дополнительно **принудительно** выставляется `TYPEORM_SYNCHRONIZE=true`.

Это делает MSI‑релиз нестабильным:
- нет безопасного upgrade‑пути (версионирование схемы отсутствует),
- “first run” на чистой системе не гарантирован (схема должна создаваться миграциями),
- риск потери данных при изменениях entities.

## Цель задачи
Сделать так, чтобы **в релизной сборке (MSI/sidecar)** схема создавалась/обновлялась **миграциями**, а `synchronize` работал максимум в dev (и не форсировался из desktop).

## Чек-лист выполнения

### Этап 1: Привести CLI DataSource (`backend/ormconfig.ts`) к runtime
- [ ] Файл `backend/ormconfig.ts` уже существует — убедиться, что:
  - `migrations: ['src/migrations/*.ts']` есть,
  - `synchronize` выключен для CLI (лучше всегда `false`),
  - путь к БД берётся из `DATABASE_PATH` (для desktop будет app data dir),
  - набор entities соответствует runtime.

### Этап 2: Обновление package.json скриптов
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\package.json`
- [ ] Обновить секцию scripts:
  ```json
  {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d ormconfig.ts",
    "migration:create": "typeorm-ts-node-commonjs migration:create",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d ormconfig.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d ormconfig.ts",
    "migration:show": "typeorm-ts-node-commonjs migration:show -d ormconfig.ts"
  }
  ```

### Этап 3: Создание директории для миграций
- [ ] Создать папку `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\migrations`

### Этап 4: Генерация начальной миграции
- [ ] Убедиться что БД существует и содержит текущую схему
- [ ] Выполнить команду для генерации миграции:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm run migration:generate src/migrations/InitialSchema
  ```
- [ ] Проверить созданный файл миграции в `src/migrations/`
- [ ] Если миграция пустая (нет изменений), создать вручную:
  ```bash
  npm run migration:create src/migrations/InitialSchema
  ```

### Этап 5: Заполнение начальной миграции (если создавали вручную)
- [ ] Открыть созданный файл миграции
- [ ] Добавить SQL для создания всех таблиц:
  ```typescript
  import { MigrationInterface, QueryRunner } from "typeorm";

  export class InitialSchema1234567890123 implements MigrationInterface {
    name = 'InitialSchema1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
      // Создание таблицы users
      await queryRunner.query(`
        CREATE TABLE "user" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "username" varchar NOT NULL UNIQUE,
          "email" varchar NOT NULL UNIQUE,
          "password" varchar,
          "googleId" varchar UNIQUE,
          "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
          "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // Создание таблицы groups
      await queryRunner.query(`
        CREATE TABLE "group" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "name" varchar NOT NULL,
          "userId" integer NOT NULL,
          "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
          "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE
        )
      `);

      // Создание таблицы media_entry
      await queryRunner.query(`
        CREATE TABLE "media_entry" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "title" varchar NOT NULL,
          "description" text,
          "rating" integer,
          "startDate" datetime,
          "endDate" datetime,
          "genres" text,
          "category" varchar,
          "tags" text,
          "status" varchar DEFAULT 'not_started',
          "userId" integer NOT NULL,
          "groupId" integer,
          "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
          "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE,
          FOREIGN KEY ("groupId") REFERENCES "group" ("id") ON DELETE SET NULL
        )
      `);

      // Создание таблицы media_file
      await queryRunner.query(`
        CREATE TABLE "media_file" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "filename" varchar NOT NULL,
          "originalName" varchar NOT NULL,
          "mimeType" varchar NOT NULL,
          "size" integer NOT NULL,
          "path" varchar NOT NULL,
          "mediaEntryId" integer NOT NULL,
          "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY ("mediaEntryId") REFERENCES "media_entry" ("id") ON DELETE CASCADE
        )
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE "media_file"`);
      await queryRunner.query(`DROP TABLE "media_entry"`);
      await queryRunner.query(`DROP TABLE "group"`);
      await queryRunner.query(`DROP TABLE "user"`);
    }
  }
  ```

### Этап 6: Обновление app.module.ts
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\app.module.ts`
- [ ] Обновить TypeORM конфигурацию:
  ```typescript
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const env = configService.get<string>('NODE_ENV') || 'development';
      const dbPathConfig = configService.get<string>('DATABASE_PATH')!;
      
      const dbPath = getDatabasePath(env, dbPathConfig);
      console.log(`[Database] Using database at: ${dbPath}`);

      // synchronize: максимум dev; в релизе должно быть false
      const sync =
        env === 'development' &&
        configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true';

      return {
        type: 'sqlite',
        database: dbPath,
        entities: [User, MediaEntry, MediaFile, Group],
        synchronize: sync, // Только для development!
        migrations: ['dist/migrations/*.js'], // Путь к скомпилированным миграциям
        migrationsRun: true, // релиз/sidecar: автозапуск миграций при старте
        logging: configService.get<string>('TYPEORM_LOGGING') === 'true',
      };
    },
  }),
  ```

### Этап 7: Обновление .env.example
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\.env.example`
- [ ] Добавить переменные:
  ```env
  # TypeORM Configuration
  TYPEORM_SYNCHRONIZE=true  # Only for development! Set to false in production
  TYPEORM_LOGGING=false
  
  # Environment
  NODE_ENV=development  # development | production | staging
  ```

### Этап 8: Обновление tsconfig.json
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\tsconfig.json`
- [ ] Убедиться что миграции будут компилироваться:
  ```json
  {
    "compilerOptions": {
      // ... existing config
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "test"]
  }
  ```

### Этап 9: Тестирование миграций
- [ ] Создать backup БД:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive
  copy data\database.sqlite data\database.sqlite.backup
  ```
- [ ] Удалить БД для чистого теста:
  ```bash
  del data\database.sqlite
  ```
- [ ] Запустить миграции:
  ```bash
  cd backend
  npm run migration:run
  ```
- [ ] Проверить что БД создана и таблицы существуют
- [ ] Запустить backend:
  ```bash
  npm run start:dev
  ```
- [ ] Проверить что приложение работает

### Этап 10: Создание документации
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\docs\database-migrations.md`:
  ```markdown
  # Database Migrations Guide

  ## Создание новой миграции

  ### Автоматическая генерация (рекомендуется)
  ```bash
  cd backend
  npm run migration:generate src/migrations/DescriptiveName
  ```

  ### Ручное создание
  ```bash
  npm run migration:create src/migrations/DescriptiveName
  ```

  ## Применение миграций
  ```bash
  npm run migration:run
  ```

  ## Откат последней миграции
  ```bash
  npm run migration:revert
  ```

  ## Просмотр статуса миграций
  ```bash
  npm run migration:show
  ```

  ## Best Practices
  - Всегда создавайте backup БД перед миграцией
  - Тестируйте миграции на копии production БД
  - Пишите `down()` методы для отката
  - Используйте транзакции для критичных операций
  ```

### Этап 11: Обновление README.md
- [ ] Добавить секцию "Database Migrations" в корневой README.md:
  ```markdown
  ## Database Migrations

  This project uses TypeORM migrations for database schema management.

  **Important**: `synchronize` is disabled in production. Always use migrations!

  See [docs/database-migrations.md](docs/database-migrations.md) for details.
  ```

## Критерии приёмки
- ✅ CLI DataSource и runtime‑конфиг согласованы
- ✅ Начальная миграция создана
- ✅ Миграции успешно применяются к пустой БД
- ✅ `synchronize` отключен в production
- ✅ Backend запускается и работает с миграциями
- ✅ Документация создана
- ✅ Скрипты миграций работают

## Дополнительно (обязательно для MSI/sidecar)
- [ ] Desktop sidecar **не** форсирует `TYPEORM_SYNCHRONIZE=true` (см. `docs/tasks/work/01-tauri-setup.md`).
- [ ] В релизной сборке backend реально содержит compiled migrations (`dist/migrations/*.js`).

## Тестирование

### Тест 1: Чистая установка
- [ ] Удалить `data/database.sqlite`
- [ ] Выполнить `npm run migration:run`
- [ ] Проверить что БД создана
- [ ] Запустить backend
- [ ] Зарегистрировать пользователя
- [ ] Создать медиа запись
- [ ] Проверить что данные сохраняются

### Тест 2: Откат миграции
- [ ] Выполнить `npm run migration:revert`
- [ ] Проверить что таблицы удалены
- [ ] Выполнить `npm run migration:run`
- [ ] Проверить что таблицы восстановлены

### Тест 3: Production режим
- [ ] Установить `NODE_ENV=production` в `.env`
- [ ] Установить `TYPEORM_SYNCHRONIZE=false`
- [ ] Пересобрать backend: `npm run build`
- [ ] Запустить: `npm run start:prod`
- [ ] Проверить что миграции применились автоматически
- [ ] Проверить что synchronize не работает

### Тест 4: Создание новой миграции
- [ ] Добавить новое поле в entity (например, `avatar` в User)
- [ ] Выполнить `npm run migration:generate src/migrations/AddUserAvatar`
- [ ] Проверить что миграция создана
- [ ] Выполнить `npm run migration:run`
- [ ] Проверить что поле добавлено в БД

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Миграции настроены и работают
2. ✅ `synchronize` отключен в production
3. ✅ Начальная миграция применяется к пустой БД
4. ✅ Backend работает в dev и prod режимах
5. ✅ Откат миграций работает
6. ✅ Документация полная
7. ✅ Все тесты пройдены

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/backend/01-typeorm-migrations.md`
