# Задача BE-06: Добавление индексов БД для оптимизации запросов

## Приоритет
🟡 **ВАЖНЫЙ** - Производительность

## Зависимости
- BE-01: Настройка миграций TypeORM (для создания миграции с индексами)

## Описание проблемы
TypeORM entities не имеют индексов на foreign keys и часто используемых полях:
- `MediaEntry.userId` - используется в каждом запросе
- `MediaEntry.groupId` - используется для фильтрации
- `Group.userId` - используется для получения групп пользователя
- `MediaEntry.category` - используется для фильтрации
- `MediaEntry.status` - используется для рекомендаций

Без индексов запросы будут медленными при большом количестве записей.

## Цель задачи
Добавить индексы на все foreign keys и часто используемые поля для оптимизации производительности БД.

## Чек-лист выполнения

### Этап 1: Обновление User entity
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\entities\user.entity.ts`
- [ ] Добавить индексы:
  ```typescript
  import { Entity, Column, Index } from 'typeorm';

  @Entity()
  export class User {
    // ... existing fields

    @Index() // Индекс для быстрого поиска по username
    @Column({ unique: true })
    username: string;

    @Index() // Индекс для быстрого поиска по email
    @Column({ unique: true })
    email: string;

    @Index() // Индекс для Google OAuth
    @Column({ nullable: true, unique: true })
    googleId?: string;
  }
  ```

### Этап 2: Обновление MediaEntry entity
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\entities\media-entry.entity.ts`
- [ ] Добавить индексы:
  ```typescript
  import { Entity, Column, ManyToOne, Index } from 'typeorm';

  @Entity()
  @Index(['userId', 'category']) // Композитный индекс для фильтрации
  @Index(['userId', 'status']) // Композитный индекс для рекомендаций
  export class MediaEntry {
    // ... existing fields

    @Index() // Индекс на foreign key
    @Column()
    userId: number;

    @Index() // Индекс на foreign key
    @Column({ nullable: true })
    groupId?: number;

    @Index() // Индекс для фильтрации по категории
    @Column({ nullable: true })
    category?: string;

    @Index() // Индекс для фильтрации по статусу
    @Column({ default: 'not_started' })
    status: string;

    @Index() // Индекс для сортировки по рейтингу
    @Column({ nullable: true })
    rating?: number;
  }
  ```

### Этап 3: Обновление Group entity
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\entities\group.entity.ts`
- [ ] Добавить индексы:
  ```typescript
  import { Entity, Column, Index } from 'typeorm';

  @Entity()
  export class Group {
    // ... existing fields

    @Index() // Индекс на foreign key
    @Column()
    userId: number;

    @Index() // Индекс для поиска по имени
    @Column()
    name: string;
  }
  ```

### Этап 4: Обновление MediaFile entity
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\entities\media-file.entity.ts`
- [ ] Добавить индексы:
  ```typescript
  import { Entity, Column, Index } from 'typeorm';

  @Entity()
  export class MediaFile {
    // ... existing fields

    @Index() // Индекс на foreign key
    @Column()
    mediaEntryId: number;
  }
  ```

### Этап 5: Обновление PasswordResetToken entity (если создана)
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\entities\password-reset-token.entity.ts`
- [ ] Добавить индексы:
  ```typescript
  import { Entity, Column, Index } from 'typeorm';

  @Entity()
  export class PasswordResetToken {
    // ... existing fields

    @Index() // Индекс на foreign key
    @Column()
    userId: number;

    @Index() // Индекс для поиска неиспользованных токенов
    @Column({ default: false })
    used: boolean;

    @Index() // Индекс для проверки истечения
    @Column()
    expiresAt: Date;
  }
  ```

### Этап 6: Генерация миграции
- [ ] Выполнить команду:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm run migration:generate src/migrations/AddDatabaseIndexes
  ```
- [ ] Проверить созданную миграцию
- [ ] Убедиться что все индексы присутствуют

### Этап 7: Применение миграции
- [ ] Создать backup БД:
  ```bash
  copy f:\projects\Portfolio\Web\Atom-Titles-Hive\data\database.sqlite f:\projects\Portfolio\Web\Atom-Titles-Hive\data\database.sqlite.backup
  ```
- [ ] Применить миграцию:
  ```bash
  npm run migration:run
  ```
- [ ] Проверить что индексы созданы

### Этап 8: Проверка индексов в SQLite
- [ ] Установить SQLite browser (если нет):
  ```bash
  choco install db-browser-for-sqlite
  ```
- [ ] Открыть БД в DB Browser
- [ ] Проверить индексы для каждой таблицы:
  ```sql
  SELECT * FROM sqlite_master WHERE type='index';
  ```

### Этап 9: Тестирование производительности
- [ ] Создать тестовый скрипт `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\scripts\benchmark-queries.ts`:
  ```typescript
  import { AppDataSource } from '../ormconfig';
  import { MediaEntry } from '../src/entities/media-entry.entity';

  async function benchmark() {
    await AppDataSource.initialize();

    const userId = 1;
    const iterations = 100;

    // Тест 1: Поиск по userId
    console.time('Find by userId');
    for (let i = 0; i < iterations; i++) {
      await AppDataSource.getRepository(MediaEntry).find({
        where: { userId },
      });
    }
    console.timeEnd('Find by userId');

    // Тест 2: Поиск по userId + category
    console.time('Find by userId + category');
    for (let i = 0; i < iterations; i++) {
      await AppDataSource.getRepository(MediaEntry).find({
        where: { userId, category: 'anime' },
      });
    }
    console.timeEnd('Find by userId + category');

    // Тест 3: Сортировка по rating
    console.time('Order by rating');
    for (let i = 0; i < iterations; i++) {
      await AppDataSource.getRepository(MediaEntry).find({
        where: { userId },
        order: { rating: 'DESC' },
      });
    }
    console.timeEnd('Order by rating');

    await AppDataSource.destroy();
  }

  benchmark();
  ```
- [ ] Запустить benchmark:
  ```bash
  npx ts-node scripts/benchmark-queries.ts
  ```
- [ ] Сравнить результаты до и после индексов

### Этап 10: Оптимизация запросов в сервисах
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\media\media.service.ts`
- [ ] Проверить что запросы используют индексированные поля
- [ ] Добавить `.select()` для выбора только нужных полей:
  ```typescript
  async findAll(userId: number): Promise<MediaEntry[]> {
    return this.mediaRepository.find({
      where: { userId },
      select: ['id', 'title', 'rating', 'category', 'status'], // Только нужные поля
      order: { createdAt: 'DESC' },
    });
  }
  ```

### Этап 11: Документация
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\docs\database-optimization.md`:
  ```markdown
  # Database Optimization

  ## Indexes

  ### User
  - `username` - Unique index for fast lookup
  - `email` - Unique index for fast lookup
  - `googleId` - Unique index for OAuth

  ### MediaEntry
  - `userId` - Foreign key index
  - `groupId` - Foreign key index
  - `category` - Filter index
  - `status` - Filter index
  - `rating` - Sort index
  - `(userId, category)` - Composite index
  - `(userId, status)` - Composite index

  ### Group
  - `userId` - Foreign key index
  - `name` - Search index

  ### MediaFile
  - `mediaEntryId` - Foreign key index

  ## Query Optimization

  ### Best Practices
  - Always filter by `userId` first
  - Use `.select()` to limit returned fields
  - Use pagination for large result sets
  - Avoid `SELECT *`

  ### Example
  ```typescript
  // Good
  await repo.find({
    where: { userId, category: 'anime' },
    select: ['id', 'title', 'rating'],
    take: 20,
  });

  // Bad
  await repo.find({
    where: { category: 'anime' }, // Missing userId!
  });
  ```

  ## Monitoring

  ### Query Performance
  Enable TypeORM logging:
  ```env
  TYPEORM_LOGGING=true
  ```

  Check slow queries in logs.
  ```

## Критерии приёмки
- ✅ Индексы добавлены во все entities
- ✅ Миграция создана и применена
- ✅ Индексы видны в БД
- ✅ Benchmark показывает улучшение
- ✅ Запросы оптимизированы
- ✅ Документация создана

## Тестирование

### Проверка индексов
- [ ] Выполнить SQL запрос:
  ```sql
  SELECT name, tbl_name FROM sqlite_master WHERE type='index';
  ```
- [ ] Убедиться что все индексы созданы

### Benchmark
- [ ] Создать 1000+ тестовых записей
- [ ] Запустить benchmark до индексов
- [ ] Применить индексы
- [ ] Запустить benchmark после индексов
- [ ] Сравнить результаты (должно быть быстрее)

### Функциональное тестирование
- [ ] Запустить backend
- [ ] Выполнить CRUD операции
- [ ] Проверить что все работает корректно
- [ ] Проверить логи запросов (если TYPEORM_LOGGING=true)

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все индексы добавлены
2. ✅ Миграция применена
3. ✅ Benchmark показывает улучшение
4. ✅ Запросы оптимизированы
5. ✅ Документация создана
6. ✅ Все тесты проходят
7. ✅ Backend работает корректно

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/backend/06-database-indexes.md`
