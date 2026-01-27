import { useEffect, useState } from 'react';
import { useCoverSearch } from '@/hooks/useCoverSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  Search,
  Pin,
  PinOff,
  Image as ImageIcon,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverImagePickerProps {
  initialQuery: string;
  onSelect: (base64: string) => void;
  className?: string;
}

export function CoverImagePicker({
  initialQuery,
  onSelect,
  className,
}: CoverImagePickerProps) {
  const {
    query,
    setQuery,
    results,
    loading,
    downloading,
    error,
    hasMore,
    loadMore,
    handleSelect,
    pinnedImages,
    togglePin,
  } = useCoverSearch({ initialQuery, onSelect });

  // Track loading state of each image
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [imageErrorStates, setImageErrorStates] = useState<
    Record<string, boolean>
  >({});
  const [retryKeys, setRetryKeys] = useState<Record<string, number>>({});

  // Update query when initialQuery changes
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Reset loading states when results change
  useEffect(() => {
    const newStates: Record<string, boolean> = {};
    results.forEach((img) => {
      newStates[img.id] = true; // Mark as loading
    });
    setImageLoadingStates(newStates);
    setImageErrorStates({});
  }, [results]);

  // Add timeout for image loading (5 seconds)
  useEffect(() => {
    const timers: number[] = [];

    results.forEach((img) => {
      if (imageLoadingStates[img.id]) {
        const timer = setTimeout(() => {
          // If still loading after 5s, mark as error
          setImageLoadingStates((prev) => ({ ...prev, [img.id]: false }));
          setImageErrorStates((prev) => ({ ...prev, [img.id]: true }));
        }, 5000); // 5 seconds timeout

        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [results, imageLoadingStates]);

  const handleImageLoad = (imageId: string) => {
    setImageLoadingStates((prev) => ({ ...prev, [imageId]: false }));
    setImageErrorStates((prev) => ({ ...prev, [imageId]: false }));
  };

  const handleImageError = (imageId: string) => {
    setImageErrorStates((prev) => ({ ...prev, [imageId]: true }));
    setImageLoadingStates((prev) => ({ ...prev, [imageId]: false }));
  };

  const handleRetry = (imageId: string) => {
    // Force image reload by changing key
    setRetryKeys((prev) => ({ ...prev, [imageId]: (prev[imageId] || 0) + 1 }));
    setImageLoadingStates((prev) => ({ ...prev, [imageId]: true }));
    setImageErrorStates((prev) => ({ ...prev, [imageId]: false }));
  };

  // Show only 4 images
  const displayedImages = results.slice(0, 4);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск обложки..."
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-[300px] max-h-[500px]">
        <div className="pr-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : displayedImages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
              <p>Нет изображений по запросу "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-4">
              {displayedImages.map((image) => {
                const isPinned = pinnedImages.some((p) => p.id === image.id);
                const isImageLoading = imageLoadingStates[image.id];
                const hasError = imageErrorStates[image.id];

                return (
                  <div
                    key={image.id}
                    className={cn(
                      'relative aspect-[2/3] group rounded-lg overflow-hidden border bg-background transition-all',
                      isPinned
                        ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20'
                        : 'hover:border-primary/50',
                    )}
                  >
                    {isImageLoading && (
                      <Skeleton className="absolute inset-0 w-full h-full" />
                    )}

                    {hasError ? (
                      <div className="absolute inset-0 w-full h-full bg-muted flex flex-col items-center justify-center gap-2 p-4">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(image.id)}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Повторить
                        </Button>
                      </div>
                    ) : (
                      <img
                        key={`${image.id}-${retryKeys[image.id] || 0}`}
                        src={image.thumbnail}
                        alt="Cover"
                        className={cn(
                          'w-full h-full object-cover transition-opacity',
                          isImageLoading ? 'opacity-0' : 'opacity-100',
                        )}
                        loading="lazy"
                        onLoad={() => handleImageLoad(image.id)}
                        onError={() => handleImageError(image.id)}
                      />
                    )}

                    {/* Pin badge for pinned images */}
                    {isPinned && !isImageLoading && !hasError && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <Pin className="h-3 w-3 fill-current" />
                        Закреплено
                      </div>
                    )}

                    {/* Actions Overlay */}
                    {!isImageLoading && !hasError && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <div className="absolute top-2 right-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full shadow-sm bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePin(image);
                            }}
                          >
                            {isPinned ? (
                              <PinOff className="h-4 w-4 text-primary" />
                            ) : (
                              <Pin className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>

                        <Button
                          type="button"
                          onClick={() => handleSelect(image)}
                          disabled={!!downloading}
                          size="sm"
                          className="w-full max-w-[100px] cursor-pointer"
                        >
                          {downloading === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>Выбрать</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More / Loading State */}
          {results.length > 0 && (
            <div className="pb-4 flex justify-center w-full">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Загрузка...</span>
                </div>
              ) : hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadMore}
                  className="w-full"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Далее
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
