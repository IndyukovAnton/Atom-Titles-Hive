# Задача INF-02: Настройка CI/CD Pipeline

## Зависимости
- BE-04: Написание тестов (для запуска в CI)
- FE-06: Написание тестов (для запуска в CI)
- INF-01: Настройка Docker (для деплоя через CI)

## Описание проблемы
Проект не имеет автоматизированного CI/CD pipeline. Необходимо настроить:
- Автоматический запуск тестов при push
- Автоматическую сборку образов
- Автоматический деплой (опционально)

## Цель задачи
Создать GitHub Actions workflow для автоматизации тестирования, сборки и деплоя.

## Чек-лист выполнения

### Этап 1: Настройка GitHub Actions
- [ ] Создать `.github/workflows/` директорию
- [ ] Создать базовый workflow файл `ci.yml`
- [ ] Настроить triggers (push, pull_request)

### Этап 2: Backend CI
- [ ] Создать job для backend тестов:
  - Checkout кода
  - Setup Node.js
  - Install dependencies
  - Run linter
  - Run tests
  - Generate coverage report
- [ ] Кэшировать node_modules для ускорения

### Этап 3: Frontend CI
- [ ] Создать job для frontend тестов:
  - Checkout кода
  - Setup Node.js
  - Install dependencies
  - Run linter
  - Run tests
  - Generate coverage report
  - Build production
- [ ] Кэшировать node_modules

### Этап 4: Docker Build
- [ ] Создать job для сборки Docker образов:
  - Build backend image
  - Build frontend image
  - Push to Docker Hub (опционально)
  - Использовать Docker layer caching

### Этап 5: Code Quality Checks
- [ ] Добавить TypeScript type-checking
- [ ] Добавить security audit (`npm audit`)
- [ ] Добавить dependency check
- [ ] Настроить fail на критичные уязвимости

### Этап 6: Coverage Reports
- [ ] Настроить upload coverage в Codecov (опционально)
- [ ] Добавить badge в README
- [ ] Настроить минимальный threshold (например, 70%)

### Этап 7: Deployment (опционально)
- [ ] Если есть сервер, настроить auto-deploy:
  - SSH в сервер
  - Pull новых образов
  - Перезапуск контейнеров
- [ ] Только для main/master branch
- [ ] С manual approval для production

### Этап 8: Notifications
- [ ] Настроить уведомления о failed builds (опционально)
- [ ] Slack/Discord integration (опционально)

### Этап 9: Документация
- [ ] Создать `docs/ci-cd-guide.md`
- [ ] Документировать workflow
- [ ] Добавить badges в README (build status, coverage)

## Критерии приёмки
- ✅ CI pipeline запускается на каждый push
- ✅ Тесты backend и frontend запускаются автоматически
- ✅ Linting проверяется автоматически
- ✅ Docker образы собираются в CI
- ✅ Failed builds блокируют merge

## Тестирование

### CI Pipeline Execution
- [ ] Push в feature branch запускает CI
- [ ] Pull request запускает CI
- [ ] Main branch push запускает полный pipeline

### Backend Tests in CI
- [ ] Backend linter запускается
- [ ] Backend тесты запускаются
- [ ] Coverage report генерируется
- [ ] Failing тест блокирует pipeline

### Frontend Tests in CI
- [ ] Frontend linter запускается
- [ ] Frontend тесты запускаются
- [ ] Production build создаётся
- [ ] Failing тест блокирует pipeline

### Docker Build in CI
- [ ] Backend Docker image собирается
- [ ] Frontend Docker image собирается
- [ ] Образы имеют правильные tags
- [ ] Layer caching работает (builds быстрые)

### Code Quality
- [ ] TypeScript type-check проходит
- [ ] `npm audit` не находит critical/high уязвимостей
- [ ] Dependency check проходит

### Performance
- [ ] Полный CI pipeline < 10 минут
- [ ] Кэширование работает эффективно
- [ ] Параллельные jobs ускоряют процесс

### Notifications
- [ ] При fail приходит уведомление (если настроено)
- [ ] При success статус обновляется

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все пункты отмечены
2. ✅ CI pipeline работает на каждый push
3. ✅ Все тесты запускаются автоматически
4. ✅ Failed tests блокируют merge
5. ✅ Docker образы собираются в CI
6. ✅ Документация создана
7. ✅ README имеет CI badges

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/infrastructure/02-ci-cd-pipeline.md`
