import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mediaApi, type MediaEntry } from '../api/media';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";


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

} from 'lucide-react';

import AddMediaModal from '@/components/AddMediaModal';
import PhotoViewer from '@/components/PhotoViewer';
import { localizeCategory, localizeGenre, localizeTag } from '@/utils/localization';

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
      console.error(err);
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
        alert("Файл слишком большой (макс 10MB)");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            await mediaApi.addFile(media.id, {
                url: reader.result as string,
                type: file.type.startsWith('video') ? 'video' : 'image'
            });
            fetchMedia();
        } catch (e) {
            console.error(e);
            alert("Не удалось загрузить файл");
        }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = async (fileId: number) => {
      if(!confirm("Удалить этот файл?")) return;
      try {
          await mediaApi.removeFile(fileId);
          fetchMedia();
      } catch(e) {
          console.error(e);
          alert("Не удалось удалить файл");
      }
  }

  const handleDeleteRecord = async () => {
    if (!media || !confirm('Вы уверены, что хотите удалить эту запись?')) return;
    try {
      await mediaApi.delete(media.id);
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Не удалось удалить запись');
    }
  };



  // ... (inside component)

  const getCategoryIcon = (categoryRaw?: string | null) => {

    // We can use the localized string for matching if we want, OR better, map based on the original raw value if possible to keep icon logic stable.
    // However, the function receives the *value* from media.category. 
    // Let's check existing usage. It was `switch(category) { case 'Movie': ... }`
    // So we should pass the RAW category to getCategoryIcon, but display the LOCALIZED category.
    
    // Actually, let's keep getCategoryIcon logic on raw values (English) as they are likely stable keys.
    switch(categoryRaw) {
      case 'Movie': return <Film className="w-4 h-4" />;
      case 'Series': return <Tv className="w-4 h-4" />;
      case 'Anime': return <Play className="w-4 h-4" />;
      case 'Game': return <Gamepad2 className="w-4 h-4" />;
      case 'Book':
      case 'Manga': return <BookOpen className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (error || !media) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-red-500 font-medium">{error || 'Запись не найдена'}</p>
            <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> На главную
            </Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
        {/* Ambient Background */}
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/5 via-background/80 to-background -z-10" />

        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
            {/* Back Button */}
            <Button 
                variant="ghost" 
                className="group text-muted-foreground hover:text-primary transition-colors pl-0 hover:bg-transparent"
                onClick={() => navigate(-1)}
            >
                <div className="p-2 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors mr-2">
                    <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-medium">Назад</span>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                {/* Left Column: Poster & Actions */}
                <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-2xl ring-1 ring-border/5"
                    >
                        {media.image ? (
                            <img 
                                src={media.image} 
                                alt={media.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/30">
                                <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                                <span className="text-sm font-medium opacity-50">Нет обложки</span>
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {media.rating > 0 && (
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-sm font-bold border border-white/10 flex items-center gap-1.5 shadow-lg">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                {media.rating}
                            </div>
                        )}
                    </motion.div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            className="w-full h-12 rounded-xl text-base font-medium shadow-lg hover:shadow-primary/25 transition-all" 
                            onClick={() => setIsEditOpen(true)}
                        >
                            <Edit2 className="mr-2 h-4 w-4" /> Редактировать
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="w-full h-12 rounded-xl text-base font-medium shadow-lg hover:shadow-red-500/25 transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-none"
                            onClick={handleDeleteRecord}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Удалить
                        </Button>
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="lg:col-span-2 space-y-8 md:py-2">

                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {media.category && (
                            <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium rounded-lg gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">
                                {getCategoryIcon(media.category)}
                                {localizeCategory(media.category)}
                            </Badge>
                        )}
                        {media.startDate && (
                            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium rounded-lg border-muted-foreground/20 text-muted-foreground">
                                {new Date(media.startDate).getFullYear()}
                            </Badge>
                        )}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
                        {media.title}
                    </h1>
                </div>

                {/* Genres */}
                {media.genres && media.genres.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Layers className="h-4 w-4" /> Жанры
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {media.genres.map((genre) => (
                                <Badge 
                                    key={genre} 
                                    variant="secondary" 
                                    className="px-4 py-2 text-sm rounded-xl transition-all hover:scale-105 cursor-default bg-secondary/50 hover:bg-secondary backdrop-blur-sm"
                                >
                                    {localizeGenre(genre)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        О тайтле
                    </h3>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
                            {media.description || <span className="text-muted-foreground italic">Описание отсутствует...</span>}
                        </p>
                    </div>
                </div>

                {/* Tags */}
                {media.tags && media.tags.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Hash className="h-4 w-4" /> Теги
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {media.tags.map((tag) => (
                                <div key={tag} className="px-3 py-1 rounded-lg border border-border/60 bg-background/50 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-default">
                                    #{localizeTag(tag)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}





                {/* Gallery Section - Redesigned */}
                <div className="space-y-6 pt-6">
                    <div className="flex items-center justify-between">
                         <h3 className="text-xl font-bold flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            Галерея и Материалы
                            <span className="text-muted-foreground text-sm font-normal ml-2">
                                {media.files?.length || 0}
                            </span>
                        </h3>
                        <div className="flex gap-2">
                            <Input 
                                type="file" 
                                accept="image/*,video/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="hidden sm:flex"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Добавить
                            </Button>
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="sm:hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {(!media.files || media.files.length === 0) ? (
                        <div className="rounded-3xl border-2 border-dashed border-muted-foreground/10 bg-muted/5 py-12 flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/10">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Нет медиафайлов</p>
                            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">Добавьте скриншоты, арты или видеоролики для коллекции</p>
                            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                Загрузить первое фото
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {media.files.map((file, index) => (
                                <motion.div 
                                    key={file.id} 
                                    layoutId={`media-card-${file.id}`}
                                    className="group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-border/5"
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    {file.type === 'video' ? (
                                        <div className="relative w-full h-full">
                                            <video src={file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="p-3 rounded-full bg-black/50 text-white backdrop-blur-sm">
                                                    <Play className="h-6 w-6 fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img 
                                            src={file.url} 
                                            alt="" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-white/20 hover:text-white rounded-full">
                                            <Maximize2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 text-white hover:bg-red-500/80 hover:text-white rounded-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFile(file.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
      </div>

      <AddMediaModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        onSuccess={handleEditSuccess}
        initialData={media}
      />

      <PhotoViewer 
        files={media.files || []} 
        currentIndex={lightboxIndex} 
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
