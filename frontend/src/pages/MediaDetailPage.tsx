import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mediaApi, type MediaEntry } from '../api/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Hash,
  Layers,
  Edit2,
  Plus,
  Trash2,
  Maximize2,
  Play,
  Image as ImageIcon,
  BookOpen,
  Gamepad2,
  Tv,
  Film,
  Calendar,
} from 'lucide-react';

import AddMediaModal from '@/components/AddMediaModal';
import { logger } from '@/utils/logger';
import PhotoViewer from '@/components/PhotoViewer';
import {
  localizeCategory,
  localizeGenre,
  localizeTag,
} from '@/utils/localization';

// Упрощённые анимации для производительности
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
  const [media, setMedia] = useState<MediaEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await mediaApi.getOne(Number(id));
      setMedia(data);
    } catch (err) {
      setError('Не удалось загрузить информацию о записи');
      logger.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleEditSuccess = () => {
    fetchMedia();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !media) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой (макс 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await mediaApi.addFile(media.id, {
          url: reader.result as string,
          type: file.type.startsWith('video') ? 'video' : 'image',
        });
        fetchMedia();
      } catch (e) {
        logger.error(e);
        alert('Не удалось загрузить файл');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Удалить этот файл?')) return;
    try {
      await mediaApi.removeFile(fileId);
      fetchMedia();
    } catch (e) {
      logger.error(e);
      alert('Не удалось удалить файл');
    }
  };

  const handleDeleteRecord = async () => {
    if (!media || !confirm('Вы уверены, что хотите удалить эту запись?'))
      return;
    try {
      await mediaApi.delete(media.id);
      navigate('/');
    } catch (e) {
      logger.error(e);
      alert('Не удалось удалить запись');
    }
  };

  const getCategoryIcon = (categoryRaw?: string | null) => {
    switch (categoryRaw) {
      case 'Movie':
        return <Film className="w-4 h-4" />;
      case 'Series':
        return <Tv className="w-4 h-4" />;
      case 'Anime':
        return <Play className="w-4 h-4" />;
      case 'Game':
        return <Gamepad2 className="w-4 h-4" />;
      case 'Book':
      case 'Manga':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'from-green-500 to-emerald-600';
    if (rating >= 6) return 'from-yellow-500 to-amber-600';
    if (rating >= 4) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-600';
  };

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
        {/* Декоративный градиентный фон */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-accent-purple/5 blur-3xl" />
        </div>

        {/* Header */}
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
            {/* Left Column: Poster */}
            <motion.div
              variants={itemVariants}
              className="space-y-6 select-none"
            >
              {/* Постер */}
              <div
                className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted cursor-pointer shadow-2xl ring-1 ring-white/10 group"
                onClick={() => media.image && setLightboxIndex(0)}
              >
                {media.image ? (
                  <>
                    <img
                      src={media.image}
                      alt={media.title}
                      className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                      draggable={false}
                    />
                    {/* Overlay при hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                      <div className="p-3 rounded-full bg-white/90 shadow-lg">
                        <Maximize2 className="h-6 w-6 text-black" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-30 mb-2" />
                    <span className="text-sm opacity-50">Нет обложки</span>
                  </div>
                )}

                {/* Rating Badge */}
                {media.rating > 0 && (
                  <div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-gradient-to-br ${getRatingColor(media.rating)} text-white font-bold flex items-center gap-1.5 shadow-lg`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    {media.rating}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsEditOpen(true)}
                  className="flex-1 gap-2 cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" />
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDeleteRecord}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Info Cards - Desktop */}
              <div className="hidden lg:grid grid-cols-2 gap-3">
                {media.category && (
                  <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-2 text-center">
                      <div className="mb-2 flex justify-center">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getCategoryIcon(media.category)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Категория
                      </p>
                      <p className="font-semibold text-sm">
                        {localizeCategory(media.category)}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {media.startDate && (
                  <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-2 text-center">
                      <div className="mb-2 flex justify-center">
                        <div className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple">
                          <Calendar className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Год</p>
                      <p className="font-semibold text-sm">
                        {new Date(media.startDate).getFullYear()}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>

            {/* Right Column: Content */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Title Section */}
              <div>
                {/* Mobile Quick Info */}
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

                {/* Genres */}
                {media.genres && media.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 select-none">
                    {media.genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="px-3 py-1"
                      >
                        {localizeGenre(genre)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Description */}
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

              {/* Tags */}
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

              {/* Gallery Section */}
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
                  onChange={handleFileUpload}
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
                          setLightboxIndex(media.image ? index + 1 : index)
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

                        {/* Hover overlay */}
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
                              handleDeleteFile(file.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add More Button */}
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
            </motion.div>
          </motion.div>
        </main>

        <AddMediaModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={handleEditSuccess}
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
