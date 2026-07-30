import { useEffect, useCallback, useMemo, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { groupsApi } from '../api/groups';
import type { GroupStatsItem } from '../api/groups';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { FormInput } from '@/components/Form';
import { groupSchema, type GroupFormData } from '@/schemas/groupSchema';
import { buildParentOptions } from '@/utils/group-tree';
import { toast } from '@/utils/app-toast';

const ROOT_PARENT_VALUE = 'root';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: { id: number; name: string; parentId?: number | null } | null;
  /** Родитель, предвыбранный при создании подпапки из контекстного меню */
  parentId?: number;
  /** Все группы — для выбора родительской папки */
  groups?: GroupStatsItem[];
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  parentId,
  groups = [],
}: CreateGroupModalProps) {
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      parentId: null,
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Свою группу и её потомков нельзя выбрать родителем — получится цикл
  const parentOptions = useMemo(
    () => buildParentOptions(groups, initialData?.id),
    [groups, initialData?.id],
  );

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        parentId: initialData
          ? (initialData.parentId ?? null)
          : (parentId ?? null),
      });
    }
  }, [isOpen, initialData, parentId, reset]);

  const onSubmit = useCallback(
    async (data: GroupFormData) => {
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
        const errorMessage =
          error.response?.data?.message || 'Не удалось сохранить группу';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [initialData, onSuccess, onClose],
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      // Ошибка с прошлой сессии не должна дожить до следующего открытия
      setError(null);
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
          <div
            className="bg-destructive/15 text-destructive text-sm p-3 rounded-md"
            role="alert"
          >
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

            <Controller
              name="parentId"
              control={methods.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="parentId">Родительская папка</Label>
                  <Select
                    value={
                      field.value == null
                        ? ROOT_PARENT_VALUE
                        : String(field.value)
                    }
                    onValueChange={(value) =>
                      field.onChange(
                        value === ROOT_PARENT_VALUE ? null : Number(value),
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="parentId" className="w-full">
                      <SelectValue placeholder="Без родительской папки" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map((option) => (
                        <SelectItem
                          key={option.id ?? ROOT_PARENT_VALUE}
                          value={
                            option.id == null
                              ? ROOT_PARENT_VALUE
                              : String(option.id)
                          }
                          disabled={option.disabled}
                        >
                          <span
                            style={{
                              paddingLeft:
                                option.id == null
                                  ? 0
                                  : `${(option.depth - 1) * 16}px`,
                            }}
                          >
                            {option.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Где будет находиться папка
                  </p>
                </div>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting
                  ? 'Сохранение...'
                  : initialData
                    ? 'Сохранить'
                    : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
