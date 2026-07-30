import { X } from 'lucide-react';
import type { ClaudeMoodTag } from '@/api/recommendations';
import { Button } from '@/components/ui/button';

interface MoodOption {
  value: ClaudeMoodTag;
  label: string;
}

const MOODS: MoodOption[] = [
  { value: 'light', label: 'Весёлое' },
  { value: 'cozy', label: 'Уютное' },
  { value: 'sad', label: 'Грустное' },
  { value: 'energetic', label: 'Боевое' },
  { value: 'thoughtful', label: 'Подумать' },
  { value: 'thrilling', label: 'Адреналин' },
  { value: 'romantic', label: 'Романтика' },
  { value: 'escapist', label: 'Эскапизм' },
];

export interface MoodPickerProps {
  value: ClaudeMoodTag | null;
  onChange: (value: ClaudeMoodTag | null) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">
          Настроение{' '}
          <span className="text-muted-foreground font-normal text-xs">
            (опционально)
          </span>
        </label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => onChange(null)}
          >
            <X className="w-3 h-3 mr-1" />
            сбросить
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MOODS.map((mood) => {
          const selected = value === mood.value;
          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => onChange(selected ? null : mood.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                selected
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  : 'border-border bg-background/60 text-muted-foreground hover:bg-muted/40 hover:border-indigo-500/40'
              }`}
            >
              {mood.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
