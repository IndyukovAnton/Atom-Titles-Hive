# Задача FE-02: Consolidation state/auth/api (устойчивость UI + предсказуемость)

## Приоритет
🟡 **P1**

## Проблема (по факту)
- В `PersonalizationContext` есть **side-effects в render** (setState в теле компонента) — риск циклов/лишних ререндеров и нестабильного UI.
- Несколько источников истины для темы/настроек/ключей (localStorage + контекст + сторы) → рассинхронизация.
- `api/client.ts` достаёт токен через JSON.parse localStorage вместо единого источника (zustand state) → хрупко и сложно тестировать.

## Цель
Сделать единый, тестируемый контур:
- один источник истины (authStore + personalization provider),
- синхронизация только через `useEffect`,
- централизованные storage keys,
- api client берёт токен из `useAuthStore.getState()` (без ручного JSON.parse).

## Чек‑лист

### 1) Исправить `PersonalizationContext` (P1, но критично по стабильности UI)
- [ ] Перенести синхронизацию `user.preferences` и `user.id` в `useEffect`.
- [ ] Убрать `setState` из render‑веток.
- [ ] Централизовать ключи localStorage (например, `frontend/src/constants/storage-keys.ts`).

### 2) Упростить и унифицировать управление темой
- [ ] Убедиться, что тема управляется одним механизмом (не “store + context” одновременно).
- [ ] Удалить/закрыть дублирующие реализации (если есть).

### 3) Привести `api/client.ts` к единому источнику токена
- [ ] Брать токен из `useAuthStore.getState()` (а не парсить localStorage).
- [ ] На 401:
  - [ ] очищать store,
  - [ ] делать навигацию штатно (через router), без `window.location.href`, если возможно.

## Критерии приёмки
- ✅ Нет setState в render в контекстах/провайдерах
- ✅ Нет рассинхронизации темы/настроек
- ✅ API client не парсит localStorage напрямую ради токена
- ✅ Регрессии в auth/настройках покрыты тестами (минимум unit)

