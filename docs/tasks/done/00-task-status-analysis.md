# 📌 Актуальный план работ (Work Backlog) — Atom Titles‑Hive

> **Дата актуализации**: 23 января 2026  
> **Цель релиза**: **MSI → установка на “чистой” Windows → первый запуск → приложение работает (Tauri + sidecar backend + БД + авторизация + CRUD + медиа)**  
> **Стратегия**: сначала закрываем **P0 (безопасность/стабильность/первый запуск)**, затем P1 (качество и предсказуемость), потом P2 (улучшения/полировка).

---

## ✅ Фактическое состояние (без иллюзий)

### Что уже есть
- **Desktop**: Tauri 2.x, backend запускается как **sidecar** (порт генерируется случайно).
- **Backend**: NestJS + SQLite + TypeORM, логирование и e2e тесты частично присутствуют.
- **Frontend**: React + Vite + TS, есть тесты и интеграции (частично).

### Главные “дырки” прямо сейчас (P0)
- **TypeORM миграции в runtime отключены**, вместо этого используется `synchronize` (и в sidecar ещё и принудительно включено).
- **JWT secret имеет дефолтный fallback** (и в backend, и в desktop sidecar) — это security‑дыра.
- **Tauri security**: CSP выключен (`csp: null`), включён `withGlobalTauri: true`, capabilities требуют ревизии.
- В git лежат/генерируются **артефакты** (lint outputs, logs) и потенциально **бинарники/SQLite** — это ломает процесс и может утечь в историю.
- Frontend имеет места с **side‑effects в render** и **несколько источников правды** (localStorage/store/context) — риск нестабильности.

---

## 🎯 “Definition of Done” для MSI‑релиза (обязательное)

- **MSI сборка** создаётся повторяемо на чистом окружении.
- Установленное приложение:
  - стартует без dev‑сервера;
  - поднимает backend sidecar;
  - создаёт/открывает БД в **app data dir**;
  - **применяет миграции** при старте (или при первом запуске);
  - позволяет зарегистрироваться/войти;
  - позволяет создать группу/запись/загрузить медиа;
  - корректно переживает перезапуск приложения (данные остаются).
- Нет дефолтных секретов, нет отключенного CSP, нет лишних привилегий у Tauri.
- В репозитории **нет** бинарников, SQLite, логов и lint‑репортов.

---

## 📋 Список задач (актуальный, по факту)

### 🔴 P0 — Release / Security / First‑run (делать первым)

1. **00-release-msi-first-run.md** — “MSI install → first run → всё работает”
2. **01-tauri-setup.md** — Desktop hardening: CSP, capabilities, port binding, упаковка sidecar, поведение на чистой Windows
3. **01-typeorm-migrations.md** — миграции в runtime, отказ от `synchronize` (особенно в sidecar), жизненный цикл БД при установке
4. **01-remove-secrets-from-git.md** — секреты + дефолтные fallback‑секреты в коде + правила для `.env` + чистка истории при необходимости
5. **00-repo-hygiene-and-ci.md** — убрать артефакты/бинарники/SQLite из git, настроить `.gitignore` + pre-commit + CI “не даёт сломать релиз”

### 🟡 P1 — Надёжность и предсказуемость разработки

6. **02-frontend-state-and-api-hardening.md** — единый источник истины для темы/настроек/токена, убрать side‑effects в render, централизовать storage keys
7. **02-rate-limiting.md** — защита auth/критичных эндпоинтов и тесты
8. **04-recommendations-tests.md** + **05-external-api-error-handling.md** — покрытие + отказоустойчивость интеграций (не блокирует MSI, но блокирует “качество”)
9. **06-database-indexes.md** — индексы через миграции (после того, как миграции включены)

### 🟢 P2 — Полировка и улучшения (после релиза)

10. **06-bug-fixes-and-cleanup.md**
11. **05-ui-polish-and-critical-fixes.md**
12. **07-component-optimization-and-refactor.md**
13. **04-album-and-media-viewer-upgrade.md**
14. **08-frontend-observability.md** (замена старой задачи про console.log)

---

## ⚠️ Важно про “не упустить ничего”

Если задача влияет на **первый запуск MSI**, она должна быть либо в **00-release-msi-first-run.md**, либо прямой зависимостью P0 (Tauri hardening / миграции / секреты / гигиена репо).

