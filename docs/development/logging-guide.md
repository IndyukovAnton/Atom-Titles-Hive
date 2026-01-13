# Руководство по системе логирования

## Обзор

Приложение Atom Titles-Hive использует встроенную систему логирования для отслеживания операций, ошибок и активности пользователей. Логи записываются в текстовые файлы с автоматической ротацией.

## Архитектура логирования

### LoggerService

Основной сервис логирования расположен в `src/utils/logger.service.ts`. Он предоставляет три метода:

- `log(message: string)` - Запись информационных сообщений (уровень INFO)
- `warn(message: string)` - Запись предупреждений (уровень WARN)
- `error(message: string, trace?: string)` - Запись критических ошибок с опциональным stack trace (уровень ERROR)

### Компоненты системы

1. **LoggerService** - Основной сервис для записи логов
2. **HttpLoggerMiddleware** - Middleware для логирования HTTP-запросов
3. **AllExceptionsFilter** - Глобальный фильтр для перехвата и логирования исключений

## Формат логов

### Структура записи

Каждая запись в логе имеет следующий формат:

```
[HH:MM:SS] [LEVEL] Message
```

**Примеры:**
```
[10:30:15] [INFO] User logged in: john_doe (ID: 5)
[10:35:42] [WARN] Failed login attempt: User not found - invalid_user
[10:40:01] [ERROR] Failed to create media: Validation error
```

### Уровни логирования

- **INFO** - Обычные операции:
  - Успешный вход/регистрация пользователя
  - Создание/удаление медиа-записей и групп
  - Успешные HTTP-запросы
  - Профильные операции

- **WARN** - Некритичные проблемы:
  - Неудачные попытки входа
  - Неверные учётные данные
  - HTTP ошибки 4xx
  - Неудачные попытки смены пароля

- **ERROR** - Критические ошибки:
  - Необработанные исключения
  - Ошибки валидации данных
  - HTTP ошибки 5xx
  - Ошибки базы данных

## Расположение и именование файлов

### Директория логов

Все логи сохраняются в директорию `/logs/` в корне backend-проекта.

### Имена файлов

Файлы логов автоматически создаются с именем в формате `YYYY-MM-DD.txt`, например:
```
logs/2026-01-13.txt
logs/2026-01-12.txt
```

Каждый день создаётся новый файл, все записи за день попадают в один файл.

## Автоматическая ротация логов

### Настройка срока хранения

По умолчанию логи хранятся **30 дней**. Настройка осуществляется через переменную окружения в `.env`:

```env
LOG_RETENTION_DAYS=30
```

### Механизм очистки

Очистка старых логов происходит автоматически при **запуске приложения**. Удаляются все файлы старше указанного количества дней.

Для ручной очистки можно использовать метод `LoggerService.cleanOldLogs(retentionDays)`.

## Что логируется

### Модуль Auth (AuthService)

- **Успешный вход:**
  ```
  [INFO] User logged in: john_doe (ID: 5)
  ```

- **Неудачная попытка входа:**
  ```
  [WARN] Failed login attempt: User not found - invalid_user
  [WARN] Failed login attempt: Invalid password - john_doe
  ```

- **Регистрация пользователя:**
  ```
  [INFO] New user registered: john_doe (ID: 5)
  ```

- **Неудачная регистрация:**
  ```
  [WARN] Registration failed: Username or email already exists - john_doe/john@example.com
  ```

### Модуль Media (MediaService)

- **Создание медиа:**
  ```
  [INFO] Media created: "Inception" (ID: 42) by user 5
  ```

- **Удаление медиа:**
  ```
  [INFO] Media deleted: ID 42 ("Inception") by user 5
  ```

- **Ошибка создания:**
  ```
  [ERROR] Failed to create media: Inception by user 5
  Stack trace:
  Error: Validation failed
      at MediaService.create (...)
  ```

### Модуль Groups (GroupsService)

- **Создание группы:**
  ```
  [INFO] Group created: "Movies 2024" (ID: 3) by user 5
  ```

- **Обновление группы:**
  ```
  [INFO] Group updated: ID 3 ("Favorites") by user 5
  ```

- **Удаление группы:**
  ```
  [INFO] Group deleted: ID 3 ("Movies 2024"). 15 media entries moved to ungrouped by user 5
  ```

### Модуль Profile (ProfileService)

- **Доступ к профилю:**
  ```
  [INFO] Profile accessed by user 5 (john_doe)
  ```

- **Обновление профиля:**
  ```
  [INFO] Profile updated for user 5 (john_doe). Changed fields: email, password
  ```

- **Неудачная смена пароля:**
  ```
  [WARN] Failed password change attempt for user 5
  ```

### HTTP-запросы (HttpLoggerMiddleware)

- **Успешные запросы:**
  ```
  [INFO] GET /api/media - User: 5
  [INFO] GET /api/media - 200 - 45ms
  ```

- **Ошибки 404:**
  ```
  [INFO] GET /api/invalid-endpoint - User: anonymous
  [WARN] GET /api/invalid-endpoint - 404 - 12ms - User: anonymous
  ```

- **Серверные ошибки 5xx:**
  ```
  [INFO] POST /api/media - User: 5
  [ERROR] POST /api/media - 500 - 234ms - User: 5
  ```

### Глобальные исключения (AllExceptionsFilter)

Все необработанные исключения автоматически логируются с полным stack trace:

```
[ERROR] POST /api/media - 500 - Internal server error
Stack trace:
TypeError: Cannot read property 'title' of undefined
    at MediaService.create (...)
    at MediaController.create (...)
```

## Использование в коде

### Добавление логирования в сервис

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../utils/logger.service';

@Injectable()
export class MyService {
  constructor(private logger: LoggerService) {}

  async doSomething(userId: number) {
    try {
      // Операция
      await this.logger.log(`Operation completed by user ${userId}`);
    } catch (error) {
      await this.logger.error(
        `Operation failed for user ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }
}
```

### Добавление LoggerService в модуль

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([MyEntity])],
  providers: [MyService, LoggerService],
  exports: [MyService],
})
export class MyModule {}
```

## Рекомендации

### Для разработчиков

1. **Используйте соответствующие уровни:**
   - `log()` для обычных операций
   - `warn()` для некритичных проблем
   - `error()` для критических ошибок

2. **Включайте контекст:**
   - ID пользователя
   - Названия сущностей
   - Важные параметры операций

3. **Stack trace только для ERROR:**
   ```typescript
   try {
     // операция
   } catch (error) {
     await this.logger.error(
       'Operation failed',
       error instanceof Error ? error.stack : String(error)
     );
   }
   ```

### Для production

1. **Регулярно проверяйте логи на наличие:**
   - Повторяющихся ошибок
   - Подозрительной активности
   - Необычных паттернов запросов

2. **Настройте LOG_RETENTION_DAYS** в зависимости от требований:
   - Development: 7-14 дней
   - Production: 30-90 дней

## Производительность

Система логирования спроектирована для минимального влияния на производительность:

- Асинхронная запись в файлы (Promise-based)
- Логирование в консоль и файл параллельно
- Безопасная обработка ошибок записи (fallback в console)
- Отсутствие блокировки основного потока

## Устранение неполадок

### Логи не создаются

1. Проверьте права доступа к папке `/logs`
2. Убедитесь, что LoggerService подключён как провайдер
3. Проверьте консоль на наличие ошибок записи

### Файлы не удаляются

1. Проверьте значение `LOG_RETENTION_DAYS` в `.env`
2. Убедитесь, что очистка вызывается в `main.ts`
3. Проверьте права на удаление файлов

### Большой размер логов

1. Уменьшите `LOG_RETENTION_DAYS`
2. Настройте более агрессивную ротацию
3. Рассмотрите внешнее хранилище для архивных логов
