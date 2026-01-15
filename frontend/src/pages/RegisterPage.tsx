import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { registerSchema, type RegisterFormData } from '@/schemas/authSchema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
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

  const onSubmit = async (data: RegisterFormData) => {
    clearError();

    try {
      await registerUser(data.username, data.email, data.password);
      navigate('/');
    } catch {
      // Ошибка уже обработана в store
    }
  };

  return (
    <AuthLayout title="Atom Titles-Hive" subtitle="Создать аккаунт" error={error}>
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
          <UserPlus className="w-4 h-4" />
          <span>Присоединяйтесь к нам</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Создайте свой аккаунт
        </h2>
        <p className="text-muted-foreground text-sm">
          И начните организовывать вашу коллекцию
        </p>
      </motion.div>

      <FormProvider {...methods}>
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FormInput
              name="username"
              label="Имя пользователя"
              placeholder="Выберите имя пользователя"
              required
              disabled={isLoading}
              autoFocus
              autoComplete="username"
              className="h-11"
              description="Только латинские буквы, цифры, _ и -"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FormInput
              name="email"
              label="Email"
              type="email"
              placeholder="Введите email"
              required
              disabled={isLoading}
              autoComplete="email"
              className="h-11"
            />
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label htmlFor="password">
              Пароль
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                {...register('password')}
                placeholder="Создайте пароль"
                disabled={isLoading}
                autoComplete="new-password"
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
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Label htmlFor="confirmPassword">
              Подтвердите пароль
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                {...register('confirmPassword')}
                placeholder="Повторите пароль"
                disabled={isLoading}
                autoComplete="new-password"
                className={cn(
                  'pr-10 h-11',
                  errors.confirmPassword && 'border-destructive focus-visible:ring-destructive'
                )}
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium mt-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </motion.div>
        </motion.form>
      </FormProvider>

      <motion.div
        className="text-center text-sm text-muted-foreground mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Войти
        </Link>
      </motion.div>
    </AuthLayout>
  );
}
