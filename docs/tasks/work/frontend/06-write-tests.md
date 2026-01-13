# Задача FE-06: Написание тестов для Frontend

## Зависимости
- FE-01: Унификация подхода к стилизации (для стабильных компонентов)
- FE-03: Рефакторинг HomePage (для тестирования hooks)

## Описание проблемы
В frontend полностью отсутствуют тесты. Для надёжности приложения необходимо покрытие тестами:
- Unit тесты для утилит и hooks  
- Component тесты для UI компонентов
- Integration тесты для страниц
- E2E тесты для критичных user flows

## Цель задачи
Создать тестовое покрытие для критичных частей frontend приложения.

## Чек-лист выполнения

### Этап 1: Настройка тестового окружения
- [ ] Установить testing библиотеки:
  - `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`
  - `npm install -D vitest @vitest/ui jsdom`
- [ ] Настроить Vitest в `vite.config.ts`
- [ ] Создать `frontend/src/test/setup.ts` для глобальных моков
- [ ] Создать test utilities и custom renders

### Этап 2: Unit тесты для store (Zustand)
- [ ] Создать `src/store/authStore.test.ts`
  - Тесты для login, logout, register
  - Тесты для initializeAuth
  - Моки для API calls
- [ ] Создать `src/store/mediaStore.test.ts` (если есть)
- [ ] Покрытие >= 80%

### Этап 3: Unit тесты для кастомных hooks
- [ ] Тест `useMediaData.test.ts` (после FE-03)
- [ ] Тест `useGroupManagement.test.ts` (после FE-03)
- [ ] Тест `useDragAndDrop.test.ts` (после FE-03)
- [ ] Покрытие >= 80%

### Этап 4: Component тесты для UI компонентов
- [ ] Создать `src/components/Button/Button.test.tsx`
  - Проверка рендеринга
  - Проверка onClick
  - Проверка props (variant, size)
- [ ] Создать `src/components/ThemeToggle.test.tsx`
  - Проверка переключения темы
- [ ] Тесты для модальных окон:
  - `AddMediaModal.test.tsx`
  - `CreateGroupModal.test.tsx`
- [ ] Покрытие >= 70% для компонентов

### Этап 5: Integration тесты для страниц
- [ ] Создать `src/pages/LoginPage.test.tsx`
  - Рендеринг формы
  - Отправка формы
  - Валидация
  - Редирект после успешного логина
- [ ] Создать `src/pages/RegisterPage.test.tsx`
- [ ] Создать `src/pages/HomePage.test.tsx`
  - Загрузка данных
  - Отображение групп и media
  - Drag-and-drop (с моками)
- [ ] Покрытие >= 60% для страниц

### Этап 6: API моки
- [ ] Создать `src/test/mocks/api.ts`
- [ ] Mock всех API endpoints (auth, media, groups, profile)
- [ ] Использовать MSW (Mock Service Worker) для intercept requests

### Этап 7: E2E тесты (с Playwright)
- [ ] Установить Playwright: `npm install -D @playwright/test`
- [ ] Создать `e2e/auth.spec.ts`
  - Регистрация нового пользователя
  - Логин существующего пользователя
- [ ] Создать `e2e/media.spec.ts`
  - Создание новой записи
  - Редактирование записи
  - Удаление записи
- [ ] Создать `e2e/groups.spec.ts`
  - Создание группы
  - Drag-and-drop media в группу

### Этап 8: CI integration
- [ ] Добавить команды в `package.json`:
  - `test` - запуск unit/component тестов
  - `test:ui` - Vitest UI
  - `test:e2e` - запуск E2E тестов
  - `test:coverage` - генерация отчёта
- [ ] Документировать как запускать тесты

## Критерии приёмки
- ✅ Покрытие >= 70% для store и hooks
- ✅ Покрытие >= 60% для компонентов и страниц
- ✅ E2E тесты для критичных flows написаны
- ✅ Все тесты проходят успешно
- ✅ Тесты интегрированы в CI (если настроен)

## Тестирование

### Запуск тестов
- [ ] `npm test` выполняется без ошибок
- [ ] Все unit тесты проходят
- [ ] Все component тесты проходят
- [ ] Все integration тесты проходят
- [ ] `npm run test:coverage` генерирует отчёт
- [ ] `npm run test:e2e` запускает Playwright тесты

### Проверка покрытия
- [ ] authStore coverage >= 80%
- [ ] Custom hooks coverage >= 80%
- [ ] UI components coverage >= 70%
- [ ] Pages coverage >= 60%

### Качество тестов
- [ ] Тесты изолированы (не зависят друг от друга)
- [ ] API calls замокированы
- [ ] Тесты понятны и читаемы
- [ ] Нет flaky тестов (тесты стабильные)

### E2E тесты
- [ ] Auth flow работает end-to-end
- [ ] Media CRUD flow работает end-to-end
- [ ] Groups management работает end-to-end
- [ ] Тесты работают в headless режиме

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все пункты отмечены
2. ✅ Все тесты проходят (`npm test`)
3. ✅ E2E тесты проходят (`npm run test:e2e`)
4. ✅ Coverage соответствует целевым показателям
5. ✅ Тесты документированы
6. ✅ Production build успешен после тестов

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/frontend/06-write-tests.md`
