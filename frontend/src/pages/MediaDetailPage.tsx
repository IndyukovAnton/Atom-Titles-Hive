import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mediaApi, type MediaEntry } from '../api/media';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  FileText, 
  Tag, 
  Layers, 
  Edit2, 
  Plus, 
  Trash2, 
  Maximize2 
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import AddMediaModal from '@/components/AddMediaModal';

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
        alert("File too large (max 10MB)");
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
            alert("Failed to upload file");
        }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = async (fileId: number) => {
      if(!confirm("Delete this file?")) return;
      try {
          await mediaApi.removeFile(fileId);
          fetchMedia();
      } catch(e) {
          console.error(e);
          alert("Failed to delete file");
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

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-10 px-4 mx-auto animate-in fade-in">
        <Button variant="ghost" className="mb-6" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
        <div className="grid md:grid-cols-[300px_1fr] gap-8">
           <Skeleton className="h-[450px] w-full rounded-xl" />
           <div className="space-y-4">
             <Skeleton className="h-10 w-2/3" />
             <div className="flex gap-2">
               <Skeleton className="h-6 w-20" />
               <Skeleton className="h-6 w-20" />
             </div>
             <Skeleton className="h-40 w-full" />
           </div>
        </div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Ошибка</h2>
        <p className="text-muted-foreground">{error || 'Запись не найдена'}</p>
        <Button onClick={() => navigate(-1)}>Вернуться назад</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 px-4 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <Button 
            variant="ghost" 
            className="hover:bg-muted/50 transition-colors"
            onClick={() => navigate(-1)}
        >
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Редактировать
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDeleteRecord}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
         <TabsList className="mb-6">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="album">Альбом ({media.files?.length || 0})</TabsTrigger>
         </TabsList>

         <TabsContent value="overview" className="mt-0">
            <div className="grid md:grid-cols-[350px_1fr] gap-8 items-start">
                {/* Cover Image */}
                <div className="relative group rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/50 bg-muted">
                {media.image ? (
                    <img 
                    src={media.image} 
                    alt={media.title} 
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="aspect-[2/3] flex items-center justify-center text-muted-foreground bg-secondary/50">
                    Нет изображения
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-lg flex items-center shadow-lg border border-white/10">
                    <Star className="h-4 w-4 text-yellow-500 mr-1.5 fill-yellow-500" />
                    {media.rating}/10
                </div>
                </div>

                {/* Details */}
                <div className="space-y-8">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                    {media.category && (
                        <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        {media.category}
                        </Badge>
                    )}
                    {media.startDate && (
                        <Badge variant="outline" className="text-muted-foreground">
                        {new Date(media.startDate).getFullYear()}
                        </Badge>
                    )}
                    </div>
                    
                    <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
                    {media.title}
                    </h1>
                </div>

                <div className="grid gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/90">
                            <FileText className="h-5 w-5 text-primary" />
                            Описание
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                            {media.description || 'Описание отсутствует.'}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
                        {media.startDate && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                            <p className="text-sm font-medium">Дата начала</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(media.startDate), 'd MMMM yyyy', { locale: ru })}
                            </p>
                            </div>
                        </div>
                        )}
                        
                        {media.endDate && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                            <p className="text-sm font-medium">Дата завершения</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(media.endDate), 'd MMMM yyyy', { locale: ru })}
                            </p>
                            </div>
                        </div>
                        )}
                    </div>

                    {media.genres && media.genres.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Layers className="h-4 w-4" /> Жанры
                        </h3>
                        <div className="flex flex-wrap gap-2">
                        {media.genres.map((genre) => (
                            <Badge key={genre} variant="secondary">
                            {genre}
                            </Badge>
                        ))}
                        </div>
                    </div>
                    )}

                    {media.tags && media.tags.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4" /> Теги
                        </h3>
                        <div className="flex flex-wrap gap-2">
                        {media.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="border-dashed">
                            #{tag}
                            </Badge>
                        ))}
                        </div>
                    </div>
                    )}
                </div>
                </div>
            </div>
         </TabsContent>

         <TabsContent value="album" className="mt-0 min-h-[400px]">
            <div className="flex justify-end mb-6">
                <Input 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Plus className="mr-2 h-4 w-4" /> Добавить медиа
                </Button>
            </div>

            {(!media.files || media.files.length === 0) ? (
                 <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border border-dashed">
                    <div className="p-4 bg-background rounded-full mb-4">
                        <Layers className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Нет загруженных медиа</h3>
                    <p className="text-muted-foreground mb-4">Загрузите изображения или видео для этого тайтла</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                         Загрузить файлы
                    </Button>
                 </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.files.map((file, index) => (
                        <div key={file.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted border">
                            {file.type === 'video' ? (
                                <video src={file.url} className="w-full h-full object-cover" />
                            ) : (
                                <img src={file.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            )}
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setLightboxIndex(index)}>
                                    <Maximize2 className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteFile(file.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </TabsContent>
      </Tabs>

      <AddMediaModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        onSuccess={handleEditSuccess}
        initialData={media}
      />

      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
         <DialogContent className="max-w-5xl w-full p-0 bg-black/90 border-none h-[90vh] flex items-center justify-center">
             {lightboxIndex !== null && media.files?.[lightboxIndex] && (
                 <div className="relative w-full h-full flex items-center justify-center p-4">
                    {media.files[lightboxIndex].type === 'video' ? (
                        <video 
                            src={media.files[lightboxIndex].url} 
                            controls 
                            className="max-h-full max-w-full rounded-md"
                        />
                    ) : (
                        <img 
                            src={media.files[lightboxIndex].url} 
                            alt="" 
                            className="max-h-full max-w-full object-contain rounded-md"
                        />
                    )}
                 </div>
             )}
         </DialogContent>
      </Dialog>
    </div>
  );
}
