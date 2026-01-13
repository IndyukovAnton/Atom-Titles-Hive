# Задача BE-05: Вынос секретов в переменные окружения

## Зависимости
- Нет зависимостей

## Описание проблемы
В `backend/src/modules/auth/auth.module.ts` секрет JWT захардкожен:
```typescript
secret: configService.get('JWT_SECRET') || 'super-secret-key-change-in-production'
```

Это создаёт уязвимость безопасности в production. Все секреты должны быть в `.env` файле.

## Цель задачи
Вынести все чувствительные данные в переменные окружения и обеспечить их обязательную проверку.

## Чек-лист выполнения

### Этап 1: Обновление .env файлов
- [x] Обновить `backend/.env` с обязательными переменными:
  ```
  JWT_SECRET=your-super-secret-jwt-key-change-this
  JWT_EXPIRES_IN=7d
  DATABASE_PATH=database/app.db
  PORT=1221
  ```
- [x] Обновить `backend/.env.example` с описаниями
- [x] Убедиться, что `.env` в `.gitignore`

### Этап 2: Создание конфигурационного модуля
- [x] Создать `backend/src/config/env.validation.ts`
- [x] Реализовать валидацию обязательных переменных при старте
- [x] Создать typed interface для конфигурации
- [x] Бросать ошибку если обязательные переменные отсутствуют

### Этап 3: Обновление AuthModule
- [x] Удалить fallback значение для JWT_SECRET
- [x] Сделать JWT_SECRET обязательным
- [x] Обновить signOptions для использования JWT_EXPIRES_IN из env

### Этап 4: Обновление Database конфигурации
- [x] Вынести database path в переменную окружения
- [x] Вынести synchronize в env (TYPEORM_SYNCHRONIZE)
- [x] Вынести logging в env (TYPEORM_LOGGING)

### Этап 5: Обновление main.ts
- [x] Вынести PORT в env variable
- [x] Добавить CORS configuration через env (если нужно)

### Этап 6: Документация
- [x] Обновить README с секцией Environment Variables
- [x] Создать `backend/docs/environment-setup.md`
- [x] Документировать все переменные окружения
- [x] Добавить troubleshooting для missing variables

### Этап 7: Безопасность
- [x] Убедиться что `.env` не коммитится в git
- [x] Проверить что в `.env.example` нет реальных секретов
- [x] Добавить генератор случайного JWT_SECRET (скрипт)

## Критерии приёмки
- ✅ Все секреты вынесены в `.env`
- ✅ Обязательные переменные валидируются при старте
- ✅ Fallback значения удалены
- ✅ `.env.example` полный и понятный
- ✅ Документация обновлена

## Тестирование

### Валидация переменных
- [x] При отсутствии JWT_SECRET приложение не запускается
- [x] Выдаётся понятная ошибка о missing variable
- [x] При наличии всех переменных приложение запускается

### JWT токены
- [x] JWT токены генерируются с секретом из .env
- [x] Время жизни токена соответствует JWT_EXPIRES_IN
- [x] Токены валидируются корректно

### Database
- [x] База данных создаётся по пути из DATABASE_PATH
- [x] synchronize учитывает TYPEORM_SYNCHRONIZE
- [x] logging учитывает TYPEORM_LOGGING

### Port
- [x] Backend запускается на порту из env
- [x] При изменении PORT backend запускается на новом порту

### Безопасность
- [x] `.env` не отслеживается git (в .gitignore)
- [x] `.env.example` не содержит реальных секретов
- [x] Production build не содержит захардкоженных секретов

### Проверка кода
- [x] ESLint не выдаёт ошибок
- [x] TypeScript компилируется без ошибок
- [x] `npm run build` проходит успешно

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все пункты отмечены
2. ✅ Все секреты в .env
3. ✅ Валидация работает
4. ✅ .env.example полный
5. ✅ Безопасность соблюдена
6. ✅ Документация обновлена
7. ✅ Production build работает с env переменными

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/backend/05-environment-variables.md`
