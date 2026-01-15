import { useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { loginSchema, type LoginFormData } from '@/schemas/authSchema';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = methods;

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = useCallback(async (data: LoginFormData) => {
    clearError();

    try {
      await login(data.username, data.password);
      navigate('/');
    } catch {
      // Ошибка уже обработана в store
    }
  }, [clearError, login, navigate]);

  return (
    <AuthLayout title="Atom Titles-Hive" subtitle="Добро пожаловать" error={error}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            name="username"
            label="Имя пользователя"
            placeholder="Введите имя пользователя"
            required
            disabled={isLoading}
            autoFocus
            autoComplete="username"
            className="h-11"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">
                Пароль
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
                tabIndex={-1}
              >
                Забыли пароль?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                {...register('password')}
                placeholder="Введите пароль"
                disabled={isLoading}
                autoComplete="current-password"
                className={cn(
                  'pr-10 h-11',
                  errors.password && 'border-destructive focus-visible:ring-destructive'
                )}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base shadow-lg hover:shadow-primary/25 transition-all"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </FormProvider>

      <div className="text-center text-sm text-muted-foreground mt-6">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Зарегистрироваться
        </Link>
      </div>
    </AuthLayout>
  );
}
