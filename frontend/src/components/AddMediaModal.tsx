import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import type { MediaEntry } from '../api/media';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Info,
  Plus,
  Download,
  ListChecks,
} from 'lucide-react';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  StarRating,
  TagInput,
  DatePicker,
} from '@/components/Form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import CreateGroupModal from './CreateGroupModal';
import { useMediaForm } from '@/hooks/useMediaForm';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: MediaEntry | null;
}

import { CoverImagePicker } from './CoverImagePicker';
import { toast } from 'sonner';

const CATEGORY_OPTIONS = [
  { value: 'Movie', label: 'Фильм' },
  { value: 'Series', label: 'Сериал' },
  { value: 'Book', label: 'Книга' },
  { value: 'Game', label: 'Игра' },
  { value: 'Anime', label: 'Аниме' },
  { value: 'Manga', label: 'Манга' },
];

export default function AddMediaModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AddMediaModalProps) {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const {
    methods,
    handleSubmit,
    setValue,
    isSubmitting,
    activeStep,
    setActiveStep,
    error,
    coverMode,
    setCoverMode,
    stepProgress,
    currentImage,
    dateLabels,
    groupOptions,
    loadGroups,
    handleFileUpload,
    onSubmit,
    validateAndNext,
  } = useMediaForm({ isOpen, initialData, onSuccess, onClose });

  const PREDEFINED_TAGS = [
    'Избранное',
    'В планах',
    'Читаю',
    'Завершено',
    'Брошено',
    'Отложено',
    'Пересматриваю',
  ];
  const PREDEFINED_GENRES = [
    'Экшен',
    'Приключения',
    'Комедия',
    'Драма',
    'Фэнтези',
    'Ужасы',
    'Мистика',
    'Романтика',
    'Фантастика',
    'Повседневность',
    'Спорт',
    'Триллер',
    'Военный',
    'Вестерн',
    'Детектив',
    'Исторический',
    'Музыка',
    'Психология',
    'Семейный',
    'Биография',
    'Документальный',
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0"
          showCloseButton={false}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden">
            <Progress value={stepProgress} className="h-full rounded-none" />
          </div>

          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">
                  {initialData
                    ? 'Редактировать запись'
                    : 'Добавить новую запись'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {activeStep === 'info' && 'Название, категория и оценка'}
                  {activeStep === 'details' && 'Жанры, теги и описание'}
                  {activeStep === 'media' && 'Обложка'}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-3 border-b bg-muted/30">
            <div className="flex justify-center items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveStep('info')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeStep === 'info'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Инфо</span>
              </button>

              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />

              <button
                type="button"
                onClick={() => setActiveStep('details')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeStep === 'details'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <ListChecks className="h-4 w-4" />
                <span className="text-sm font-medium">Детали</span>
              </button>

              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />

              <button
                type="button"
                onClick={() => setActiveStep('media')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeStep === 'media'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Медиа</span>
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="pb-4">
              <FormProvider {...methods}>
                <form
                  id="add-media-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {activeStep === 'info' && (
                    <div className="space-y-4">
                      <FormInput
                        name="title"
                        label="Что добавим?"
                        placeholder="Название фильма, книги или игры..."
                        disabled={isSubmitting}
                        className="h-11 text-base"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormSelect
                          name="category"
                          label="Категория"
                          options={CATEGORY_OPTIONS}
                          disabled={isSubmitting}
                        />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold text-foreground">
                              Группа
                            </Label>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => setIsCreateGroupOpen(true)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Новая
                            </Button>
                          </div>
                          <FormSelect
                            name="groupId"
                            options={groupOptions}
                            placeholder="Без группы"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <StarRating name="rating" label="Ваша оценка" />
                    </div>
                  )}

                  {activeStep === 'details' && (
                    <div className="grid gap-6 py-4">
                      <div className="space-y-4">
                        <TagInput
                          name="genres"
                          label="Жанры"
                          placeholder="Добавьте жанры..."
                          suggestions={PREDEFINED_GENRES}
                          disabled={isSubmitting}
                        />

                        <TagInput
                          name="tags"
                          label="Теги и списки"
                          placeholder="Добавьте теги..."
                          suggestions={PREDEFINED_TAGS}
                          disabled={isSubmitting}
                        />

                        <FormTextarea
                          name="description"
                          label="Заметки и впечатления"
                          placeholder="О чем этот тайтл? Что вам понравилось или не понравилось..."
                          disabled={isSubmitting}
                          className="min-h-[100px] resize-none"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/20">
                          <DatePicker
                            name="startDate"
                            label={dateLabels.start}
                          />
                          {dateLabels.showEnd && (
                            <DatePicker name="endDate" label={dateLabels.end} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 'media' && (
                    <div className="space-y-6">
                      <div className="flex flex-col h-full">
                        <Tabs
                          value={coverMode}
                          onValueChange={(v) =>
                            setCoverMode(v as 'file' | 'search')
                          }
                          className="w-full flex-1 flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-base font-medium">
                              Обложка
                            </Label>
                            <TabsList className="grid w-[300px] grid-cols-2">
                              <TabsTrigger
                                value="file"
                                className="cursor-pointer"
                              >
                                Загрузить
                              </TabsTrigger>
                              <TabsTrigger
                                value="search"
                                className="cursor-pointer"
                              >
                                Поиск
                              </TabsTrigger>
                            </TabsList>
                          </div>

                          <div className="flex-1 min-h-0">
                            <TabsContent
                              value="file"
                              className="mt-0 space-y-6"
                            >
                              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  disabled={isSubmitting}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="text-center space-y-2">
                                  <div className="bg-primary/10 p-4 rounded-full inline-flex mb-2">
                                    <Download className="h-8 w-8 text-primary" />
                                  </div>
                                  <p className="font-medium">
                                    Нажмите для выбора файла
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    PNG, JPG, WEBP (Макс 5MB)
                                  </p>
                                </div>
                              </div>

                              {/* Preview for File Mode */}
                              {currentImage && (
                                <div className="flex justify-center animate-in fade-in zoom-in-95 duration-200">
                                  <div className="relative w-[180px] aspect-[2/3] rounded-lg overflow-hidden shadow-md border group">
                                    <img
                                      src={currentImage}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-2 right-2 h-8 w-8 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => setValue('image', '')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent
                              value="search"
                              className="mt-0 h-full flex flex-col"
                            >
                              <CoverImagePicker
                                initialQuery={
                                  methods.watch('title')
                                    ? `Обложка ${methods.watch('title')}`
                                    : ''
                                }
                                onSelect={(base64) => {
                                  setValue('image', base64);
                                  setCoverMode('file');
                                  toast.success('Обложка выбрана!');
                                }}
                                className="flex-1"
                              />
                            </TabsContent>
                          </div>
                        </Tabs>
                      </div>

                      {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          {error}
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </FormProvider>
            </div>
          </ScrollArea>

          <footer className="p-4 flex items-center justify-between border-t">
            {activeStep !== 'info' ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setActiveStep(activeStep === 'media' ? 'details' : 'info')
                }
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Назад
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Отмена
              </Button>

              {activeStep === 'details' || activeStep === 'media' ? (
                <Button
                  type="submit"
                  form="add-media-form"
                  disabled={isSubmitting}
                  className="min-w-[100px] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>{initialData ? 'Сохранить' : 'Создать'}</>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => validateAndNext('details')}
                  className="cursor-pointer"
                >
                  Далее
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </footer>
        </DialogContent>
      </Dialog>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={() => {
          loadGroups();
          setIsCreateGroupOpen(false);
        }}
      />
    </>
  );
}
