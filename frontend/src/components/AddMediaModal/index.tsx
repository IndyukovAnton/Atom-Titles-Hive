import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import type { MediaEntry } from '@/api/media';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Info,
  ListChecks,
  Loader2,
  X,
} from 'lucide-react';
import CreateGroupModal from '@/components/CreateGroupModal';
import { useMediaForm } from '@/hooks/useMediaForm';
import { InfoStep } from './InfoStep';
import { DetailsStep } from './DetailsStep';
import { MediaStep } from './MediaStep';

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: MediaEntry | null;
}

type Step = 'info' | 'details' | 'media';

const STEP_DESCRIPTIONS: Record<Step, string> = {
  info: 'Название, категория и оценка',
  details: 'Жанры, теги и описание',
  media: 'Обложка',
};

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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0"
          showCloseButton={false}
        >
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
                  {STEP_DESCRIPTIONS[activeStep]}
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
              <StepButton
                active={activeStep === 'info'}
                onClick={() => setActiveStep('info')}
                icon={<Info className="h-4 w-4" />}
                label="Инфо"
              />
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <StepButton
                active={activeStep === 'details'}
                onClick={() => setActiveStep('details')}
                icon={<ListChecks className="h-4 w-4" />}
                label="Детали"
              />
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <StepButton
                active={activeStep === 'media'}
                onClick={() => setActiveStep('media')}
                icon={<ImageIcon className="h-4 w-4" />}
                label="Медиа"
              />
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
                    <InfoStep
                      isSubmitting={isSubmitting}
                      groupOptions={groupOptions}
                      onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                    />
                  )}
                  {activeStep === 'details' && (
                    <DetailsStep
                      isSubmitting={isSubmitting}
                      dateLabels={dateLabels}
                    />
                  )}
                  {activeStep === 'media' && (
                    <MediaStep
                      isSubmitting={isSubmitting}
                      coverMode={coverMode}
                      setCoverMode={setCoverMode}
                      currentImage={currentImage}
                      error={error}
                      handleFileUpload={handleFileUpload}
                    />
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

function StepButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
