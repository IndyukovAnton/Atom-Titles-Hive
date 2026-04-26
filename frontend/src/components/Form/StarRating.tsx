import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';

interface StarRatingProps {
  name: string;
  label?: string;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function StarRating({
  name,
  label,
  max = 10,
  disabled,
  className,
}: StarRatingProps) {
  const { control } = useFormContext();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-base font-semibold text-foreground">
          {label}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex w-full items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10">
            <div className="flex items-center gap-0.5 flex-wrap">
              {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={cn(
                    'relative p-0.5 transition-all duration-150 transform hover:scale-110 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-sm cursor-pointer',
                    (hovered || field.value) >= rating
                      ? 'text-yellow-500'
                      : 'text-muted-foreground/20',
                  )}
                  onMouseEnter={() => !disabled && setHovered(rating)}
                  onMouseLeave={() => !disabled && setHovered(null)}
                  onClick={() => !disabled && field.onChange(rating)}
                  disabled={disabled}
                >
                  <Star
                    className={cn(
                      'w-5 h-5 transition-all',
                      (hovered || field.value) >= rating
                        ? 'fill-current drop-shadow-sm'
                        : 'fill-transparent',
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="shrink-0 text-base font-bold tabular-nums text-foreground">
              {field.value || 0}{' '}
              <span className="text-muted-foreground font-normal">/ {max}</span>
            </span>
          </div>
        )}
      />
    </div>
  );
}
