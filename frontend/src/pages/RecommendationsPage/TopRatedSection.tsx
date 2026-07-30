import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { recommendationsApi } from '@/api/recommendations';
import {
  RecommendationsGrid,
  RecommendationsGridSkeleton,
} from './RecommendationsGrid';
import { RecommendationsError } from './RecommendationsError';

export function TopRatedSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recommendations', 'top-rated'],
    queryFn: () => recommendationsApi.getTopRated(10),
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
        <Star className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Пока нет оценённых названий</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Оценивайте просмотренное в библиотеке — здесь появятся названия с
          наивысшими оценками.
        </p>
      </div>
    );
  }

  return <RecommendationsGrid items={data} />;
}
