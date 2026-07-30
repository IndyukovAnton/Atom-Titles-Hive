import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiSourceBadgeProps {
  className?: string;
}

/** Маркер записи, добавленной из ИИ-рекомендаций */
export function AiSourceBadge({ className }: AiSourceBadgeProps) {
  return (
    <span
      title="Добавлено из ИИ-рекомендаций"
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-1 text-[10px] font-semibold text-white shadow-lg ring-1 ring-white/20 select-none',
        className,
      )}
    >
      <Sparkles className="w-2.5 h-2.5" />
      ИИ
    </span>
  );
}
