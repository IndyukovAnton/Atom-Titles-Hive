# Add-Entry Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign AddMediaModal to show a live-preview card next to the form across all 3 steps, with a user-configurable preview style (mirror of library card vs. cinematic poster).

**Architecture:** Widen the existing shadcn Dialog to 780px and split into a 2-column grid (form | preview). A new `PreviewCard` component reads form values via `useFormContext` and renders either `MirrorPreview` (exact clone of library `MediaCard` visuals) or `PosterPreview` (stylized, category-accent gradient) based on a new user pref `addEntryPreviewStyle`. The category select is replaced with a `CategoryTilePicker` (3×2 colored tiles with lucide icons).

**Tech Stack:** React 19, react-hook-form, Tailwind v4 with existing `--accent-*` CSS vars, shadcn/ui (Dialog, Tabs, Card, Select), lucide-react, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-04-24-add-entry-modal-redesign-design.md`

---

## File Structure

**New files:**
- `frontend/src/components/AddMediaModal/CategoryTilePicker.tsx` — form-connected tile grid for category selection
- `frontend/src/components/AddMediaModal/PreviewCard.tsx` — live preview with Mirror/Poster variants
- `frontend/src/components/AddMediaModal/CategoryTilePicker.test.tsx` — unit test
- `frontend/src/components/AddMediaModal/PreviewCard.test.tsx` — unit test

**Modified files:**
- `backend/src/entities/user.entity.ts` — extend `UserPreferences` interface
- `frontend/src/api/auth.ts` — mirror the field in the frontend type
- `frontend/src/contexts/PersonalizationContextDefinition.ts` — add field + setter type
- `frontend/src/contexts/PersonalizationContext.tsx` — add state, hydrate from profile, include in `savePreferences()`
- `frontend/src/pages/SettingsPage/AppearanceTab.tsx` — new card with Mirror/Poster picker
- `frontend/src/components/AddMediaModal/index.tsx` — `sm:max-w-[780px]`, 2-col grid, render `<PreviewCard />`, keep `ScrollArea` only around the form column
- `frontend/src/components/AddMediaModal/InfoStep.tsx` — replace `FormSelect` for category with `CategoryTilePicker`, enlarge title input
- `frontend/src/components/AddMediaModal.test.tsx` — cover new markup

---

## Task 1: Extend UserPreferences type (backend + frontend)

**Files:**
- Modify: `backend/src/entities/user.entity.ts:12-25`
- Modify: `frontend/src/api/auth.ts:14-30`

No tests — type-only change; TypeScript compile is the check.

- [ ] **Step 1: Add field to backend type**

Edit `backend/src/entities/user.entity.ts` — inside the `UserPreferences` interface, add a new optional field after `avatar?`:

```ts
export interface UserPreferences {
  background?: string;
  fontSize?: number;
  fontFamily?: string;
  language?: string;
  aiProvider?: string;
  aiKey?: string;
  aiLimits?: {
    dailyRequests?: number;
    maxTokens?: number;
  };
  tmdbApiKey?: string;
  avatar?: string;
  addEntryPreviewStyle?: 'mirror' | 'poster';
}
```

- [ ] **Step 2: Mirror the field on the frontend**

Edit `frontend/src/api/auth.ts` — inside the `UserPreferences` interface (line ~14), add the same field right before the closing brace:

```ts
  tmdbApiKey?: string;
  addEntryPreviewStyle?: 'mirror' | 'poster';
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: no errors.

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/entities/user.entity.ts frontend/src/api/auth.ts
git commit -m "feat(prefs): add addEntryPreviewStyle to UserPreferences"
```

---

## Task 2: Wire the preference into PersonalizationContext

**Files:**
- Modify: `frontend/src/contexts/PersonalizationContextDefinition.ts`
- Modify: `frontend/src/contexts/PersonalizationContext.tsx`

- [ ] **Step 1: Extend the context type**

Edit `frontend/src/contexts/PersonalizationContextDefinition.ts` — add field + setter to `PersonalizationContextType`:

```ts
import { createContext } from 'react';

export type Theme = 'light' | 'dark';
export type AddEntryPreviewStyle = 'mirror' | 'poster';

export interface PersonalizationContextType {
  theme: Theme;
  background: string;
  fontSize: number;
  fontFamily: string;
  aiKey: string;
  addEntryPreviewStyle: AddEntryPreviewStyle;
  privacySettings: {
    shareWatchHistory: boolean;
    shareBirthDate: boolean;
  };
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setBackground: (background: string) => void;
  setFontSize: (fontSize: number) => void;
  setFontFamily: (fontFamily: string) => void;
  setAiKey: (key: string) => void;
  setAddEntryPreviewStyle: (style: AddEntryPreviewStyle) => void;
  setPrivacySettings: (settings: { shareWatchHistory: boolean; shareBirthDate: boolean }) => void;
  savePreferences: () => Promise<void>;
}

export const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);
```

- [ ] **Step 2: Implement state + hydration + save in the provider**

Edit `frontend/src/contexts/PersonalizationContext.tsx`.

Near the other `DEFAULT_*` constants at the top, add:

```ts
const DEFAULT_ADD_ENTRY_PREVIEW_STYLE: 'mirror' | 'poster' = 'mirror';
```

Change the top-level import line to also bring the new type:

```ts
import { PersonalizationContext, type Theme, type AddEntryPreviewStyle } from './PersonalizationContextDefinition';
```

Inside `PersonalizationProvider`, next to the other `useState` declarations (after `fontFamily`), add:

```ts
  const [addEntryPreviewStyle, setAddEntryPreviewStyleState] = useState<AddEntryPreviewStyle>(
    () => (user?.preferences?.addEntryPreviewStyle as AddEntryPreviewStyle | undefined) || DEFAULT_ADD_ENTRY_PREVIEW_STYLE
  );
```

Inside the `if (user?.preferences !== lastUserPref)` block (where other prefs are synced), add:

```ts
      if (prefs.addEntryPreviewStyle === 'mirror' || prefs.addEntryPreviewStyle === 'poster') {
        setAddEntryPreviewStyleState(prefs.addEntryPreviewStyle);
      }
```

Add the setter function near the other `set*` helpers:

```ts
  const setAddEntryPreviewStyle = (style: AddEntryPreviewStyle) => {
    setAddEntryPreviewStyleState(style);
  };
```

Update the `preferences` object inside `savePreferences` to include the new field:

```ts
    const preferences: UserPreferences = {
      background,
      fontSize,
      fontFamily,
      privacySettings,
      addEntryPreviewStyle,
    };
```

Include both in the `PersonalizationContext.Provider` value:

```tsx
      value={{
        theme,
        background,
        fontSize,
        fontFamily,
        aiKey,
        addEntryPreviewStyle,
        privacySettings,
        toggleTheme,
        setTheme,
        setBackground,
        setFontSize,
        setFontFamily,
        setAiKey,
        setAddEntryPreviewStyle,
        setPrivacySettings,
        savePreferences,
      }}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/contexts/PersonalizationContextDefinition.ts frontend/src/contexts/PersonalizationContext.tsx
git commit -m "feat(prefs): expose addEntryPreviewStyle via PersonalizationContext"
```

---

## Task 3: CategoryTilePicker component

**Files:**
- Create: `frontend/src/components/AddMediaModal/CategoryTilePicker.tsx`
- Create: `frontend/src/components/AddMediaModal/CategoryTilePicker.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/AddMediaModal/CategoryTilePicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { CategoryTilePicker } from './CategoryTilePicker';

function Harness({ onChange }: { onChange?: (v: string) => void }) {
  const methods = useForm({ defaultValues: { category: 'Movie' } });
  const value = methods.watch('category');
  if (onChange) onChange(value);
  return (
    <FormProvider {...methods}>
      <CategoryTilePicker name="category" label="Категория" />
    </FormProvider>
  );
}

describe('CategoryTilePicker', () => {
  it('renders all 6 category tiles with labels', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: /фильм/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сериал/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /книга/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /игра/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /аниме/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /манга/i })).toBeInTheDocument();
  });

  it('marks the matching tile as selected', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: /фильм/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /сериал/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('updates form value when a tile is clicked', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<Harness onChange={(v) => seen.push(v)} />);
    await user.click(screen.getByRole('button', { name: /аниме/i }));
    expect(seen[seen.length - 1]).toBe('Anime');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/AddMediaModal/CategoryTilePicker.test.tsx`
Expected: FAIL — `CategoryTilePicker` module not found.

- [ ] **Step 3: Implement the component**

Create `frontend/src/components/AddMediaModal/CategoryTilePicker.tsx`:

```tsx
import { Controller, useFormContext } from 'react-hook-form';
import { BookOpen, Film, Gamepad2, Play, Sparkles, Tv } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type CategoryValue = 'Movie' | 'Series' | 'Book' | 'Game' | 'Anime' | 'Manga';

interface CategoryTileDef {
  value: CategoryValue;
  label: string;
  icon: typeof Film;
  /** CSS var name without leading `--` */
  accentVar: string;
}

const CATEGORIES: CategoryTileDef[] = [
  { value: 'Movie', label: 'Фильм', icon: Film, accentVar: 'accent-blue' },
  { value: 'Series', label: 'Сериал', icon: Tv, accentVar: 'accent-pink' },
  { value: 'Book', label: 'Книга', icon: BookOpen, accentVar: 'accent-green' },
  { value: 'Game', label: 'Игра', icon: Gamepad2, accentVar: 'accent-purple' },
  { value: 'Anime', label: 'Аниме', icon: Play, accentVar: 'accent-orange' },
  { value: 'Manga', label: 'Манга', icon: Sparkles, accentVar: 'accent-cyan' },
];

interface CategoryTilePickerProps {
  name: string;
  label?: string;
  disabled?: boolean;
}

export function CategoryTilePicker({ name, label, disabled }: CategoryTilePickerProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const selected = field.value === cat.value;
              const accent = `var(--${cat.accentVar})`;
              return (
                <button
                  key={cat.value}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => field.onChange(cat.value)}
                  className={cn(
                    'group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all cursor-pointer',
                    'hover:border-[color:var(--accent-tile)] hover:bg-[color-mix(in_oklab,var(--accent-tile)_8%,transparent)]',
                    selected
                      ? 'border-[color:var(--accent-tile)] bg-[color-mix(in_oklab,var(--accent-tile)_14%,transparent)] text-[color:var(--accent-tile)] shadow-sm'
                      : 'border-border/70 bg-muted/40 text-muted-foreground',
                    disabled && 'opacity-50 pointer-events-none',
                  )}
                  style={{ ['--accent-tile' as string]: accent }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/AddMediaModal/CategoryTilePicker.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AddMediaModal/CategoryTilePicker.tsx frontend/src/components/AddMediaModal/CategoryTilePicker.test.tsx
git commit -m "feat(add-entry): add CategoryTilePicker form component"
```

---

## Task 4: PreviewCard component with Mirror + Poster variants

**Files:**
- Create: `frontend/src/components/AddMediaModal/PreviewCard.tsx`
- Create: `frontend/src/components/AddMediaModal/PreviewCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/AddMediaModal/PreviewCard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { FormProvider, useForm } from 'react-hook-form';
import { PreviewCard } from './PreviewCard';
import { usePersonalization } from '@/hooks/usePersonalization';

vi.mock('@/hooks/usePersonalization', () => ({
  usePersonalization: vi.fn(),
}));

const mockedUsePersonalization = vi.mocked(usePersonalization);

function Harness({
  values,
}: {
  values: { title?: string; category?: string; rating?: number; image?: string };
}) {
  const methods = useForm({ defaultValues: values });
  return (
    <FormProvider {...methods}>
      <PreviewCard />
    </FormProvider>
  );
}

function mockStyle(style: 'mirror' | 'poster') {
  mockedUsePersonalization.mockReturnValue({
    addEntryPreviewStyle: style,
  } as unknown as ReturnType<typeof usePersonalization>);
}

beforeEach(() => {
  mockedUsePersonalization.mockReset();
});

describe('PreviewCard', () => {
  it('Mirror: renders title, localized category, and rating value', () => {
    mockStyle('mirror');
    render(<Harness values={{ title: 'Breaking Bad', category: 'Series', rating: 9 }} />);
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText(/сериал/i)).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('Mirror: shows empty-title placeholder when title is blank', () => {
    mockStyle('mirror');
    render(<Harness values={{ title: '', category: 'Movie' }} />);
    expect(screen.getByText(/название записи/i)).toBeInTheDocument();
  });

  it('Mirror: uses image when provided', () => {
    mockStyle('mirror');
    render(
      <Harness
        values={{ title: 'Inception', category: 'Movie', image: 'data:image/png;base64,AAA' }}
      />,
    );
    const img = screen.getByRole('img', { name: /inception/i }) as HTMLImageElement;
    expect(img.src).toContain('data:image/png');
  });

  it('Poster: renders the poster variant with gradient header', () => {
    mockStyle('poster');
    render(<Harness values={{ title: 'Witcher 3', category: 'Game', rating: 10 }} />);
    expect(screen.getByText('Witcher 3')).toBeInTheDocument();
    expect(screen.getByTestId('preview-poster')).toBeInTheDocument();
  });

  it('Mirror: hides rating badge when rating is 0 or missing', () => {
    mockStyle('mirror');
    render(<Harness values={{ title: 'Test', rating: 0 }} />);
    expect(screen.queryByTestId('preview-rating')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/AddMediaModal/PreviewCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `frontend/src/components/AddMediaModal/PreviewCard.tsx`:

```tsx
import { useFormContext } from 'react-hook-form';
import { BookOpen, Film, Gamepad2, Play, Sparkles, Star, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonalization } from '@/hooks/usePersonalization';
import { localizeCategory } from '@/utils/localization';

type Category = 'Movie' | 'Series' | 'Book' | 'Game' | 'Anime' | 'Manga';

const CATEGORY_ICON: Record<Category, typeof Film> = {
  Movie: Film,
  Series: Tv,
  Book: BookOpen,
  Game: Gamepad2,
  Anime: Play,
  Manga: Sparkles,
};

const CATEGORY_ACCENT: Record<Category, string> = {
  Movie: 'var(--accent-blue)',
  Series: 'var(--accent-pink)',
  Book: 'var(--accent-green)',
  Game: 'var(--accent-purple)',
  Anime: 'var(--accent-orange)',
  Manga: 'var(--accent-cyan)',
};

function ratingGradient(rating: number) {
  if (rating >= 8) return 'from-emerald-500 to-green-600';
  if (rating >= 6) return 'from-amber-400 to-yellow-500';
  if (rating >= 4) return 'from-orange-400 to-orange-500';
  return 'from-red-400 to-red-500';
}

interface PreviewValues {
  title: string;
  category: Category | '' | undefined;
  rating: number | undefined;
  image: string | undefined;
}

function useValues(): PreviewValues {
  const { watch } = useFormContext();
  return {
    title: (watch('title') as string | undefined) ?? '',
    category: watch('category') as Category | '' | undefined,
    rating: (watch('rating') as number | undefined) ?? 0,
    image: (watch('image') as string | undefined) ?? undefined,
  };
}

function CoverPlaceholder({ category }: { category: Category | '' | undefined }) {
  const Icon = category ? CATEGORY_ICON[category as Category] : Film;
  const accent = category ? CATEGORY_ACCENT[category as Category] : 'var(--muted-foreground)';
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, #111), color-mix(in oklab, ${accent} 6%, #000))`,
      }}
    >
      <Icon className="h-14 w-14 text-white/35" />
    </div>
  );
}

function MirrorPreview({ values }: { values: PreviewValues }) {
  const { title, category, rating, image } = values;
  const hasRating = typeof rating === 'number' && rating > 0;
  const categoryIcon = category ? CATEGORY_ICON[category as Category] : null;
  const CategoryIcon = categoryIcon;
  const localized = localizeCategory(category || null);

  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-muted/20 to-muted/40 shadow-lg">
      {image ? (
        <>
          <img
            src={image}
            alt={title || 'Preview'}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      ) : (
        <CoverPlaceholder category={category} />
      )}

      {localized && (
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white ring-1 ring-white/10 backdrop-blur-md">
          {CategoryIcon && <CategoryIcon className="h-2.5 w-2.5" />}
          {localized}
        </div>
      )}

      {hasRating && (
        <div
          data-testid="preview-rating"
          className={cn(
            'absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-gradient-to-r px-2 py-1 text-xs font-bold text-white shadow-lg ring-1 ring-white/20',
            ratingGradient(rating ?? 0),
          )}
        >
          <Star className="h-3 w-3 fill-current" />
          <span>{rating}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
        <h3
          className={cn(
            'line-clamp-2 text-sm font-semibold leading-tight drop-shadow-lg',
            title ? 'text-white' : 'text-white/55 italic',
          )}
        >
          {title || 'Название записи'}
        </h3>
      </div>
    </div>
  );
}

function PosterPreview({ values }: { values: PreviewValues }) {
  const { title, category, rating, image } = values;
  const Icon = category ? CATEGORY_ICON[category as Category] : Film;
  const accent = category ? CATEGORY_ACCENT[category as Category] : 'var(--primary)';
  const localized = localizeCategory(category || null);

  return (
    <div
      data-testid="preview-poster"
      className="overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
      style={{
        background: `linear-gradient(180deg, ${accent} 0%, color-mix(in oklab, ${accent} 55%, #000) 100%)`,
      }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-4 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-wide opacity-80">
            {localized || 'Категория'}
          </div>
          <div className="text-sm font-semibold">Новая запись</div>
        </div>
      </div>

      <div className="mx-4 mt-3 aspect-[3/4] overflow-hidden rounded-xl border border-dashed border-white/35 bg-white/10">
        {image ? (
          <img src={image} alt={title || 'Preview'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/45">
            <Icon className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="p-4 text-white">
        <div
          className={cn(
            'text-base font-bold leading-tight',
            title ? 'text-white' : 'text-white/60 italic',
          )}
        >
          {title || 'Название записи'}
        </div>
        {typeof rating === 'number' && rating > 0 && (
          <div className="mt-1 flex items-center gap-1.5 text-xs opacity-90">
            <Star className="h-3.5 w-3.5 fill-current" style={{ color: 'oklch(0.85 0.18 90)' }} />
            <span>{rating}/10</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PreviewCard() {
  const values = useValues();
  const { addEntryPreviewStyle } = usePersonalization();

  return (
    <div className="space-y-2">
      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
        Так будет выглядеть
      </span>
      {addEntryPreviewStyle === 'poster' ? (
        <PosterPreview values={values} />
      ) : (
        <MirrorPreview values={values} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/AddMediaModal/PreviewCard.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AddMediaModal/PreviewCard.tsx frontend/src/components/AddMediaModal/PreviewCard.test.tsx
git commit -m "feat(add-entry): add live PreviewCard with Mirror and Poster variants"
```

---

## Task 5: Integrate CategoryTilePicker and bigger title into InfoStep

**Files:**
- Modify: `frontend/src/components/AddMediaModal/InfoStep.tsx`

- [ ] **Step 1: Replace the category FormSelect with CategoryTilePicker and enlarge the title**

Overwrite `frontend/src/components/AddMediaModal/InfoStep.tsx` with:

```tsx
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormInput, FormSelect, StarRating } from '@/components/Form';
import { CategoryTilePicker } from './CategoryTilePicker';

interface InfoStepProps {
  isSubmitting: boolean;
  groupOptions: { value: string; label: string }[];
  onOpenCreateGroup: () => void;
}

export function InfoStep({
  isSubmitting,
  groupOptions,
  onOpenCreateGroup,
}: InfoStepProps) {
  return (
    <div className="space-y-5">
      <FormInput
        name="title"
        label="Что добавим?"
        placeholder="Название фильма, книги или игры..."
        disabled={isSubmitting}
        className="h-12 text-lg"
      />

      <CategoryTilePicker
        name="category"
        label="Категория"
        disabled={isSubmitting}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">Группа</Label>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={onOpenCreateGroup}
          >
            <Plus className="h-3 w-3 mr-1" />
            Новая
          </Button>
        </div>
        <FormSelect
          name="groupId"
          options={groupOptions}
          placeholder="Без группы"
          disabled={isSubmitting}
        />
      </div>

      <StarRating name="rating" label="Ваша оценка" />
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AddMediaModal/InfoStep.tsx
git commit -m "feat(add-entry): use CategoryTilePicker and larger title on Info step"
```

---

## Task 6: Widen modal to 780px with 2-column layout + PreviewCard

**Files:**
- Modify: `frontend/src/components/AddMediaModal/index.tsx`

- [ ] **Step 1: Restructure DialogContent to 2-column grid and mount PreviewCard**

In `frontend/src/components/AddMediaModal/index.tsx`, update the imports to include `PreviewCard`:

```tsx
import { PreviewCard } from './PreviewCard';
```

Change the `DialogContent` className from `sm:max-w-[600px]` to `sm:max-w-[780px]`:

```tsx
<DialogContent
  className="sm:max-w-[780px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0"
  showCloseButton={false}
>
```

Replace the existing `<ScrollArea ...>` block with a 2-column grid (left: scrollable form, right: sticky preview). Replace this entire block (lines ~130–164 in the current file):

```tsx
<ScrollArea className="flex-1 px-6 py-4">
  <div className="pb-4">
    <FormProvider {...methods}>
      <form ... >
        ...
      </form>
    </FormProvider>
  </div>
</ScrollArea>
```

with:

```tsx
<FormProvider {...methods}>
  <div className="flex-1 grid md:grid-cols-[1fr_260px] gap-0 min-h-0">
    <ScrollArea className="px-6 py-4 min-h-0">
      <div className="pb-4">
        <form
          id="add-media-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {activeStep === 'info' && (
            <InfoStep
              isSubmitting={isSubmitting}
              groupOptions={groupOptions}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            />
          )}
          {activeStep === 'details' && (
            <DetailsStep
              isSubmitting={isSubmitting}
              dateLabels={dateLabels}
            />
          )}
          {activeStep === 'media' && (
            <MediaStep
              isSubmitting={isSubmitting}
              coverMode={coverMode}
              setCoverMode={setCoverMode}
              currentImage={currentImage}
              error={error}
              handleFileUpload={handleFileUpload}
            />
          )}
        </form>
      </div>
    </ScrollArea>

    <aside className="hidden md:block border-l bg-muted/20 px-5 py-4 overflow-y-auto">
      <PreviewCard />
    </aside>
  </div>
</FormProvider>
```

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the existing modal tests (they may need updates in Task 8)**

Run: `cd frontend && npx vitest run src/components/AddMediaModal.test.tsx`
Expected: PASS. If failures reference missing preview/provider, continue to Task 8 — those are fixed there.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AddMediaModal/index.tsx
git commit -m "feat(add-entry): widen modal to 780px and mount live preview column"
```

---

## Task 7: Settings card for preview style

**Files:**
- Modify: `frontend/src/pages/SettingsPage/AppearanceTab.tsx`

- [ ] **Step 1: Add imports and the new settings card**

In `frontend/src/pages/SettingsPage/AppearanceTab.tsx`, extend the imports:

```tsx
import { Eye, Moon, Palette, Save, Sun, Type } from 'lucide-react';
```

Replace the destructured return of `usePersonalization()` to include the new field:

```tsx
const {
  theme,
  toggleTheme,
  background,
  setBackground,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  addEntryPreviewStyle,
  setAddEntryPreviewStyle,
  savePreferences,
} = usePersonalization();
```

Just before the closing `</div>` of the outer `grid`, add a new card:

```tsx
<Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm md:col-span-2">
  <CardHeader>
    <CardTitle className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-1 ring-pink-500/20">
        <Eye className="h-5 w-5" />
      </div>
      Стиль превью записи
    </CardTitle>
    <CardDescription>
      Как будет выглядеть карточка-превью в форме добавления
    </CardDescription>
  </CardHeader>
  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {(['mirror', 'poster'] as const).map((style) => {
      const isActive = addEntryPreviewStyle === style;
      const label = style === 'mirror' ? 'Как в библиотеке' : 'Кинопостер';
      const desc =
        style === 'mirror'
          ? 'Точная копия карточки из библиотеки — видишь ровно то, что получишь'
          : 'Стилизованный постер с градиентом в цвете категории';
      return (
        <button
          key={style}
          type="button"
          onClick={() => setAddEntryPreviewStyle(style)}
          className={`group text-left rounded-xl border p-4 transition-all cursor-pointer ${
            isActive
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/60 hover:border-primary/60 hover:bg-muted/30'
          }`}
          aria-pressed={isActive}
        >
          <div
            className={`mb-3 h-24 rounded-lg ${
              style === 'mirror'
                ? 'bg-gradient-to-br from-muted/60 to-muted/90 ring-1 ring-border/50'
                : 'bg-gradient-to-br from-pink-500/70 to-purple-600/70'
            } flex items-center justify-center`}
          >
            <span
              className={`text-xs font-medium ${
                style === 'mirror' ? 'text-muted-foreground' : 'text-white'
              }`}
            >
              {style === 'mirror' ? 'MediaCard' : 'Poster'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{label}</span>
            {isActive && (
              <span className="text-xs text-primary font-medium">Выбрано</span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </button>
      );
    })}
  </CardContent>
</Card>
```

The new card should live as the last child inside the outermost `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">`. It spans both columns (`md:col-span-2`).

- [ ] **Step 2: Run typecheck**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/SettingsPage/AppearanceTab.tsx
git commit -m "feat(settings): add add-entry preview style picker to AppearanceTab"
```

---

## Task 8: Update AddMediaModal integration tests

**Files:**
- Modify: `frontend/src/components/AddMediaModal.test.tsx`

The existing tests use a bare `render(...)` which doesn't wrap with `PersonalizationProvider`. Since `PreviewCard` reads `usePersonalization`, mock the hook in the test file.

- [ ] **Step 1: Add a default mock for `usePersonalization` at the top of the test file**

Edit `frontend/src/components/AddMediaModal.test.tsx`. Just below the existing `vi.mock('framer-motion', ...)` block, add:

```tsx
vi.mock('@/hooks/usePersonalization', () => ({
  usePersonalization: () => ({ addEntryPreviewStyle: 'mirror' }),
}));
```

- [ ] **Step 2: Add a preview-specific test**

Inside the existing `describe('AddMediaModal', ...)` block, add a new test after the last one:

```tsx
it('renders the live preview updated by the title field', async () => {
  const user = userEvent.setup();
  render(
    <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
  );

  expect(await screen.findByText(/так будет выглядеть/i)).toBeInTheDocument();

  await user.type(screen.getByLabelText(/что добавим/i), 'Inception');
  expect(await screen.findByText('Inception')).toBeInTheDocument();
});
```

- [ ] **Step 3: Update the category-based navigation test if needed**

Since the category field is no longer an `<input>`/`<select>` with `label` "Категория" (it's now tile buttons), any assertion using `findByLabelText(/категория/i)` must change. Update the "renders form fields on first step" test:

```tsx
it('should render form fields on first step when open', async () => {
  render(
    <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
  );

  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(await screen.findByLabelText(/что добавим/i)).toBeInTheDocument();
  expect(await screen.findByText('Категория', { selector: 'label' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /фильм/i })).toBeInTheDocument();
  expect(await screen.findByText('Ваша оценка', { selector: 'label' })).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the suite**

Run: `cd frontend && npx vitest run src/components/AddMediaModal.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Run full frontend test suite**

Run: `cd frontend && npm run test:ci`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/AddMediaModal.test.tsx
git commit -m "test(add-entry): cover new category tiles and live preview"
```

---

## Task 9: Visual verification + smoke e2e

No new code — a human-in-the-loop check with the running dev server plus a quick Playwright smoke.

- [ ] **Step 1: Confirm dev server is up at `http://localhost:5005` (already running). Open the app, open the add-entry modal, and walk through the golden path:**
  - Step "Инфо": type a title, click each of the 6 category tiles — preview label and icon update, accent color changes.
  - Pick a rating — rating badge appears on preview.
  - Go to "Детали": preview still visible.
  - Go to "Медиа": upload a file — preview shows the image.
  - Submit — entry appears in the library with the same visuals as the preview promised.

- [ ] **Step 2: Visit `/settings` → Appearance tab, click the "Кинопостер" tile. Reopen the add-entry modal and confirm the preview now uses the Poster variant. Click "Сохранить настройки" so the preference persists across reloads.**

- [ ] **Step 3: Run Playwright media spec as a smoke check**

Run: `cd frontend && npx playwright test e2e/media.spec.ts --project=chromium`
Expected: PASS. If it fails due to the category selection flow (the spec may click a `<select>`), update the spec selectors to the new tile buttons — use `page.getByRole('button', { name: 'Фильм' }).click()` in place of the dropdown.

- [ ] **Step 4: Final commit (if any tweaks were made)**

```bash
git add -A
git commit -m "chore(add-entry): e2e fixes and visual QA tweaks"
```

If no tweaks needed, skip this commit.
