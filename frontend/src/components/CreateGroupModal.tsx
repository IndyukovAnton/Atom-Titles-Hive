import { useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { groupsApi } from '../api/groups';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { FormInput } from '@/components/Form';
import { groupSchema, type GroupFormData } from '@/schemas/groupSchema';
import { useState } from 'react';
import { toast } from 'sonner';


interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: { id: number; name: string } | null;
  parentId?: number;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  parentId,
}: CreateGroupModalProps) {
  const [error, setError] = useState<string | null>(null);


  const methods = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        parentId: parentId,
      });
    }
  }, [isOpen, initialData, parentId, reset]);

  const onSubmit = useCallback(async (data: GroupFormData) => {
    setError(null);

    try {
      if (initialData) {
        await groupsApi.update(initialData.id, data);
        toast.success('Группа обновлена');
      } else {
        await groupsApi.create(data);
        toast.success('Группа создана');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage = error.response?.data?.message || 'Не удалось сохранить группу';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [initialData, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Обработка клавиши Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isSubmitting, handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Редактировать группу' : 'Создать группу'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {initialData
              ? 'Форма редактирования группы'
              : 'Форма создания новой группы'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md" role="alert">
            {error}
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormInput
              name="name"
              label="Название"
              placeholder="Например: 'Must Watch', 'Anime 2024'"
              required
              autoFocus
              disabled={isSubmitting}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Сохранение...' : initialData ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
