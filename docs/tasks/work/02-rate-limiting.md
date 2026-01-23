# Задача BE-02: Добавление Rate Limiting для защиты API

## Приоритет
🔴 **КРИТИЧЕСКИЙ** - Безопасность

## Зависимости
Нет

## Описание проблемы
Backend API не имеет защиты от:
- DDoS атак
- Brute-force атак на авторизацию
- Чрезмерного использования API одним пользователем

Это может привести к:
- Недоступности сервиса
- Взлому аккаунтов
- Перегрузке сервера

## Цель задачи
Внедрить rate limiting на уровне приложения с использованием `@nestjs/throttler` для защиты всех эндпоинтов и особенно критичных маршрутов авторизации.

## Примечание для Desktop/MSI
Даже если desktop клиент и backend общаются через localhost, rate limiting всё равно нужен:
- защита от brute-force (локально тоже можно атаковать),
- защита от “случайных” бесконечных ретраев/циклов на клиенте,
- предсказуемые ошибки вместо деградации.

## Чек-лист выполнения

### Этап 1: Установка зависимостей
- [ ] Установить пакет:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm install @nestjs/throttler
  ```

### Этап 2: Настройка ThrottlerModule в app.module.ts
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\app.module.ts`
- [ ] Импортировать ThrottlerModule:
  ```typescript
  import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
  import { APP_GUARD } from '@nestjs/core';
  ```
- [ ] Добавить в imports:
  ```typescript
  @Module({
    imports: [
      // ... existing imports
      ThrottlerModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          throttlers: [
            {
              name: 'short',
              ttl: 1000, // 1 секунда
              limit: 10, // 10 запросов
            },
            {
              name: 'medium',
              ttl: 10000, // 10 секунд
              limit: 50, // 50 запросов
            },
            {
              name: 'long',
              ttl: 60000, // 1 минута
              limit: 100, // 100 запросов
            },
          ],
          errorMessage: 'Too many requests, please try again later',
        }),
      }),
      // ... rest of imports
    ],
    providers: [
      // ... existing providers
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard, // Глобальный guard
      },
    ],
  })
  ```

### Этап 3: Настройка переменных окружения
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\.env.example`
- [ ] Добавить переменные:
  ```env
  # Rate Limiting
  THROTTLE_TTL=60000  # Time window in milliseconds (default: 1 minute)
  THROTTLE_LIMIT=100  # Max requests per TTL (default: 100)
  ```
- [ ] Обновить конфигурацию ThrottlerModule для использования env переменных:
  ```typescript
  ThrottlerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      throttlers: [
        {
          ttl: configService.get<number>('THROTTLE_TTL') || 60000,
          limit: configService.get<number>('THROTTLE_LIMIT') || 100,
        },
      ],
    }),
  }),
  ```

### Этап 4: Усиленная защита для auth эндпоинтов
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\guards\auth-throttler.guard.ts`:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { ThrottlerGuard } from '@nestjs/throttler';

  @Injectable()
  export class AuthThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
      // Используем IP + username для более точного отслеживания
      const username = req.body?.username || 'anonymous';
      return `${req.ip}-${username}`;
    }
  }
  ```

### Этап 5: Применение строгого rate limiting к auth контроллеру
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\auth\auth.controller.ts`
- [ ] Импортировать декораторы:
  ```typescript
  import { Throttle, SkipThrottle } from '@nestjs/throttler';
  import { UseGuards } from '@nestjs/common';
  import { AuthThrottlerGuard } from '../../guards/auth-throttler.guard';
  ```
- [ ] Применить к контроллеру:
  ```typescript
  @Controller('auth')
  @UseGuards(AuthThrottlerGuard)
  export class AuthController {
    
    @Post('register')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 попытки в минуту
    async register(@Body() registerDto: RegisterDto) {
      // ... existing code
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 попыток в минуту
    async login(@Body() loginDto: LoginDto) {
      // ... existing code
    }

    @Get('google')
    @SkipThrottle() // OAuth не нуждается в throttling
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
      // ... existing code
    }

    @Get('google/callback')
    @SkipThrottle()
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req) {
      // ... existing code
    }
  }
  ```

### Этап 6: Настройка для других критичных эндпоинтов
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\profile\profile.controller.ts`
- [ ] Добавить throttling для смены пароля:
  ```typescript
  import { Throttle } from '@nestjs/throttler';

  @Controller('profile')
  export class ProfileController {
    
    @Patch('password')
    @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 попытки в 5 минут
    @UseGuards(JwtAuthGuard)
    async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
      // ... implementation
    }
  }
  ```

### Этап 7: Добавление кастомного Exception Filter для Throttler
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\filters\throttler-exception.filter.ts`:
  ```typescript
  import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
  } from '@nestjs/common';
  import { ThrottlerException } from '@nestjs/throttler';
  import { Response } from 'express';
  import { LoggerService } from '../utils/logger.service';

  @Catch(ThrottlerException)
  export class ThrottlerExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: LoggerService) {}

    async catch(exception: ThrottlerException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest();

      const status = HttpStatus.TOO_MANY_REQUESTS;
      const message = 'Too many requests, please try again later';

      await this.logger.warn(
        `Rate limit exceeded: ${request.method} ${request.url} from IP ${request.ip}`,
      );

      response.status(status).json({
        statusCode: status,
        message,
        error: 'Too Many Requests',
        retryAfter: 60, // seconds
      });
    }
  }
  ```

### Этап 8: Регистрация Exception Filter
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\main.ts`
- [ ] Добавить фильтр:
  ```typescript
  import { ThrottlerExceptionFilter } from './filters/throttler-exception.filter';

  async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bodyParser: false,
    });
    
    const logger = app.get(LoggerService);
    
    // Existing filters
    app.useGlobalFilters(new AllExceptionsFilter(logger));
    
    // Throttler filter
    app.useGlobalFilters(new ThrottlerExceptionFilter(logger));
    
    // ... rest of bootstrap
  }
  ```

### Этап 9: Добавление заголовков Rate Limit в ответы
- [ ] Создать interceptor `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\interceptors\rate-limit-headers.interceptor.ts`:
  ```typescript
  import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';

  @Injectable()
  export class RateLimitHeadersInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const response = context.switchToHttp().getResponse();
      
      return next.handle().pipe(
        tap(() => {
          // Добавляем информационные заголовки
          const rateLimitHeaders = {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '95', // TODO: получать из ThrottlerGuard
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
          };
          
          Object.entries(rateLimitHeaders).forEach(([key, value]) => {
            response.setHeader(key, value);
          });
        }),
      );
    }
  }
  ```

### Этап 10: Тестирование Rate Limiting
- [ ] Создать тестовый файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\test\rate-limiting.e2e-spec.ts`:
  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { INestApplication, HttpStatus } from '@nestjs/common';
  import * as request from 'supertest';
  import { AppModule } from '../src/app.module';

  describe('Rate Limiting (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should block requests after exceeding rate limit', async () => {
      const endpoint = '/auth/login';
      const payload = { username: 'test', password: 'test' };

      // Делаем 5 запросов (лимит)
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post(endpoint)
          .send(payload)
          .expect((res) => {
            expect([HttpStatus.UNAUTHORIZED, HttpStatus.OK]).toContain(res.status);
          });
      }

      // 6-й запрос должен быть заблокирован
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
  ```

### Этап 11: Документация
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\docs\rate-limiting.md`:
  ```markdown
  # Rate Limiting

  ## Overview
  API защищен от чрезмерного использования с помощью rate limiting.

  ## Лимиты

  ### Глобальные лимиты
  - **100 запросов** в минуту на IP адрес

  ### Специфичные эндпоинты

  #### Authentication
  - `POST /auth/register`: 3 запроса в минуту
  - `POST /auth/login`: 5 запросов в минуту

  #### Profile
  - `PATCH /profile/password`: 3 запроса в 5 минут

  ## Ответы

  ### При превышении лимита
  ```json
  {
    "statusCode": 429,
    "message": "Too many requests, please try again later",
    "error": "Too Many Requests",
    "retryAfter": 60
  }
  ```

  ### Заголовки
  - `X-RateLimit-Limit`: Максимум запросов
  - `X-RateLimit-Remaining`: Оставшиеся запросы
  - `X-RateLimit-Reset`: Время сброса лимита

  ## Настройка
  Изменить лимиты можно в `.env`:
  ```env
  THROTTLE_TTL=60000
  THROTTLE_LIMIT=100
  ```
  ```

### Этап 12: Обновление README.md
- [ ] Добавить секцию в корневой README.md:
  ```markdown
  ## Rate Limiting
  
  API protected with rate limiting. See [docs/rate-limiting.md](docs/rate-limiting.md) for details.
  ```

## Критерии приёмки
- ✅ `@nestjs/throttler` установлен и настроен
- ✅ Глобальный rate limiting работает
- ✅ Auth эндпоинты имеют усиленную защиту
- ✅ Throttler exception filter логирует превышения
- ✅ E2E тесты проходят
- ✅ Документация создана
- ✅ Rate limit заголовки добавлены в ответы

## Тестирование

### Ручное тестирование
- [ ] Запустить backend: `npm run start:dev`
- [ ] Использовать Postman/curl для отправки множественных запросов:
  ```bash
  # Тест login endpoint
  for i in {1..10}; do
    curl -X POST http://localhost:1221/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"test","password":"test"}' \
      -w "\nStatus: %{http_code}\n"
  done
  ```
- [ ] Проверить что после 5 запросов возвращается 429

### E2E тестирование
- [ ] Запустить E2E тесты:
  ```bash
  npm run test:e2e
  ```
- [ ] Проверить что тест `rate-limiting.e2e-spec.ts` проходит

### Логирование
- [ ] Проверить логи в `logs/YYYY-MM-DD.txt`
- [ ] Убедиться что превышения лимита логируются

### Production тест
- [ ] Установить низкие лимиты для теста (например, 3 запроса в минуту)
- [ ] Попробовать brute-force атаку на `/auth/login`
- [ ] Убедиться что после 3 попыток доступ блокируется
- [ ] Вернуть нормальные лимиты

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Rate limiting работает глобально
2. ✅ Auth эндпоинты защищены усиленно
3. ✅ Превышения логируются
4. ✅ E2E тесты проходят
5. ✅ Документация полная
6. ✅ Заголовки rate limit добавлены
7. ✅ Production тест пройден

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/backend/02-rate-limiting.md`
