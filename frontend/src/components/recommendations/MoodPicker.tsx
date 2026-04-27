import { X } from 'lucide-react';
import type { ClaudeMoodTag } from '@/api/recommendations';
import { Button } from '@/components/ui/button';

interface MoodOption {
  value: ClaudeMoodTag;
  emoji: string;
  label: string;
}

const MOODS: MoodOption[] = [
  { value: 'light', emoji: '😄', label: 'Весёлое' },
  { value: 'cozy', emoji: '😴', label: 'Уютное' },
  { value: 'sad', emoji: '😢', label: 'Грустное' },
  { value: 'energetic', emoji: '⚡', label: 'Боевое' },
  { value: 'thoughtful', emoji: '🤔', label: 'Подумать' },
  { value: 'thrilling', emoji: '😱', label: 'Адреналин' },
  { value: 'romantic', emoji: '💕', label: 'Романтика' },
  { value: 'escapist', emoji: '🌌', label: 'Эскапизм' },
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
      <div className="grid grid-cols-4 gap-1.5">
        {MOODS.map((mood) => {
          const selected = value === mood.value;
          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => onChange(selected ? null : mood.value)}
              title={mood.label}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-[10px] font-medium transition-all ${
                selected
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-indigo-700 dark:text-indigo-300 shadow-md scale-[1.02]'
                  : 'border-border bg-background/60 hover:border-indigo-500/40 hover:bg-indigo-500/5'
              }`}
            >
              <span className="text-lg leading-none">{mood.emoji}</span>
              <span className="leading-tight truncate w-full text-center">
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
