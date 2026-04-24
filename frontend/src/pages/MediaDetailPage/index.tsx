import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hash, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';

import AddMediaModal from '@/components/AddMediaModal';
import PhotoViewer from '@/components/PhotoViewer';
import {
  localizeCategory,
  localizeGenre,
  localizeTag,
} from '@/utils/localization';

import { useMediaDetail } from './useMediaDetail';
import { getCategoryIcon } from './mediaHelpers';
import { MediaDetailPoster } from './MediaDetailPoster';
import { MediaGallery } from './MediaGallery';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const {
    media,
    isLoading,
    error,
    refresh,
    uploadFile,
    deleteFile,
    deleteRecord,
  } = useMediaDetail(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-muted rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="p-6 rounded-full bg-destructive/10">
          <Trash2 className="h-12 w-12 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground mb-2">
            Ошибка загрузки
          </p>
          <p className="text-muted-foreground">
            {error || 'Запись не найдена'}
          </p>
        </div>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> На главную
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-accent-purple/5 blur-3xl" />
        </div>

        <header className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl">
          <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Назад</span>
            </Button>
          </div>
        </header>

        <main className="container max-w-7xl mx-auto px-4 py-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 lg:gap-12"
          >
            <MediaDetailPoster
              media={media}
              onOpenLightbox={() => setLightboxIndex(0)}
              onEdit={() => setIsEditOpen(true)}
              onDelete={deleteRecord}
            />

            <motion.div variants={itemVariants} className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4 lg:hidden select-none">
                  {media.category && (
                    <Badge variant="secondary" className="gap-1.5">
                      {getCategoryIcon(media.category)}
                      {localizeCategory(media.category)}
                    </Badge>
                  )}
                  {media.startDate && (
                    <Badge variant="outline">
                      {new Date(media.startDate).getFullYear()}
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  {media.title}
                </h1>

                {media.genres && media.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 select-none">
                    {media.genres.map((genre) => (
                      <Badge key={genre} variant="outline" className="px-3 py-1">
                        {localizeGenre(genre)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  О тайтле
                </h2>
                <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line">
                  {media.description || (
                    <span className="text-muted-foreground italic">
                      Описание отсутствует...
                    </span>
                  )}
                </p>
              </div>

              {media.tags && media.tags.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 select-none">
                    <Hash className="h-4 w-4" /> Теги
                  </h2>
                  <div className="flex flex-wrap gap-2 select-none">
                    {media.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                      >
                        #{localizeTag(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <MediaGallery
                media={media}
                onUpload={uploadFile}
                onDeleteFile={deleteFile}
                onOpenLightbox={setLightboxIndex}
              />
            </motion.div>
          </motion.div>
        </main>

        <AddMediaModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={refresh}
          initialData={media}
        />

        <PhotoViewer
          files={[
            ...(media.image
              ? [{ id: -1, url: media.image, type: 'image' as const }]
              : []),
            ...(media.files || []),
          ]}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      </div>
    </TooltipProvider>
  );
}
