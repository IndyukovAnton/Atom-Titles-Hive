import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/authSchema';

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const methods = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');

    try {
      // TODO: Реализовать API для восстановления пароля
      void data;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch {
      setError('Не удалось отправить письмо. Попробуйте позже.');
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Письмо отправлено!">
        <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in-95 duration-500">
          <CheckCircle2 className="h-16 w-16 text-primary mb-6 animate-bounce" />
          <p className="text-muted-foreground mb-6">
            Проверьте ваш email для инструкций по восстановлению пароля.
          </p>
          <Button asChild className="w-full">
            <Link to="/login">Вернуться к входу</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Atom Titles-Hive" subtitle="Восстановление пароля" error={error}>
      <p className="text-center text-muted-foreground text-sm mb-6">
        Введите email вашего аккаунта, и мы отправим инструкции по восстановлению пароля
      </p>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            name="email"
            label="Email"
            type="email"
            placeholder="Введите ваш email"
            required
            disabled={isSubmitting}
            autoFocus
            autoComplete="email"
            className="h-11"
          />

          <Button
            type="submit"
            className="w-full h-11 text-base shadow-lg hover:shadow-primary/25 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </Button>
        </form>
      </FormProvider>

      <div className="space-y-4 mt-8">
        <div className="text-center text-sm text-muted-foreground">
          Вспомнили пароль?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Войти
          </Link>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Назад
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
