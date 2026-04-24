import { useRef } from 'react';
import { Image as ImageIcon, Maximize2, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MediaEntry } from '@/api/media';

interface MediaGalleryProps {
  media: MediaEntry;
  onUpload: (file: File) => void;
  onDeleteFile: (fileId: number) => void;
  onOpenLightbox: (index: number) => void;
}

export function MediaGallery({
  media,
  onUpload,
  onDeleteFile,
  onOpenLightbox,
}: MediaGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2 select-none">
        <ImageIcon className="h-5 w-5 text-primary" />
        Галерея
        {media.files && media.files.length > 0 && (
          <span className="text-muted-foreground font-normal text-sm">
            ({media.files.length})
          </span>
        )}
      </h2>
      <Input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!media.files || media.files.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed border-muted hover:border-primary/40 transition-colors py-12 flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-3 rounded-full bg-muted mb-3">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1 select-none">
            Добавить медиа
          </p>
          <p className="text-sm text-muted-foreground select-none">
            Скриншоты, арты или видео
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.files.map((file, index) => (
            <div
              key={file.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer ring-1 ring-border/50 hover:ring-primary/50 transition-all"
              onClick={() =>
                onOpenLightbox(media.image ? index + 1 : index)
              }
            >
              {file.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={file.url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="p-2 rounded-full bg-white/90">
                      <Play className="h-4 w-4 text-black fill-black" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={file.url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                  draggable={false}
                />
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full cursor-pointer"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 rounded-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div
            className="aspect-square rounded-lg border-2 border-dashed border-muted hover:border-primary/40 transition-colors flex flex-col items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1 select-none">
              Добавить
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
