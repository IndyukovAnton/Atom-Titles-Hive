import { useQuery } from '@tanstack/react-query';
import { Library } from 'lucide-react';
import { recommendationsApi } from '@/api/recommendations';
import type { RecommendationItem } from '@/api/recommendations';
import {
  RecommendationsGrid,
  RecommendationsGridSkeleton,
} from './RecommendationsGrid';

interface GenresSectionProps {
  onAdd: (item: RecommendationItem) => void;
}

export function GenresSection({ onAdd }: GenresSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', 'genres'],
    queryFn: () => recommendationsApi.getByGenres(),
  });

  if (isLoading) {
    return <RecommendationsGridSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
        <Library className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Need more data</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Add titles to your library and rate them to help us analyse your
          favorite genres.
        </p>
      </div>
    );
  }

  return (
    <RecommendationsGrid items={data || []} type="external" onAdd={onAdd} />
  );
}
