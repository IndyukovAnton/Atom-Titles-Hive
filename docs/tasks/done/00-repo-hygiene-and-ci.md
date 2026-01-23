# Задача OPS-00: Гигиена репозитория + “качество воротами” (pre-commit + CI)

## Приоритет

🔴 **P0 / Блокер релиза**

## Проблема (факт)

В репозитории появляются (и частично уже присутствуют) артефакты, которые **не должны** быть в git:

- lint/build outputs (`*lint*.txt/json`, `build_output.txt`, `run_log.txt`, и т.п.)
- бинарники sidecar (`src-tauri/binaries/**`)
- локальные данные (`*.sqlite`, `src-tauri/data/**`)

Это:

- раздувает репо,
- ломает merge/rebase,
- может унести данные/пути/секреты в историю,
- делает сборку MSI неповторяемой.

## Цель

Сделать так, чтобы:

- мусор/артефакты физически не попадали в git,
- PR/коммит не проходит без lint/test (минимальный baseline),
- релизная сборка MSI была воспроизводимой.

## Чек‑лист выполнения

### Этап 1: `.gitignore` (root + src-tauri)

- [x] Обновить корневой `.gitignore` для исключения:
  - `*lint*.txt`, `*lint*.json`, `build_output.txt`, `run_log.txt`, `*.log`
  - `src-tauri/binaries/**`, `src-tauri/data/**`
  - `*.sqlite`, `*.db`
- [x] Проверить `src-tauri/.gitignore` (добавить `binaries/`, `data/`, `*.sqlite`).

### Этап 2: Убрать уже трекаемые артефакты из индекса

- [x] Удалить из git индекса (без удаления с диска) все артефакты (см. git status).
- [x] Проверить, что `git status` больше не показывает артефакты как tracked changes.

### Этап 3: Pre-commit hooks

- [x] Подключить husky + lint-staged (root).
- [x] На pre-commit запускать:
  - frontend lint + unit tests (минимально)
  - backend lint + unit tests (минимально)
  - форматирование (prettier) только по изменённым файлам

### Этап 4: CI (минимальный, но обязательный)

- [x] Добавить workflow для:
  - install (root/backend/frontend),
  - lint,
  - tests (unit/e2e по мере готовности),
  - сборка (как минимум проверка сборки frontend+backend; MSI можно отдельным job).

## Проверка

- `npm run check` (lint + unit tests + build для frontend/backend)
- Проверка хуков: `git commit` с намеренно сломанным TS/ESLint (должен быть заблокирован pre-commit)

## Критерии приёмки

- ✅ В git нет `*.sqlite`, `binaries/**`, `data/**`, `*lint*.json/txt`, `run_log.txt`
- ✅ Pre-commit не даёт коммитить с ломающимся линтом/тестами
- ✅ CI на PR/push прогоняет lint+tests и падает при проблемах
- ✅ Сборка MSI не зависит от “случайных” файлов в репо
