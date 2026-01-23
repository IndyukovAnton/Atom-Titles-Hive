import type { MediaEntry } from '../../api/media';
import { MediaCard } from './MediaCard';
import { Loader2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MediaGridProps {
  mediaList: MediaEntry[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAddMedia: () => void;
}

export const MediaGrid = ({ mediaList, isLoading, error, onRefresh, onAddMedia }: MediaGridProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-destructive">
        <p className="mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline">Попробовать снова</Button>
      </div>
    );
  }

  if (mediaList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground space-y-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-4xl">
          📭
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg text-foreground">Список пуст</h3>
          <p>В этой категории пока нет записей</p>
        </div>
        <Button onClick={onAddMedia}>
          <Plus className="mr-2 h-4 w-4" /> Добавить запись
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
      {mediaList.map(media => (
        <MediaCard key={media.id} media={media} />
      ))}
    </div>
  );
};
