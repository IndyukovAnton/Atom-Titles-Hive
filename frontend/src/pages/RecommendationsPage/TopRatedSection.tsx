import { useQuery } from '@tanstack/react-query';
import { Library } from 'lucide-react';
import { recommendationsApi } from '@/api/recommendations';
import type { RecommendationItem } from '@/api/recommendations';
import {
  RecommendationsGrid,
  RecommendationsGridSkeleton,
} from './RecommendationsGrid';

interface TopRatedSectionProps {
  onAdd: (item: RecommendationItem) => void;
}

export function TopRatedSection({ onAdd }: TopRatedSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', 'top-rated'],
    queryFn: () => recommendationsApi.getTopRated(10),
  });

  if (isLoading) {
    return <RecommendationsGridSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
        <Library className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No titles found</h3>
        <p className="text-muted-foreground">
          Add some titles to your library to see top rated ones here.
        </p>
      </div>
    );
  }

  return <RecommendationsGrid items={data} type="internal" onAdd={onAdd} />;
}
