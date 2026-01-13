# Задача INF-01: Настройка Docker Containerization

## Зависимости
- BE-01: Настройка миграций БД (для корректной работы с БД в контейнере)
- BE-05: Вынос секретов в переменные окружения (для безопасности)
- FE-04: Вынос API URL в переменные окружения (для конфигурации frontend)

## Описание проблемы
Проект не имеет Docker конфигурации, что затрудняет:
- Развертывание на серверах
- Единообразие окружений (dev/staging/production)
- Быстрый onboarding новых разработчиков

## Цель задачи
Создать Docker конфигурацию для backend, frontend и полного стека приложения.

## Чек-лист выполнения

### Этап 1: Dockerfile для Backend
- [ ] Создать `backend/Dockerfile`
  - Multi-stage build (builder + production)
  - Node.js базовый образ
  - Копирование package.json и установка зависимостей
  - Копирование исходного кода
  - Сборка TypeScript
  - Запуск production сервера
- [ ] Создать `backend/.dockerignore`
  - Исключить node_modules, dist, .env, логи

### Этап 2: Dockerfile для Frontend
- [ ] Создать `frontend/Dockerfile`
  - Multi-stage build
  - Сборка production build с Vite
  - Nginx для раздачи статики
- [ ] Создать `frontend/nginx.conf` для правильной маршрутизации SPA
- [ ] Создать `frontend/.dockerignore`

### Этап 3: Docker Compose для локальной разработки
- [ ] Создать корневой `docker-compose.yml`
  - Service: backend
  - Service: frontend
  - Volumes для hot-reload
  - Networks для коммуникации
- [ ] Создать `docker-compose.prod.yml` для production

### Этап 4: Database в Docker
- [ ] Решить вопрос с SQLite в Docker:
  - Volume для persistance БД
  - ИЛИ мигрировать на PostgreSQL/MySQL (для production)
- [ ] Если мигрируем на PostgreSQL:
  - Добавить service: postgres в docker-compose
  - Обновить TypeORM конфигурацию
  - Создать миграции для PostgreSQL

### Этап 5: Environment Variables
- [ ] Создать `.env.docker` для Docker-специфичных переменных
- [ ] Обновить docker-compose для использования .env файлов
- [ ] Документировать все необходимые переменные

### Этап 6: Build Scripts
- [ ] Добавить скрипты в корневой `package.json`:
  ```json
  "docker:dev": "docker-compose up",
  "docker:build": "docker-compose build",
  "docker:prod": "docker-compose -f docker-compose.prod.yml up -d"
  ```

### Этап 7: Healthchecks
- [ ] Добавить healthcheck endpoint в backend (`/health`)
- [ ] Настроить HEALTHCHECK в Dockerfile
- [ ] Настроить healthcheck в docker-compose

### Этап 8: Оптимизация образов
- [ ] Минимизировать размер образов
- [ ] Использовать .dockerignore эффективно
- [ ] Кэшировать установку зависимостей
- [ ] Использовать alpine базовые образы где возможно

### Этап 9: Документация
- [ ] Создать `docs/docker-guide.md`
- [ ] Обновить README с Docker инструкциями
- [ ] Документировать как запускать в разных режимах
- [ ] Добавить troubleshooting

## Критерии приёмки
- ✅ Backend и Frontend имеют Dockerfile
- ✅ docker-compose запускает весь стек локально
- ✅ Production образы оптимизированы
- ✅ Healthchecks настроены
- ✅ Документация полная

## Тестирование

### Backend Docker
- [ ] `docker build -t backend ./backend` успешно собирает образ
- [ ] `docker run backend` запускает backend
- [ ] Backend доступен на указанном порту
- [ ] API endpoints работают
- [ ] База данных доступна и работает

### Frontend Docker
- [ ] `docker build -t frontend ./frontend` успешно собирает образ
- [ ] Nginx раздаёт статику корректно
- [ ] SPA routing работает (refresh не дает 404)
- [ ] Production bundle оптимизирован

### Docker Compose - Development
- [ ] `docker-compose up` запускает весь стек
- [ ] Backend доступен на localhost:1221
- [ ] Frontend доступен на localhost (порт из compose)
- [ ] Hot-reload работает для backend
- [ ] Frontend изменения применяются

### Docker Compose - Production
- [ ] `docker-compose -f docker-compose.prod.yml up` запускает production стек
- [ ] Образы используют production builds
- [ ] Performance приемлема
- [ ] Логи пишутся корректно

### Database
- [ ] База данных сохраняется между перезапусками (volume)
- [ ] Миграции применяются при старте
- [ ] Данные не теряются при рестарте контейнеров

### Healthchecks
- [ ] `/health` endpoint возвращает 200
- [ ] Docker healthcheck определяет статус корректно
- [ ] При падении сервиса healthcheck fails

### Оптимизация
- [ ] Размер backend образа < 200MB (приемлемо)
- [ ] Размер frontend образа < 50MB (с Nginx alpine)
- [ ] Layer caching работает (повторная сборка быстрая)

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все пункты отмечены
2. ✅ Docker образы собираются успешно
3. ✅ docker-compose запускает весь стек
4. ✅ Приложение работает в Docker как ожидается
5. ✅ Production конфигурация протестирована
6. ✅ Документация полная
7. ✅ Размеры образов оптимизированы

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/infrastructure/01-docker-setup.md`
