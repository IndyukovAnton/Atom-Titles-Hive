# Задача REL-00: MSI install → First run → “всё работает”

## Приоритет
🔴 **P0 / Блокер релиза**

## Цель
Обеспечить, что **установленная через MSI** версия запускается на “чистой” Windows и корректно работает end‑to‑end: Tauri → запуск sidecar backend → БД → миграции → авторизация → CRUD → медиа.

## Почему это критично (факты из текущего состояния)
- Backend sidecar запускается с рандомным портом и передаёт “готовность” через stdout (маркер).
- В runtime backend миграции сейчас не используются (в `app.module.ts` миграции выключены), а schema меняется через `synchronize`.
- В desktop конфиге отключён CSP, включён `withGlobalTauri`, и есть default‑секреты.

## Definition of Done (Acceptance Criteria)
- [x] `npm run tauri:build` стабильно создаёт MSI.
- [x] На “чистой” Windows (без Node/Rust toolchain):
  - [x] MSI устанавливается без ручных шагов.
  - [x] Приложение запускается без dev‑сервера.
  - [x] Sidecar backend стартует, порт доступен, frontend корректно подключается.
  - [x] БД создаётся в app data dir пользователя и **не лежит в репозитории**.
  - [x] Миграции применяются автоматически (пустая БД → рабочая схема).
  - [x] Регистрация/логин работают.
  - [x] CRUD: создать группу/запись, переместить запись, удалить.
  - [x] Медиа: загрузить файл, открыть просмотр.
  - [x] Перезапуск приложения сохраняет данные.
- [x] Логи доступны в app data dir (и не содержат секретов).

## План работ (чек‑лист)

### 1) Сборка и артефакты
- [x] Убедиться, что **sidecar backend** собирается предсказуемо и попадает в bundle (не хранить `src-tauri/binaries/*` в git).
- [x] Убедиться, что в MSI включены только нужные файлы (без dev‑артефактов).

### 2) Первый запуск: backend → БД → миграции
- [x] Зафиксировать единый источник истины для:
  - [x] пути к БД (app data dir),
  - [x] логов (app data dir),
  - [x] режима миграций/синхронизации (`synchronize` запрещён вне dev).
- [x] Автоприменение миграций при старте backend (см. `01-typeorm-migrations.md`).

### 3) Безопасность desktop (минимально допустимый baseline)
- [x] CSP включён и ограничивает загрузку ресурсов.
- [x] `withGlobalTauri: false` (или доказанная необходимость true + риски закрыты).
- [x] Capabilities минимальные (нет “shell:default” без необходимости).
- [x] Нет default secret нигде (ни в backend, ни в tauri).

### 4) “Smoke test matrix” (обязательные сценарии)
- [x] Создать и поддерживать матрицу в `00-smoke-test-matrix.md`.
- [x] Прогонять матрицу на каждом релиз‑кандидате MSI.

## Test Plan (минимум)
- [x] Fresh install MSI
- [x] First run (empty app data dir)
- [x] Restart app
- [x] Upgrade install (установка новой версии поверх)

## Артефакты сборки (последняя проверенная)
- MSI: `src-tauri/target/release/bundle/msi/Atom Titles-Hive_0.1.0_x64_en-US.msi`
- NSIS: `src-tauri/target/release/bundle/nsis/Atom Titles-Hive_0.1.0_x64-setup.exe`

### Примечания по warnings
- `pkg` может выводить warnings вида “Failed to make bytecode …” — сборка sidecar при этом успешна и работоспособна (используется JS fallback вместо байткода).

