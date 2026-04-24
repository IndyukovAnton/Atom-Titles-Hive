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
