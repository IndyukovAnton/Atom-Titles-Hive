# Claude AI Recommendations

**Status:** Planned
**Owner:** Anton
**Created:** 2026-04-27
**Target release:** v0.3.0

## Цель

Дать пользователю возможность получать персональные рекомендации на основе **всей** его статистики через нейросеть Claude. Рекомендации должны включать как известные модели тайтлы, так и **актуальные новинки** (вышедшие недавно или ожидаемые), а также учитывать **текущее настроение** пользователя.

Результат рендерится **полноценными карточками** (постер, метаданные, причина рекомендации, кнопка добавления в библиотеку), а не plain-text выводом.

## Ненаговорка / non-goals

В этот заход НЕ делаем:
- Claude Code CLI integration (вариант B из брейнсторма) — отложен.
- Streaming-вывод карточек по мере генерации.
- Continuous chat-интерфейс с Claude (multi-turn refinement в чате).
- Server-side хранилище истории AI-рекомендаций.
- Многомодельный switch (OpenAI/Gemini) — только Claude.

## Высокоуровневая архитектура

```
┌───────────────┐  prompt + mood + filters    ┌─────────────────┐
│ RecommendationsPage │ ─────────────────────────▶ │ NestJS backend │
│  (Claude AI tab)    │                             │ /recommendations/│
└───────────────┘                                  │      claude     │
       ▲                                           └────────┬────────┘
       │ JSON cards                                         │
       │                            1. собрать всю user-БД  │
       │                            2. собрать context      │
       │                            3. вызов Claude API     │
       │                                                     ▼
       │                             ┌──────────────────────────────┐
       │                             │ Anthropic API (claude-sonnet- │
       │                             │ 4-6 + tool_use + web_search)  │
       │                             └──────────┬───────────────────┘
       │                                        │
       │                                        │ tool_use: recommendation_card × N
       │                                        ▼
       │                             ┌──────────────────────────────┐
       │                             │ TMDB API (необязательно):    │
       │                             │ догрузить постеры по title    │
       │                             └──────────┬───────────────────┘
       └────────────────────────────────────────┘
```

## Компоненты

### 1. Backend: ClaudeRecommendationsService

**Файл:** `backend/src/modules/recommendations/claude-recommendations.service.ts`
**Зависимости:** `@anthropic-ai/sdk`, `MediaEntry` repo, `User` repo, существующий TMDB lookup.

**Публичный API:**
```typescript
interface ClaudeRecommendationRequest {
  userId: number;
  apiKey: string;            // приходит с фронта (хранится в user.preferences.aiKey)
  prompt?: string;           // свободная просьба пользователя, опц
  mood?: MoodTag;            // опц
  filters?: {
    types?: ('movie' | 'series' | 'anime' | 'book' | 'game')[];
    minRating?: number;
  };
  count?: number;            // default 10, max 20
  model?: ClaudeModelId;     // default 'claude-sonnet-4-6'
}

interface ClaudeRecommendationResponse {
  recommendations: AICard[];
  meta: {
    tokensInput: number;
    tokensOutput: number;
    modelUsed: string;
    webSearched: boolean;
  };
}

type AICard = {
  title: string;
  originalTitle?: string;    // для locale-агностического TMDB lookup
  type: 'movie' | 'series' | 'anime' | 'book' | 'game' | 'other';
  year?: number;
  genres: string[];
  whyRecommended: string;    // ≤ 300 символов, объяснение для именно этого юзера
  estimatedRating?: number;  // 1-10, как Claude думает юзеру понравится
  releasedRecently?: boolean;// флаг для UI badge "Новинка"
  notInLibrary: boolean;     // backend выставляет — true если нет в БД юзера
  posterUrl?: string;        // догружается из TMDB по title+year
};
```

**Поток выполнения:**
1. Валидация: apiKey не пустой, count в пределах 1..20.
2. Сбор полной статистики user'a (см. Data Strategy).
3. Формирование Anthropic API request:
   - `system`: роль рекомендатора, формат tool вывода, требования (учитывать всю историю, fresh releases через web_search, mood).
   - `messages[0]`: user message с prompt + mood + полной статистикой в compact формате.
   - `tools`: один кастомный `recommendation_card` (для structured output) + один встроенный `web_search_20250305` для актуальных релизов.
   - `tool_choice`: `{ type: "any" }` — заставляем модель вызвать тулу.
4. Цикл agent loop: пока stop_reason == 'tool_use', выполняем web_search server-side (Anthropic делает сам), и собираем все вызовы `recommendation_card`.
5. Дедуп против user.media по `title+year` (case-insensitive normalize).
6. Для каждой карточки — параллельный TMDB lookup (только если в `user.preferences.tmdbApiKey`) → `posterUrl`. Не блокирующий: fail-safe, без постера тоже OK.
7. Возврат `recommendations` + `meta`.

### 2. Backend: ClaudeRecommendationsController

**Файл:** добавляем endpoint в существующий `recommendations.controller.ts`:
```typescript
@UseGuards(JwtAuthGuard)
@Post('claude')
async getClaudeRecommendations(
  @Req() req: AuthenticatedRequest,
  @Body() body: ClaudeRecommendationDto,
): Promise<ClaudeRecommendationResponse> { ... }
```

DTO с class-validator (nest-style).

### 3. Backend: Data Strategy — собрать ВСЮ статистику

User explicitly хочет «всю». Risk: 1000+ записей × длинные descriptions = 250k+ токенов, не влезет в 200k context Sonnet 4.6.

**Решение:**
- Все записи передаются в **compact CSV-подобном формате**: `[type] title (year) — rating★ — status — genres`. Один тайтл = ~80 байт.
- 1000 записей × 80 байт = 80 KB ≈ 20k токенов — comfortable.
- Полные descriptions передаются ТОЛЬКО для топ-10 highest-rated и топ-10 worst-rated (даёт Claude представление о том, что юзер действительно любит/ненавидит).
- Если общий вес > 150k токенов — fallback: оставляем только записи с `rating > 0` (явно оценённые) + последние 100 по `updatedAt`. В meta возвращаем `truncated: true`, фронт показывает badge "анализ ограничен из-за объёма".

**Структура data block в prompt:**
```
=== ВСЯ БИБЛИОТЕКА ПОЛЬЗОВАТЕЛЯ (компактно) ===
[movie] Inception (2010) — 9★ — completed — Sci-Fi, Thriller
[anime] Attack on Titan (2013) — 10★ — completed — Action, Drama
... (всего N записей)

=== ТОП-10 ЛЮБИМЫХ (с описанием) ===
1. Inception (2010) ★9 — Кобб может проникать в чужие сны...
...

=== ТОП-10 АНТИПАТИЙ (с описанием) ===
1. Twilight (2008) ★2 — История подростковой любви...
...

=== ПРЕДПОЧТЕНИЯ (агрегаты) ===
- Любимые жанры (по частоте + рейтингу): Sci-Fi (15 тайтлов, avg 8.2), Drama (12, 7.9), Anime (10, 8.5)
- Период активности: 2023-2026
- Среднее количество завершаемых: 5/мес
- Тип контента (распределение): movies 40%, series 30%, anime 25%, books 5%
```

### 4. Backend: System prompt (черновик)

```
Ты — персональный рекомендатель медиа-контента в приложении Seen. Твоя задача — предложить пользователю N тайтлов (фильмы, сериалы, аниме, книги, игры), которые ему ВЕРОЯТНО понравятся.

Правила:
1. Используй ВСЮ переданную статистику пользователя для понимания его вкусов.
2. Для каждой рекомендации вызови tool `recommendation_card` ровно один раз. Не выводи текст — только tool calls.
3. Включай как классику, которую пользователь может не знать, ТАК и АКТУАЛЬНЫЕ НОВИНКИ (релизы за последние 6 месяцев или ожидаемые в ближайшие). Для проверки актуальности используй web_search.
4. Если указано настроение mood — учитывай его (например, "грустно" → не рекомендуй депрессивные драмы).
5. Если указан свободный prompt — приоритизируй его требования над автоматическим вкусом.
6. Не рекомендуй то, что уже есть в библиотеке пользователя.
7. В whyRecommended объясняй ИМЕННО ДЛЯ ЭТОГО пользователя на основе его истории (например, "Вам понравился X — этот тайтл похож по Y").
8. Если для пользователя в whyRecommended уместно сослаться на конкретный его тайтл — называй его в кавычках.
```

### 5. Backend: tool definition

```typescript
{
  name: 'recommendation_card',
  description: 'Создать одну карточку рекомендации для пользователя. Вызови по одному разу для каждой рекомендуемой единицы контента.',
  input_schema: {
    type: 'object',
    required: ['title', 'type', 'genres', 'whyRecommended'],
    properties: {
      title: { type: 'string' },
      originalTitle: { type: 'string', description: 'Оригинальное название латиницей для поиска постера' },
      type: { type: 'string', enum: ['movie', 'series', 'anime', 'book', 'game', 'other'] },
      year: { type: 'integer' },
      genres: { type: 'array', items: { type: 'string' } },
      whyRecommended: { type: 'string', maxLength: 300 },
      estimatedRating: { type: 'number', minimum: 1, maximum: 10 },
      releasedRecently: { type: 'boolean', description: 'true если вышло в последние 6 месяцев' },
    },
  },
}
```

Плюс встроенный `web_search_20250305` (1 параметр `max_uses: 5` чтобы ограничить расходы).

### 6. Backend: модели и стоимость

| Модель | Контекст | $/1M in | $/1M out | Когда использовать |
|--------|----------|---------|----------|--------------------|
| **claude-sonnet-4-6** (default) | 200k | $3 | $15 | Стандартные запросы |
| claude-opus-4-7 | 200k | $15 | $75 | Опция в Settings для премиума |
| claude-haiku-4-5 | 200k | $1 | $5 | Дешёвый fallback |

Типичный запрос: ~25k input + ~3k output + ~5 web searches (~10c за поиск) = **~$0.15 на запрос Sonnet**, **~$0.05 Haiku**, **~$0.65 Opus**.

Prompt caching включаем для system prompt + статистики (если запрос делается повторно в течение 5 минут → кэш-хит).

### 7. Frontend: RecommendationsPage / ClaudeRecommendationsTab

**Файл:** `frontend/src/pages/RecommendationsPage/ClaudeAITab.tsx` (новый раздел/таб).

**Структура UI:**

```
┌── Что вы хотите увидеть? ────────────────────┐
│ <textarea> placeholder: "Опишите своими     │
│  словами или оставьте пустым"               │
└──────────────────────────────────────────────┘

Настроение (опционально):  [пропустить ✕]
[😄 весёлое] [😴 уютное] [😢 грустное] [⚡ боевое]
[🤔 думать ] [😱 страх ] [💕 романтич] [🌌 уход в др. мир]

Тип контента:
[ ✓ Фильмы ] [ ✓ Сериалы ] [ ✓ Аниме ] [ Книги ] [ Игры ]

Количество: [10 ▾]   Модель: [Sonnet 4.6 ▾]

[ ✨ Спросить Claude ]   <— основная CTA

──── Результаты ────────────────────────────────

[loading state с прогрессом этапов:
 "Анализирую вашу библиотеку..." →
 "Ищу новинки..." →
 "Готовлю карточки..." ]

┌────────┐ ┌────────┐ ┌────────┐
│poster  │ │poster  │ │poster  │
│Title   │ │Title   │ │Title   │
│★8.2 NEW│ │★7.9    │ │★9.1    │ ← badge "NEW" если releasedRecently
│        │ │        │ │        │
│Жанры   │ │Жанры   │ │Жанры   │
│        │ │        │ │        │
│💡 Why: │ │💡 Why: │ │💡 Why: │
│"…"     │ │"…"     │ │"…"     │
│        │ │        │ │        │
│[ + Add]│ │[ + Add]│ │[ + Add]│
└────────┘ └────────┘ └────────┘

Token usage: 28k in / 3.2k out  •  $0.14
[🔄 Получить новые]
```

**Mood: палитра (8 настроений, фиксированных)**:
- 😄 Весёлое (light)
- 😴 Уютное (cozy)
- 😢 Грустное (sad)
- ⚡ Боевое (energetic)
- 🤔 Размышление (thoughtful)
- 😱 Адреналин/страх (thrilling)
- 💕 Романтика (romantic)
- 🌌 Эскапизм (escapist)

Mood ↔ guidance в whyRecommended Claude учитывает явно (см. system prompt).

### 8. Frontend: API client

`frontend/src/api/recommendations.ts` — добавить:
```typescript
getClaudeRecommendations: async (params: ClaudeRequestPayload): Promise<ClaudeResponse>
```

Передаёт apiKey из `localStorage[ai_secure_key_<userId>]` (там IntegrationsTab уже хранит).

### 9. Frontend: AICard component

`frontend/src/components/recommendations/AICard.tsx` — переиспользуем визуально существующие RecommendationItem карточки, добавляем:
- Badge `NEW` если `releasedRecently`
- Section `whyRecommended` с иконкой 💡
- Кнопка `[+ Добавить в библиотеку]` → открывает существующий MediaCreate dialog с предзаполненными полями (title, type, year, genres).
- Если есть TMDB poster — показываем; если нет — стилизованный placeholder с иконкой по типу.

### 10. Privacy / consent

Первый клик «Спросить Claude» в сессии → dialog:

> Запрос будет отправлен в Anthropic (Claude). Передаётся: список ваших тайтлов с оценками и жанрами, ваш текстовый запрос и настроение. Личные данные (email, пароль) НЕ передаются. Anthropic может использовать запрос для improvement моделей согласно их Terms (или нет, если у вас Privacy-mode key).
>
> [Не отправлять] [Отправить и больше не спрашивать]

Сохраняем выбор в `localStorage[claude_consent_<userId>]`.

### 11. Settings (IntegrationsTab) — расширения

В существующий `AISettings` компонент:
- Поле для Anthropic API key (если ещё нет).
- Селект default модели (Sonnet 4.6 / Opus 4.7 / Haiku 4.5).
- Чекбокс «Использовать web_search для поиска новинок» (default ON).
- Ссылка на console.anthropic.com где взять ключ.

### 12. Error handling

| Ошибка | UX |
|--------|-----|
| API key пустой | Inline error: «Сначала добавьте Anthropic API key в Настройках → Интеграции» с deeplink |
| API key невалидный (401) | Toast: «Ключ Anthropic не принят. Проверьте его в Настройках» |
| Rate limit (429) | Toast: «Превышен лимит. Подождите минуту и повторите» |
| Insufficient credits | Toast: «На балансе Anthropic закончились средства. Пополните аккаунт» |
| Network timeout | Toast с retry-кнопкой |
| Tool вернул < 1 рекомендации | Empty state с кнопкой «Попробовать ещё раз» |
| Truncated user library | Inline warning: «Передан только subset вашей библиотеки (>150k токенов)» |

Все Anthropic errors маппим к user-facing сообщениям, не показываем raw stack trace.

### 13. Tests

- Unit: `ClaudeRecommendationsService` с mocked Anthropic SDK (verify prompt structure, dedup, fallback chain)
- Unit: data compaction logic (тест что 1000 записей → < 50k символов)
- Integration: e2e mocked endpoint → frontend получает массив карточек правильной формы
- Manual QA: smoke test с реальным API key (один прогон), проверить что web_search действительно активируется для запроса вроде «что нового вышло»

## Скоуп v1 vs v1.5

**v1 (этот спринт):**
- Backend endpoint /recommendations/claude
- Полная статистика передачи
- Tool use для structured output
- web_search для новинок
- Mood + filters + count + model
- Карточки с TMDB-постерами (если ключ есть)
- Privacy consent dialog
- Error handling
- Базовые тесты

**v1.5 (потом, если зайдёт):**
- Streaming output (карточки появляются по одной)
- «Уточнить запрос» — multi-turn чат с Claude
- Deep-dive по конкретной карточке: «расскажи подробнее почему именно это»
- История запросов в БД
- Опциональный self-host через Claude Code CLI (вариант B из брейнсторма)

## План реализации (последовательность шагов)

1. ✅ Spec (этот файл)
2. Backend: установка `@anthropic-ai/sdk`, basic ClaudeRecommendationsService skeleton с mock-ответом
3. Backend: data compaction layer (compactUserLibrary())
4. Backend: реальный Anthropic API call с tool_use, без web_search (проверить format)
5. Backend: добавить web_search tool, проверить что Claude вызывает
6. Backend: TMDB poster lookup, dedup against user library
7. Backend: error mapping
8. Backend: unit tests
9. Frontend: API client method + types
10. Frontend: ClaudeAITab компонент с формой (prompt + mood + filters + button)
11. Frontend: AICard компонент с TMDB poster + add button
12. Frontend: loading states + empty + errors
13. Frontend: privacy consent dialog
14. Frontend: интеграция в RecommendationsPage (новая вкладка)
15. Frontend: расширение AISettings в IntegrationsTab (ключ + модель + web_search toggle)
16. Manual QA с реальным ключом
17. Bump версии (0.2.1 → 0.3.0), коммит, релиз

## Файлы, которых это коснётся

**Создаём:**
- `backend/src/modules/recommendations/claude-recommendations.service.ts`
- `backend/src/modules/recommendations/dto/claude-recommendation.dto.ts`
- `backend/src/modules/recommendations/claude-recommendations.service.spec.ts`
- `frontend/src/pages/RecommendationsPage/ClaudeAITab.tsx`
- `frontend/src/components/recommendations/AICard.tsx`
- `frontend/src/components/recommendations/MoodPicker.tsx`
- `frontend/src/components/recommendations/ConsentDialog.tsx`

**Модифицируем:**
- `backend/src/modules/recommendations/recommendations.controller.ts` (новый endpoint)
- `backend/src/modules/recommendations/recommendations.module.ts` (провайдер ClaudeRecommendationsService)
- `backend/package.json` (добавляем `@anthropic-ai/sdk`)
- `frontend/src/api/recommendations.ts` (новый method)
- `frontend/src/pages/RecommendationsPage.tsx` (новая вкладка)
- `frontend/src/components/personalization/AISettings.tsx` (расширение)
- `frontend/src/api/auth.ts` (типы preferences: добавить `claudeModel`, `useWebSearch`)
- `package.json` root (bump 0.2.1 → 0.3.0)
- `src-tauri/tauri.conf.json` + `Cargo.toml` (через sync-version)

## Открытые вопросы

- ❓ TMDB API key — у пользователя может не быть. Без него постеров не будет; UI рендерим placeholder. ОК.
- ❓ Web search в Anthropic API — проверить что доступен на тарифе пользователя (это анонимный server tool, не требует отдельной активации, но debug-проверить).
- ❓ Локализация: отвечает ли Claude по-русски для русскоязычного prompt? Проверим эмпирически — если плохо, добавим в system prompt «отвечай на языке prompt».

---

**Готов начинать.** После этого spec'а перехожу к шагу 2 (`@anthropic-ai/sdk` + skeleton).
