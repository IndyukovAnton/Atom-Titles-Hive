# Atom Titles-Hive

> **Локальное desktop-приложение для отслеживания просмотренных видео, фильмов, аниме и другого медиаконтента**

## 📋 Описание проекта

Atom Titles-Hive — это минималистичное и функциональное приложение для ведения личной медиатеки. Позволяет систематизировать, группировать и анализировать ваши просмотры с подробной статистикой.

### ✨ Ключевые возможности

- 📝 **Управление записями**: создание, редактирование, удаление записей о просмотренном контенте
- 🗂️ **Группировка**: организация записей по пользовательским группам
- 🔍 **Поиск и фильтрация**: быстрый поиск по названию, жанру, категории
- 📊 **Статистика**: подробная аналитика просмотров, любимые жанры, общее время
- 🎨 **Минималистичный UI**: приятный и функциональный интерфейс
- 📱 **Адаптивность**: полная поддержка mobile/tablet/desktop
- 🖥️ **Desktop-приложение**: нативное приложение на базе Tauri

---

## 🏗️ Архитектура проекта

```
atom-titles-hive/
├── backend/              # NestJS API сервер
│   ├── src/
│   │   ├── entities/    # TypeORM сущности (User, MediaEntry, Group)
│   │   ├── modules/     # Модули NestJS (auth, media, groups, profile)
│   │   ├── dto/         # Data Transfer Objects
│   │   ├── services/    # Бизнес-логика
│   │   └── utils/       # Утилиты (логирование, валидация)
│   ├── database/        # SQLite база данных
│   └── package.json
│
├── frontend/            # Vite + React UI
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы приложения
│   │   ├── store/       # Zustand state management
│   │   ├── api/         # API клиент (axios)
│   │   ├── hooks/       # Custom React hooks
│   │   └── styles/      # CSS стили
│   └── package.json
│
├── src-tauri/           # Tauri desktop wrapper
│   ├── src/
│   └── tauri.conf.json
│
├── logs/                # Логи приложения (txt файлы по датам)
│
└── README.md
```

---

## 🛠️ Технологический стек

### Backend
- **Framework**: NestJS 11+
- **Database**: SQLite + TypeORM
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Logging**: Custom file-based logging (daily logs)

### Frontend
- **Framework**: React 18+ с TypeScript
- **Build Tool**: Vite 6+
- **Routing**: React Router DOM
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v4 + shadcn/ui

### Desktop
- **Platform**: Tauri 2.x
- **Language**: Rust (Tauri core)

---

## 📦 Установка и запуск

### Требования
- Node.js 20+
- npm 10+
- Rust (для Tauri)

### 1. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Tauri (из корня проекта)
cd ..
npm install
```

### 2. Запуск в режиме разработки

**Терминал 1 — Backend:**
```bash
cd backend
npm run start:dev
```

**Терминал 2 — Frontend:**
```bash
cd frontend
npm run dev
```

**Терминал 3 — Desktop App:**
```bash
npm run tauri dev
```

### 3. Сборка production

```bash
# Сборка backend
cd backend
npm run build

# Сборка frontend
cd ../frontend
npm run build

# Сборка desktop-приложения
cd ..
npm run tauri build
```

---

## 🎯 Основные экраны и функции

### 1️⃣ Главная страница
- **Список всех записей** с превью изображением, названием, рейтингом
- **Табы групп** (переключение между группами и "Без группы")
- **Поиск** по названию
- **Фильтрация** по жанрам, категориям, рейтингу
- **Кнопка создания** новой записи

### 2️⃣ Форма создания/редактирования записи
- Название
- Изображение (загрузка или URL)
- Описание
- Рейтинг (1-10)
- Дата начала просмотра
- Дата окончания просмотра
- Жанр (множественный выбор)
- Категория (свой ввод или выбор из существующих)
- Дополнительные опции (тэги)
- Привязка к группе

### 3️⃣ Управление группами
- Создание группы (название)
- Редактирование названия группы
- Удаление группы (записи переходят в "Без группы")

### 4️⃣ Страница профиля
- **Общая информация**: никнейм, логин
- **Статистика**:
  - Общее количество записей
  - Любимая категория (наиболее частая)
  - Любимый жанр
  - Общее время просмотра
  - Время просмотра за текущий месяц

### 5️⃣ Настройки
- Настройки аккаунта (смена пароля, email)
- Настройки приложения (тема, язык)
- Экспорт/импорт данных

### 6️⃣ Авторизация
- Форма входа
- Форма регистрации
- Восстановление пароля (опционально)

---

## 🗄️ Модель данных

### User (Пользователь)
```typescript
{
  id: number
  username: string
  email: string
  password: string (hashed)
  createdAt: Date
  updatedAt: Date
}
```

### MediaEntry (Запись о медиа)
```typescript
{
  id: number
  title: string
  image: string (URL или путь)
  description: string
  rating: number (1-10)
  startDate: Date | null
  endDate: Date | null
  genres: string[] (JSON)
  category: string
  tags: string[] (JSON)
  userId: number
  groupId: number | null
  createdAt: Date
  updatedAt: Date
}
```

### Group (Группа)
```typescript
{
  id: number
  name: string
  userId: number
  createdAt: Date
  updatedAt: Date
}
```

---

## 📝 Логирование

Логи записываются в папку `/logs` в формате:
- **Имя файла**: `YYYY-MM-DD.txt` (например, `2025-12-26.txt`)
- **Формат записи**: `[HH:MM:SS] [LEVEL] Сообщение`
- **Уровни**: INFO, WARN, ERROR

Пример:
```
[10:30:15] [INFO] User logged in: user123
[10:35:42] [ERROR] Failed to create media entry: Validation error
```

---

## 🚀 Roadmap

### MVP (v1.0)
- [x] Инициализация проекта
- [ ] Backend API (CRUD для записей, групп, пользователей)
- [ ] Frontend UI (основные экраны)
- [ ] Авторизация и регистрация
- [ ] Поиск и фильтрация
- [ ] Desktop-приложение (Tauri)
- [ ] Логирование

### v1.1
- [ ] Экспорт/импорт данных (JSON, CSV)
- [ ] Расширенная статистика (графики)
- [ ] Темная/светлая тема
- [ ] Более продвинутая фильтрация

### v2.0
- [ ] Синхронизация между устройствами (опционально)
- [ ] Интеграция с внешними API (TMDB, MyAnimeList)
- [ ] Рекомендации на основе истории

---

## 📄 Лицензия

Частный проект (Private License)

---

## 👤 Автор

**Anton Indyukov**  
Portfolio Project — Atom Titles-Hive

---

**Разработка начата**: 26 декабря 2025  
**Статус**: 🚧 В разработке



# SOON

- Мобильное приложение
- Возможность захода через приложение, сайт, desktop-приложение