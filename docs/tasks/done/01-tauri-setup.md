# Задача DT-01: Desktop hardening для релиза (Tauri + sidecar + MSI)

## Приоритет
🔴 **P0 / Блокер MSI релиза**

## Зависимости
- REL-00: `00-release-msi-first-run.md`
- BE-01: `01-typeorm-migrations.md`
- SEC-01: `01-remove-secrets-from-git.md`

## Факт (что уже сделано)
Tauri уже интегрирован, backend запускается как sidecar, MSI собирается конфигом bundle.

## Проблема (что мешает релизу сейчас)
1) Desktop security baseline не выдержан:
- `csp: null`
- `withGlobalTauri: true`
- capabilities/permissions требуют ужесточения (принцип минимальных привилегий)

2) Sidecar стартует “как получится”:
- порт выбирается случайно без проверки занятости
- логируются чувствительные пути (app data dir)
- в desktop коде есть default fallback секреты

3) Репозиторная гигиена:
- бинарники/SQLite/логи/линт‑репорты не должны попадать в git (см. `00-repo-hygiene-and-ci.md`)

## Цель
Сделать desktop‑часть **предсказуемой, безопасной и релиз‑готовой**, чтобы MSI на чистой Windows работал с первого запуска.

## Чек‑лист выполнения

### Этап 1: Tauri security baseline
- [ ] Включить CSP в `src-tauri/tauri.conf.json` (не `null`).
- [ ] Отключить `withGlobalTauri` (или обосновать необходимость и компенсировать риски).
- [ ] Пересмотреть `src-tauri/capabilities/default.json`:
  - убрать широкие разрешения (в т.ч. опасные shell permissions),
  - оставить только то, что нужно для sidecar.

### Этап 2: Sidecar запуск (надёжность)
- [ ] Подбор порта: проверять занятость (а не просто random).
- [ ] Убрать default‑секреты и требовать `JWT_SECRET` (см. `01-remove-secrets-from-git.md`).
- [ ] Не логировать чувствительные пути в production (или маскировать).
- [ ] Режим БД/миграций: не принудительно включать `TYPEORM_SYNCHRONIZE=true` (см. `01-typeorm-migrations.md`).

### Этап 3: MSI‑поведение на “чистой” Windows
- [ ] Проверить, что sidecar бинарник реально попадает в MSI bundle (и не берётся из git).
- [ ] Проверить, что app data dir создаётся и доступен без прав администратора.
- [ ] Проверить сценарии из `00-smoke-test-matrix.md`.

## Критерии приёмки
- ✅ CSP включён и не ломает работу.
- ✅ Нет `withGlobalTauri: true` без необходимости.
- ✅ Capabilities минимальные.
- ✅ Sidecar стартует предсказуемо, порт не конфликтует.
- ✅ `TYPEORM_SYNCHRONIZE` не включается в production/релизной сборке.
- ✅ MSI проходит smoke‑матрицу.

