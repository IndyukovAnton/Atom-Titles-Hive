import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import { BACKGROUND_OPTIONS } from '@/constants/personalization';

interface BackgroundSelectorProps {
  value: string;
  onChange: (backgroundId: string) => void;
}

export function BackgroundSelector({ value, onChange }: BackgroundSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {BACKGROUND_OPTIONS.map((option, index) => (
        <motion.button
          key={option.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onChange(option.id)}
          className={cn(
            'group relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300',
            value === option.id
              ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
              : 'border-border hover:border-primary/50 hover:scale-105'
          )}
          type="button"
        >
          <div
            className="absolute inset-0"
            style={{ background: option.preview }}
          />
          <div
            className={cn(
              'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity',
              value === option.id
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            )}
          >
            {value === option.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-xs font-medium text-white truncate">{option.name}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
