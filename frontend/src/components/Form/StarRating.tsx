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
}

export function StarRating({ name, label, max = 10, disabled }: StarRatingProps) {
  const { control } = useFormContext();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                className={cn(
                  "relative p-1 transition-all duration-200 transform hover:scale-125 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                  (hovered || field.value) >= rating ? "text-yellow-400" : "text-muted-foreground/30"
                )}
                onMouseEnter={() => !disabled && setHovered(rating)}
                onMouseLeave={() => !disabled && setHovered(null)}
                onClick={() => !disabled && field.onChange(rating)}
                disabled={disabled}
              >
                <Star
                  className={cn(
                    "w-6 h-6",
                    (hovered || field.value) >= rating ? "fill-current" : "fill-transparent"
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold tabular-nums">
              {field.value || 0} / {max}
            </span>
          </div>
        )}
      />
    </div>
  );
}
