import { useEffect, useCallback, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mediaApi, type CreateMediaData, type MediaEntry } from '../api/media';
import { groupsApi, type Group } from '../api/groups';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X } from 'lucide-react';
import { FormInput, FormSelect, FormTextarea, FormDateInput } from '@/components/Form';
import { mediaSchema, type MediaFormData } from '@/schemas/mediaSchema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: MediaEntry | null;
}

const PREDEFINED_TAGS = ['Favorites', 'ToWatch', 'Reading', 'Completed', 'Dropped', 'OnHold', 'Rewatch'];

const CATEGORY_OPTIONS = [
  { value: 'Movie', label: 'Фильм' },
  { value: 'Series', label: 'Сериал' },
  { value: 'Book', label: 'Книга' },
  { value: 'Game', label: 'Игра' },
  { value: 'Anime', label: 'Аниме' },
  { value: 'Manga', label: 'Манга' },
];

export default function AddMediaModal({ isOpen, onClose, onSuccess, initialData }: AddMediaModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [coverMode, setCoverMode] = useState<'url' | 'file'>('url');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const methods = useForm<MediaFormData>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      title: '',
      rating: 5,
      category: 'Movie',
      description: '',
      image: '',
      startDate: '',
      endDate: '',
      groupId: null,
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const currentCategory = watch('category');

  // Handle Tag Management
  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setValue('tags', newTags);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
         setValue('image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDateLabels = (category: string) => {
    switch (category) {
      case 'Book':
      case 'Manga':
        return { start: 'Дата начала чтения', end: 'Дата окончания чтения', showEnd: true };
      case 'Movie':
      case 'Anime': // Often single viewing unless series
        return { start: 'Дата просмотра', end: '', showEnd: false }; 
      case 'Series':
        return { start: 'Дата начала просмотра', end: 'Дата окончания просмотра', showEnd: true };
      case 'Game':
        return { start: 'Дата начала игры', end: 'Дата прохождения', showEnd: true };
      default:
        return { start: 'Дата начала', end: 'Дата окончания', showEnd: true };
    }
  };

  const dateLabels = getDateLabels(currentCategory || 'Movie');


  const loadGroups = useCallback(async () => {
    try {
      const data = await groupsApi.getAll();
      setGroups(data);
    } catch (e) {
      console.error('Failed to load groups for select', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title,
          rating: initialData.rating,
          category: initialData.category as any,
          description: initialData.description || '',
          image: initialData.image || '',
          startDate: initialData.startDate || '',
          endDate: initialData.endDate || '',
          groupId: initialData.groupId,
          tags: initialData.tags || [],
        });
        setTags(initialData.tags || []);
        // Check if image is base64 or url to set mode? defaulting to url is fine usually, 
        // but if we want to be smart:
        setCoverMode('url'); 
      } else {
        reset({
            title: '',
            rating: 5,
            category: 'Movie',
            description: '',
            image: '',
            startDate: '',
            endDate: '',
            groupId: null,
            tags: [],
        });
        setTags([]);
        setCoverMode('url');
      }
    }
  }, [isOpen, reset, initialData]);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        void loadGroups();
      });
    }
  }, [isOpen, loadGroups]);

  const onSubmit = useCallback(async (data: MediaFormData) => {
    setError(null);

    try {
      // Формируем объект для отправки, исключая пустые необязательные поля
      const dataToSend: Record<string, unknown> = {
        title: data.title,
        rating: data.rating,
        category: data.category,
      };

      if (data.description) dataToSend.description = data.description;
      if (data.image) dataToSend.image = data.image;
      if (data.startDate) dataToSend.startDate = data.startDate;
      if (data.endDate) dataToSend.endDate = data.endDate;
      if (data.groupId !== null) dataToSend.groupId = data.groupId;

      if (data.tags) dataToSend.tags = data.tags;

      if (initialData?.id) {
         await mediaApi.update(initialData.id, dataToSend as unknown as Partial<CreateMediaData>);
      } else {
         await mediaApi.create(dataToSend as unknown as CreateMediaData);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Не удалось создать запись');
    }
  }, [onSuccess, onClose, initialData?.id]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Опции для селекта групп
  const groupOptions = [
    { value: 'null', label: 'Без группы' },
    ...groups.map((g) => ({ value: g.id.toString(), label: g.name })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{initialData ? 'Редактировать запись' : 'Добавить запись'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4" role="alert">
              {error}
            </div>
          )}

          <FormProvider {...methods}>
            <form id="add-media-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormInput
                name="title"
                label="Название"
                placeholder="Введите название"
                required
                autoFocus
                disabled={isSubmitting}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  name="category"
                  label="Категория"
                  options={CATEGORY_OPTIONS}
                  disabled={isSubmitting}
                />

                <FormInput
                  name="rating"
                  label="Оценка (1-10)"
                  type="number"
                  min={1}
                  max={10}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <FormSelect
                name="groupId"
                label="Группа"
                placeholder="Без группы"
                options={groupOptions}
                disabled={isSubmitting}
              />



              {/* Cover Image Section */}
              <div className="space-y-2">
                <Label>Обложка</Label>
                <Tabs value={coverMode} onValueChange={(v) => setCoverMode(v as 'url' | 'file')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">Ссылка URL</TabsTrigger>
                    <TabsTrigger value="file">Загрузка файла</TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="pt-2">
                    <FormInput
                      name="image"
                      // label="URL обложки" 
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      disabled={isSubmitting}
                      className="mt-0"
                    />
                  </TabsContent>
                  <TabsContent value="file" className="pt-2">
                     <div className="flex items-center gap-4">
                        <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileUpload} 
                            disabled={isSubmitting}
                        />
                        {watch('image') && watch('image')?.startsWith('data:') && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                                Загружено
                            </Badge>
                        )}
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">Максимальный размер: 5MB</p>
                  </TabsContent>
                </Tabs>
              </div>

              <FormTextarea
                name="description"
                label="Описание / Заметки"
                placeholder="Ваши мысли..."
                rows={3}
                disabled={isSubmitting}
              />

              <div className="border rounded-md p-4 bg-muted/20 space-y-3">
                 <Label>Теги и критерии</Label>
                 <div className="flex gap-2">
                    <Input 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(tagInput);
                            }
                        }}
                        placeholder="Введите тег и нажмите Enter"
                        disabled={isSubmitting}
                    />
                    <Button type="button" variant="secondary" onClick={() => addTag(tagInput)} disabled={!tagInput}>Add</Button>
                 </div>
                 
                 {/* Suggested Tags (Optional) */}
                 <div className="flex flex-wrap gap-1 mt-2">
                    {PREDEFINED_TAGS.map(tag => (
                        <Badge 
                            key={tag} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => addTag(tag)}
                        >
                            {tag}
                        </Badge>
                    ))}
                 </div>

                 {/* Selected Tags */}
                 {tags.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t">
                        {tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)}/>
                            </Badge>
                        ))}
                     </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormDateInput
                  name="startDate"
                  label={dateLabels.start}
                  disabled={isSubmitting}
                />

                {dateLabels.showEnd && (
                    <FormDateInput
                      name="endDate"
                      label={dateLabels.end}
                      disabled={isSubmitting}
                    />
                )}
              </div>
            </form>
          </FormProvider>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" form="add-media-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
