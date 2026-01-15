import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BackgroundOption {
  id: string;
  name: string;
  preview: string;
  className: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'default',
    name: 'По умолчанию',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    className: 'bg-gradient-to-br from-purple-600 to-purple-900',
  },
  {
    id: 'liquid-ether',
    name: 'Liquid Ether',
    preview: 'linear-gradient(135deg, #00d2ff 0%, #3a47d5 100%)',
    className: 'bg-gradient-to-br from-cyan-500 to-blue-800',
  },
  {
    id: 'light-pillar',
    name: 'Light Pillar',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    className: 'bg-gradient-to-br from-pink-400 to-red-500',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    className: 'bg-gradient-to-br from-blue-400 to-cyan-400',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    className: 'bg-gradient-to-br from-pink-500 to-yellow-400',
  },
  {
    id: 'forest',
    name: 'Forest',
    preview: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    className: 'bg-gradient-to-br from-green-700 to-emerald-500',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    className: 'bg-gradient-to-br from-slate-800 to-blue-700',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    preview: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    className: 'bg-gradient-to-br from-purple-700 to-indigo-900',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    className: 'bg-gradient-to-br from-blue-700 to-cyan-300',
  },
  {
    id: 'passion',
    name: 'Passion',
    preview: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
    className: 'bg-gradient-to-br from-pink-600 to-orange-500',
  },
];

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
