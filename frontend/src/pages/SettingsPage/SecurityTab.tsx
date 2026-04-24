import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FormInput } from '@/components/Form';
import { mediaApi } from '@/api/media';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/schemas/profileSchema';
import { logger } from '@/utils/logger';

export function SecurityTab() {
  const [message, setMessage] = useState<
    { type: 'success' | 'error'; text: string } | null
  >(null);

  const methods = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onPasswordSubmit = async (_data: ChangePasswordFormData) => {
    setMessage(null);
    try {
      // TODO: Реализовать API смены пароля
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Пароль успешно обновлен' });
      reset();
    } catch {
      setMessage({ type: 'error', text: 'Не удалось обновить пароль' });
    }
  };

  const handleFactoryReset = async () => {
    try {
      await mediaApi.reset();
      toast.success('Данные успешно сброшены');
      window.location.href = '/';
    } catch (e) {
      logger.error(e);
      toast.error('Не удалось сбросить данные');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
              <Fingerprint className="h-5 w-5" />
            </div>
            Смена пароля
          </CardTitle>
          <CardDescription>Обновите пароль для защиты аккаунта</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormInput
                name="currentPassword"
                label="Текущий пароль"
                type="password"
                required
                disabled={isSubmitting}
                className="bg-background/50"
              />
              <Separator />
              <FormInput
                name="newPassword"
                label="Новый пароль"
                type="password"
                required
                disabled={isSubmitting}
                description="Не менее 6 символов"
                className="bg-background/50"
              />
              <FormInput
                name="confirmPassword"
                label="Подтверждение"
                type="password"
                required
                disabled={isSubmitting}
                className="bg-background/50"
              />

              {message && (
                <Alert
                  variant={message.type === 'error' ? 'destructive' : 'default'}
                  className={`animate-in fade-in zoom-in-95 ${
                    message.type === 'success'
                      ? 'bg-green-500/10 text-green-600 border-green-500/20'
                      : ''
                  }`}
                >
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-md transition-all mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Обновление...' : 'Обновить пароль'}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-destructive/20 shadow-lg bg-destructive/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-destructive">
            <div className="p-2.5 rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
              <TriangleAlert className="h-5 w-5" />
            </div>
            Опасная зона
          </CardTitle>
          <CardDescription className="text-destructive/80">
            Действия с необратимыми последствиями
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-destructive/20 rounded-xl bg-background/50">
            <h4 className="font-semibold text-destructive mb-1">
              Сброс данных
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Удаляет всю вашу коллекцию, оценки и историю просмотров. Это
              действие нельзя отменить.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full shadow-sm hover:shadow-md transition-all"
                >
                  Сбросить все данные
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Вся ваша коллекция (фильмы,
                    жанры, рейтинги) будет удалена навсегда. База данных будет
                    полностью очищена.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleFactoryReset}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Сбросить всё
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
