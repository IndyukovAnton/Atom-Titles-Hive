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
