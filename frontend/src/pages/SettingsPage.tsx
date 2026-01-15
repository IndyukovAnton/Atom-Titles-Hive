import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { Moon, Sun, Lock, LogOut, ArrowLeft, User, Shield, Palette, Type, Bot, Calendar, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { changePasswordSchema, type ChangePasswordFormData } from '@/schemas/profileSchema';
import { BackgroundSelector } from '@/components/personalization/BackgroundSelector';
import { FontSettings } from '@/components/personalization/FontSettings';
import { AISettings } from '@/components/personalization/AISettings';
import { toast } from 'sonner';
import type { UserPreferences } from '@/api/auth';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const {
    theme,
    background,
    fontSize,
    fontFamily,
    toggleTheme,
    setBackground,
    setFontSize,
    setFontFamily,
    savePreferences,
  } = usePersonalization();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempPreferences, setTempPreferences] = useState<Partial<UserPreferences>>(
    user?.preferences || {}
  );

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

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setMessage(null);

    try {
      // TODO: Реализовать API для смены пароля
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Password change data:', data);
      setMessage({ type: 'success', text: 'Пароль успешно обновлен (демо)' });
      reset();
    } catch {
      setMessage({ type: 'error', text: 'Не удалось обновить пароль' });
    }
  };

  const handleSavePersonalization = async () => {
    try {
      await savePreferences();
      toast.success('Настройки персонализации сохранены');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Не удалось сохранить настройки');
    }
  };

  const handleAIPreferencesChange = (aiPrefs: Partial<UserPreferences>) => {
    setTempPreferences((prev) => ({ ...prev, ...aiPrefs }));
  };

  const handleSaveBirthDate = async () => {
    // Функционал для сохранения даты рождения
    toast.info('Функция сохранения даты рождения скоро будет доступна');
  };

  return (
    <div className="container max-w-4xl py-10 px-4 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
      </div>

      <div className="space-y-6">
        {/* Внешний вид */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="ml-6">Тема</span>
            </CardTitle>
            <CardDescription>Настройте тему оформления приложения</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Темная тема</Label>
              <p className="text-sm text-muted-foreground">
                Включить темный режим для комфортной работы ночью
              </p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </CardContent>
        </Card>

        {/* Фон */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Задний фон
            </CardTitle>
            <CardDescription>Выберите стиль заднего фона рабочей области</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackgroundSelector value={background} onChange={setBackground} />
            <Button onClick={handleSavePersonalization} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> Сохранить фон
            </Button>
          </CardContent>
        </Card>

        {/* Шрифты */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Типографика
            </CardTitle>
            <CardDescription>Настройте размер и семейство шрифта</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FontSettings
              fontFamily={fontFamily}
              fontSize={fontSize}
              onFontFamilyChange={setFontFamily}
              onFontSizeChange={setFontSize}
            />
            <Button onClick={handleSavePersonalization} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> Сохранить шрифты
            </Button>
          </CardContent>
        </Card>

        {/* Дата рождения */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Персональные данные
            </CardTitle>
            <CardDescription>Дата рождения влияет на рекомендации контента</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birth-date">Дата рождения</Label>
              <input
                id="birth-date"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''}
              />
            </div>
            <Button onClick={handleSaveBirthDate} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> Сохранить дату
            </Button>
          </CardContent>
        </Card>

        {/* AI Настройки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Настройки AI
            </CardTitle>
            <CardDescription>
              Параметры нейросетей для модуля рекомендаций
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AISettings
              preferences={tempPreferences}
              onChange={handleAIPreferencesChange}
            />
            <Button
              onClick={() => {
                // Сохранение AI настроек
                toast.info('Функция сохранения AI настроек скоро будет доступна');
              }}
              className="w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" /> Сохранить настройки AI
            </Button>
          </CardContent>
        </Card>

        {/* Безопасность */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Безопасность
            </CardTitle>
            <CardDescription>Управление паролем и доступом</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormInput
                  name="currentPassword"
                  label="Текущий пароль"
                  type="password"
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />

                <FormInput
                  name="newPassword"
                  label="Новый пароль"
                  type="password"
                  required
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  description="Минимум 6 символов"
                />

                <FormInput
                  name="confirmPassword"
                  label="Подтвердите пароль"
                  type="password"
                  required
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />

                {message && (
                  <Alert
                    variant={message.type === 'error' ? 'destructive' : 'default'}
                    className={
                      message.type === 'success'
                        ? 'bg-green-500/15 text-green-600 border-green-500/20'
                        : ''
                    }
                  >
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  <Lock className="mr-2 h-4 w-4" /> Обновить пароль
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>

        {/* Аккаунт */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Аккаунт
            </CardTitle>
            <CardDescription>Информация о текущем пользователе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Username</Label>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <Button variant="destructive" className="w-full sm:w-auto" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
