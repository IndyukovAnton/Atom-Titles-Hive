# Задача SEC-01: Секреты/ENV/дефолтные ключи (backend + desktop) + безопасное хранение

## Приоритет
🔴 **КРИТИЧЕСКИЙ** - Безопасность

## Зависимости
Нет

## Описание проблемы
Проблема не только в `.env`, а в целом в “секретном контуре” проекта:
- `.env`‑файлы могли попасть в git‑историю (даже если сейчас они в `.gitignore`).
- В коде есть **default fallback** секреты:
  - backend: `process.env.JWT_SECRET || 'default-secret-key'`
  - desktop/tauri: `JWT_SECRET` берётся с дефолтом
- Для MSI‑релиза это критично: релиз не должен запускаться с известными дефолтными секретами.

## Цель задачи
Полностью исключить секреты из git и убрать дефолтные ключи из кода, обеспечив:
- обязательность `JWT_SECRET` (и валидность) в релизе,
- безопасные `.env.example` шаблоны,
- понятные инструкции для dev,
- при необходимости — очистку истории и ротацию ключей.

## Чек-лист выполнения

### Этап 1: Создание .env.example
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\.env.example`:
  ```env
  # JWT Configuration
  JWT_SECRET=your_jwt_secret_here_min_32_chars
  JWT_EXPIRES_IN=24h

  # Database Configuration
  DATABASE_PATH=./data/database.sqlite

  # Google OAuth (optional)
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  GOOGLE_CALLBACK_URL=http://localhost:1221/auth/google/callback

  # Logging
  LOG_DIR=logs
  LOG_RETENTION_DAYS=30

  # TypeORM
  TYPEORM_SYNCHRONIZE=true  # dev only; в релизе/production всегда false
  TYPEORM_LOGGING=false

  # Server
  PORT=1221
  NODE_ENV=development
  ```

### Этап 2: Создание .env.example для backend
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\.env.example` с теми же placeholder-значениями

### Этап 3: Обновление .gitignore
- [ ] Проверить что `.gitignore` содержит:
  ```
  .env
  *.env
  !.env.example
  backend/.env
  backend/*.env
  !backend/.env.example
  ```
- [ ] Добавить недостающие правила если их нет

### Этап 4: Удаление .env из текущего коммита
- [ ] Выполнить команду (если файл в staging):
  ```bash
  git restore --staged .env
  ```
- [ ] Если файл уже закоммичен, выполнить:
  ```bash
  git rm --cached .env
  git rm --cached backend/.env
  git commit -m "chore: remove .env files from version control"
  ```

### Этап 5: Очистка Git истории (ОПЦИОНАЛЬНО, если секреты уже в remote)
⚠️ **ВНИМАНИЕ**: Это переписывает историю Git!

- [ ] Установить BFG Repo-Cleaner:
  ```bash
  # Windows (через Chocolatey)
  choco install bfg-repo-cleaner
  
  # Или скачать JAR с https://rtyley.github.io/bfg-repo-cleaner/
  ```
- [ ] Создать backup репозитория:
  ```bash
  cd f:\projects\Portfolio\Web
  xcopy /E /I Atom-Titles-Hive Atom-Titles-Hive-backup
  ```
- [ ] Очистить историю:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive
  bfg --delete-files .env
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```
- [ ] Если репозиторий в GitHub/GitLab, выполнить force push:
  ```bash
  git push origin --force --all
  git push origin --force --tags
  ```

### Этап 6: Генерация новых секретов
- [ ] Сгенерировать новый JWT_SECRET:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm run generate:secret
  ```
  Или вручную:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Скопировать новый секрет в `.env` (НЕ коммитить!)

### Этап 7: Ротация Google OAuth credentials
- [ ] Перейти в [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [ ] Найти OAuth 2.0 Client ID: `553936297240-kier9amk1u2tdb2ti6k8v6b59mmqkspg`
- [ ] Удалить старый Client ID
- [ ] Создать новый OAuth 2.0 Client ID:
  - Application type: Web application
  - Authorized redirect URIs: `http://localhost:1221/auth/google/callback`
- [ ] Скопировать новые `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в `.env`

### Этап 8: Создание локального .env
- [ ] Скопировать `.env.example` в `.env`:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive
  copy .env.example .env
  ```
- [ ] Заполнить `.env` реальными значениями (новые секреты из Этапов 6-7)

### Этап 9: Обновление документации
- [ ] Добавить в `README.md` секцию "Environment Variables":
  ```markdown
  ### Environment Variables
  
  1. Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
  
  2. Fill in the required values:
     - `JWT_SECRET`: Generate with `npm run generate:secret` in backend folder
     - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Get from Google Cloud Console
  
  3. **NEVER commit `.env` files to Git!**
  ```

### Этап 10: Обновление backend для работы без Google OAuth (опционально)
- [ ] Проверить `backend/src/modules/auth/auth.module.ts`
- [ ] Убедиться что Google OAuth опционален (не падает если credentials не заданы)
- [ ] Если нужно, обернуть GoogleStrategy в условную регистрацию:
  ```typescript
  const providers = [AuthService, JwtStrategy];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(GoogleStrategy);
  }
  ```

## Критерии приёмки
- ✅ `.env`/`backend/.env`/`frontend/.env*` **не трекаются** git’ом (даже если файлы существуют локально)
- ✅ Файл `.env.example` создан и закоммичен
- ✅ `.gitignore` правильно настроен
- ✅ В коде **нет** fallback дефолтного `JWT_SECRET`
- ✅ Backend/desktop не стартуют без `JWT_SECRET` (в релизном режиме)
- ✅ Новые Google OAuth credentials созданы (или OAuth опционален)
- ✅ Backend запускается с новыми переменными окружения
- ✅ Документация обновлена
- ✅ Git история очищена (если выполнялся Этап 5)

## Тестирование

### Проверка Git
- [ ] Выполнить `git status` - `.env` не должен отображаться
- [ ] Выполнить `git log --all --full-history -- .env` - файл не должен быть в истории (если очищали)
- [ ] Проверить что `.env.example` в репозитории

### Проверка backend
- [ ] Удалить `.env`
- [ ] Скопировать `.env.example` в `.env`
- [ ] Заполнить реальными значениями
- [ ] Запустить `npm run start:dev` в backend
- [ ] Проверить что сервер запустился без ошибок
- [ ] Проверить авторизацию JWT (регистрация/логин)
- [ ] Проверить Google OAuth (если настроен)

### Проверка безопасности
- [ ] Выполнить `git log --all --oneline | grep -i "secret\|password\|key"` - не должно быть секретов в сообщениях коммитов
- [ ] Проверить GitHub/GitLab репозиторий - секреты не должны быть видны

## Дополнение (P0 для MSI/desktop)
- [ ] Удалить дефолтные JWT секреты из:
  - `backend/src/strategies/jwt.strategy.ts`
  - `src-tauri/src/lib.rs`
- [ ] Добавить валидацию env на старте backend (ошибка при отсутствии `JWT_SECRET`).

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ `.env*` не трекаются git’ом и не утекли в историю (или история очищена)
2. ✅ В коде нет дефолтных секретов
3. ✅ Релизная сборка MSI не запускается без заданного `JWT_SECRET`
4. ✅ Документация по env корректна

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/security/01-remove-secrets-from-git.md`
