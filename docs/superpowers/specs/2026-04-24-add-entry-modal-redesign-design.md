# Design: Add-Entry Modal Redesign — Live Preview + Style Preference

**Date:** 2026-04-24
**Component:** `frontend/src/components/AddMediaModal/`
**Status:** Approved

## Problem

The add-entry modal (AddMediaModal) works functionally but feels visually dry on the first step ("Инфо"). Fields are stacked plainly; the user can't see what the entry will look like in the library until it's saved.

Non-goals: the "Детали" and "Медиа" steps are largely fine. Flow structure (3 steps) stays.

## Direction

Add a persistent live-preview card on the right side of the modal across all 3 steps. Fill it in as the user types. User can pick between two visual styles for the preview in Settings.

## Scope

### 1. New user preference — `addEntryPreviewStyle`

- Type: `'mirror' | 'poster'`
- Default: `'mirror'`
- Persisted through existing `UserPreferences` JSON column — no DB migration
- Synced via existing `PersonalizationContext` / `savePreferences()` flow

### 2. Modal layout changes (`AddMediaModal/index.tsx`)

- Width: `sm:max-w-[780px]` (was 600px)
- Body wrapped in `grid md:grid-cols-[1fr_280px] gap-6`
- Right column holds `<PreviewCard />`, sticky, visible on all 3 steps
- On `<md` (<768px): preview column hidden, form takes full width (primary use case is Tauri desktop; a compact mobile preview is out of scope for this iteration)
- Existing tabs/footer/progress bar unchanged

### 3. `PreviewCard` (new)

Path: `frontend/src/components/AddMediaModal/PreviewCard.tsx`

Reads form values through `useFormContext` (title, category, rating, image). Reads `addEntryPreviewStyle` from `usePersonalization`. Renders one of two variants:

**Mirror (V1)** — pixel-level mirror of library `MediaCard`:
- Aspect 2:3 cover
- Category badge top-left (glass black background)
- Rating badge top-right (existing rating-gradient)
- Title overlay at bottom over dark gradient
- No description area (preview only; description goes on details step)

**Poster (V2)** — stylized:
- Outer card with gradient background in the category's accent color
- Header row: category icon in a tinted square + "Сериал / Фильм / ..." label
- Poster frame inside with dashed border placeholder or actual cover
- Title + stars at bottom, on top of gradient

Empty states (both variants):
- Title empty → muted placeholder "Название записи"
- No cover → dark category-tinted gradient + faint lucide icon
- No category → neutral muted gradient, no badge/icon
- No rating → no rating badge

### 4. Info step redesign (`InfoStep.tsx`)

- Title `FormInput` grows: `h-12 text-lg`
- Category field replaced: new `CategoryTilePicker` component
- Group and rating fields stay, only repacked into the narrower left column

### 5. `CategoryTilePicker` (new)

Path: `frontend/src/components/AddMediaModal/CategoryTilePicker.tsx`

3×2 grid of tiles. Each tile:
- Lucide icon (Film, Tv, BookOpen, Gamepad2, etc.) + Russian label
- Unselected: muted background, neutral text
- Selected: tile background tinted to accent color (color-mix with the category's `--accent-*` var), border in that accent, subtle glow

Category → accent mapping:
| Category | Accent var |
|---|---|
| Movie  | `--accent-blue`   |
| Series | `--accent-pink`   |
| Book   | `--accent-green`  |
| Game   | `--accent-purple` |
| Anime  | `--accent-orange` |
| Manga  | `--accent-cyan`   |

Controlled via `react-hook-form` `Controller` (same pattern as `FormSelect`).

### 6. Settings card (`AppearanceTab.tsx`)

New Card "Стиль превью записи" with two clickable preview tiles showing miniature versions of V1 and V2. Selecting one sets `addEntryPreviewStyle`. Card uses the same visual shell as existing cards (`bg-background/60 backdrop-blur-sm`, gradient-icon header).

### 7. Persistence wiring

- `UserPreferences` (frontend `api/auth.ts` + backend `entities/user.entity.ts`) gains `addEntryPreviewStyle?: 'mirror' | 'poster'`
- `PersonalizationContextDefinition.ts` gains field + setter
- `PersonalizationContext.tsx` gains state, sync-on-user-change, `savePreferences()` payload
- `usePersonalization()` exposes both (no new hook needed)

## Files Touched

**New:**
- `frontend/src/components/AddMediaModal/PreviewCard.tsx`
- `frontend/src/components/AddMediaModal/CategoryTilePicker.tsx`

**Edited:**
- `backend/src/entities/user.entity.ts` — `UserPreferences` field
- `frontend/src/api/auth.ts` — `UserPreferences` field
- `frontend/src/contexts/PersonalizationContextDefinition.ts`
- `frontend/src/contexts/PersonalizationContext.tsx`
- `frontend/src/pages/SettingsPage/AppearanceTab.tsx` — new card
- `frontend/src/components/AddMediaModal/index.tsx` — width, 2-col layout
- `frontend/src/components/AddMediaModal/InfoStep.tsx` — tile picker, bigger title
- `frontend/src/components/AddMediaModal.test.tsx` — new assertions

## Out of Scope

- Changes to Details/Media step content (they only resize under new width)
- Modal open/close animations
- Library `MediaCard` itself — preview mirrors it but doesn't modify it
- Category accent colors beyond what already exists in `index.css`
- Server-side validation of the new preference (JSON column accepts any shape)

## Testing Plan

- `AddMediaModal.test.tsx` — preview renders, updates on form change, switches between mirror/poster under different `addEntryPreviewStyle` values, CategoryTilePicker selection writes to form state
- Playwright e2e (`e2e/media.spec.ts`) — smoke check that modal opens at new width and submit still works
- Manual visual check in dev server — both styles, empty states, each of 6 categories
