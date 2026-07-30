import { useQuery } from '@tanstack/react-query';
import { Library } from 'lucide-react';
import { recommendationsApi } from '@/api/recommendations';
import type { RecommendationItem } from '@/api/recommendations';
import {
  RecommendationsGrid,
  RecommendationsGridSkeleton,
} from './RecommendationsGrid';
import { RecommendationsError } from './RecommendationsError';

interface GenresSectionProps {
  onAdd: (item: RecommendationItem) => void;
}

export function GenresSection({ onAdd }: GenresSectionProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recommendations', 'genres'],
    queryFn: () => recommendationsApi.getByGenres(),
  });

  if (isLoading) {
    return <RecommendationsGridSkeleton />;
  }

  if (isError) {
    return <RecommendationsError />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
        <Library className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Нужно больше данных</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Добавляйте названия в библиотеку, оценивайте их и указывайте жанры —
          так мы сможем проанализировать ваши любимые жанры.
        </p>
      </div>
    );
  }

  return <RecommendationsGrid items={data} onAdd={onAdd} />;
}
