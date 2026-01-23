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
import { Loader2, X, ChevronRight, ChevronLeft, Image as ImageIcon, Info, Plus, ListChecks } from 'lucide-react';
import { FormInput, FormSelect, FormTextarea, StarRating, TagInput, DatePicker } from '@/components/Form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';
import { useMediaForm } from '@/hooks/useMediaForm';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: MediaEntry | null;
}



const CATEGORY_OPTIONS = [
  { value: 'Movie', label: 'Фильм' },
  { value: 'Series', label: 'Сериал' },
  { value: 'Book', label: 'Книга' },
  { value: 'Game', label: 'Игра' },
  { value: 'Anime', label: 'Аниме' },
  { value: 'Manga', label: 'Манга' },
];



export default function AddMediaModal({ isOpen, onClose, onSuccess, initialData }: AddMediaModalProps) {
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

  const PREDEFINED_TAGS = ['Избранное', 'В планах', 'Читаю', 'Завершено', 'Брошено', 'Отложено', 'Пересматриваю'];
  const PREDEFINED_GENRES = [
    'Экшен', 'Приключения', 'Комедия', 'Драма', 'Фэнтези', 'Ужасы', 
    'Мистика', 'Романтика', 'Фантастика', 'Повседневность', 'Спорт', 
    'Триллер', 'Военный', 'Вестерн', 'Детектив', 'Исторический', 
    'Музыка', 'Психология', 'Семейный', 'Биография', 'Документальный'
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-none shadow-2xl bg-background/95 backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-muted/20">
            <Progress value={stepProgress} className="h-full rounded-none transition-all duration-500 ease-out" />
          </div>

          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {initialData ? 'Редактировать запись' : 'Добавить новую запись'}
                </DialogTitle>
                <DialogDescription>
                  Заполните форму, чтобы добавить или изменить данные о медиа-контенте.
                </DialogDescription>
                <p className="text-muted-foreground text-sm mt-1">
                  {activeStep === 'info' && 'Начнем с основ: название, категория и ваша оценка.'}
                  {activeStep === 'details' && 'Добавьте детали, чтобы лучше помнить ваши впечатления.'}
                  {activeStep === 'media' && 'Визуализируйте запись с помощью обложки или кадра.'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-8 mb-4">
            <div className="flex justify-between items-center gap-2">
              {/* Step 1: Info */}
              <button
                type="button"
                onClick={() => setActiveStep('info')}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all group ${
                  activeStep === 'info' 
                    ? 'bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/30' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className={`p-2.5 rounded-lg transition-all ${
                  activeStep === 'info'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                }`}>
                  <Info className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                    activeStep === 'info' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                  }`}>Шаг 1</span>
                  <p className={`text-sm font-medium ${
                    activeStep === 'info' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>Инфо</p>
                </div>
              </button>

              {/* Connector */}
              <div className={`h-0.5 w-8 rounded-full transition-colors ${
                activeStep !== 'info' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-muted'
              }`} />

              {/* Step 2: Details */}
              <button
                type="button"
                onClick={() => setActiveStep('details')}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all group ${
                  activeStep === 'details' 
                    ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/30' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className={`p-2.5 rounded-lg transition-all ${
                  activeStep === 'details'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                }`}>
                  <ListChecks className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                    activeStep === 'details' ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
                  }`}>Шаг 2</span>
                  <p className={`text-sm font-medium ${
                    activeStep === 'details' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>Детали</p>
                </div>
              </button>

              {/* Connector */}
              <div className={`h-0.5 w-8 rounded-full transition-colors ${
                activeStep === 'media' ? 'bg-gradient-to-r from-purple-500 to-amber-500' : 'bg-muted'
              }`} />

              {/* Step 3: Media */}
              <button
                type="button"
                onClick={() => setActiveStep('media')}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all group ${
                  activeStep === 'media' 
                    ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/30' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className={`p-2.5 rounded-lg transition-all ${
                  activeStep === 'media'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                }`}>
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                    activeStep === 'media' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                  }`}>Шаг 3</span>
                  <p className={`text-sm font-medium ${
                    activeStep === 'media' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>Медиа</p>
                </div>
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-8 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="pb-6"
              >
                <FormProvider {...methods}>
                  <form id="add-media-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {activeStep === 'info' && (
                      <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                          <FormInput
                            name="title"
                            label="Что добавим?"
                            placeholder="Название фильма, книги или игры..."
                            disabled={isSubmitting}
                            className="h-12 text-base rounded-xl border-muted-foreground/20 focus:border-primary transition-all pr-12"
                          />

                          <div className="flex flex-col gap-4">
                            <FormSelect
                              name="category"
                              label="Категория"
                              options={CATEGORY_OPTIONS}
                              disabled={isSubmitting}
                            />

                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold tracking-tight">Группа</Label>
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs font-medium min-w-20"
                                  onClick={() => setIsCreateGroupOpen(true)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Новая
                                </Button>
                              </div>
                              <FormSelect
                                name="groupId"
                                options={groupOptions}
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>

                          <StarRating
                            name="rating"
                            label="Ваша оценка"
                          />
                        </div>
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
                            className="min-h-[100px] rounded-xl resize-none border-muted-foreground/20"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 p-4 rounded-2xl bg-muted/30 border border-muted-foreground/5">
                            <DatePicker
                              name="startDate"
                              label={dateLabels.start}
                            />
                            {dateLabels.showEnd && (
                              <DatePicker
                                name="endDate"
                                label={dateLabels.end}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeStep === 'media' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                          <Label className="text-base font-semibold">Обложка</Label>

                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                              <Tabs value={coverMode} onValueChange={(v) => setCoverMode(v as 'url' | 'file')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                  <TabsTrigger value="url">URL Ссылка</TabsTrigger>
                                  <TabsTrigger value="file">Файл</TabsTrigger>
                                </TabsList>
                                <TabsContent value="url" className="mt-0">
                                  <FormInput
                                    name="image"
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    disabled={isSubmitting}
                                  />
                                </TabsContent>
                                <TabsContent value="file" className="mt-0">
                                  <div className="space-y-2">
                                    <div className="relative group">
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isSubmitting}
                                        className="cursor-pointer"
                                      />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Макс 5MB • PNG, JPG, WEBP</p>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>

                            <div className="w-full sm:w-[200px] aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/30 group relative shadow-lg">
                              {/* Gradient border effect */}
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-amber-500/20 pointer-events-none" />
                              
                              {currentImage ? (
                                <>
                                  <img
                                    src={currentImage}
                                    alt="Preview"
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-90"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => setValue('image', '')}
                                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 border-0 shadow-lg"
                                    >
                                      <X className="h-4 w-4 mr-1" /> Удалить
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-muted-foreground/20 rounded-2xl m-1">
                                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-amber-500/10 mb-3">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                  </div>
                                  <p className="text-xs text-muted-foreground font-medium">Предпросмотр</p>
                                  <p className="text-sm text-muted-foreground/60 mt-1">Добавьте обложку</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {error && (
                          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                            {error}
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                </FormProvider>
              </motion.div>
            </AnimatePresence>
          </ScrollArea>

          <footer className="p-8 pt-4 flex items-center justify-between border-t bg-muted/20 backdrop-blur-sm">
            <div className="flex gap-2">
              {activeStep !== 'info' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep(activeStep === 'media' ? 'details' : 'info')}
                  className="rounded-xl px-6"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-6"
              >
                Отмена
              </Button>

              {activeStep === 'details' && (
                 <Button
                   type="submit"
                   form="add-media-form"
                   disabled={isSubmitting}
                   className="rounded-xl px-6 bg-primary/80 hover:bg-primary/90"
                 >
                    {initialData ? 'Сохранить' : 'Готово'}
                 </Button>
              )}

              {activeStep === 'media' ? (
                <Button
                  type="submit"
                  form="add-media-form"
                  disabled={isSubmitting}
                  className="rounded-xl px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : initialData ? 'Обновить' : 'Готово'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => validateAndNext(activeStep === 'info' ? 'details' : 'media')}
                  className="rounded-xl px-8 shadow-lg shadow-primary/10"
                >
                  Далее
                  <ChevronRight className="h-4 w-4 ml-2" />
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
