import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { usePersonalization } from '../hooks/usePersonalization';
import { Moon, Sun, Lock, LogOut, ArrowLeft, User, Shield, Palette, Type, Bot, Calendar, Save, Key, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from "@/components/ui/alert-dialog";
import { mediaApi } from '@/api/media';
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
    setAiKey
  } = usePersonalization();

  const { aiKey } = usePersonalization();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempPreferences, setTempPreferences] = useState<Partial<UserPreferences>>(() => ({
    ...(user?.preferences || {}),
    aiKey: aiKey || user?.preferences?.aiKey, // Prefer context key (localStorage)
  }));

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
    <div className="container max-w-4xl py-10 px-4 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 bg-background/80 backdrop-blur-sm rounded-2xl my-4 shadow-lg">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
      </div>

        <div className="space-y-6">
        {/* Ссылки на инфо */}
        <div className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row gap-4 justify-between items-center animate-in fade-in slide-in-from-top-2 shadow-sm">
            <div className="text-sm text-muted-foreground">
                Узнайте больше о последних изменениях и нашей политике
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="hover:bg-primary/5">
                    <Link to="/changelog">Что нового?</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="hover:bg-primary/5">
                    <Link to="/privacy">Приватность</Link>
                </Button>
            </div>
        </div>

        {/* Внешний вид */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-blue-600 dark:text-blue-400" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" style={{ marginTop: '-20px' }} />
              </div>
              <span>Тема оформления</span>
            </CardTitle>
            <CardDescription>Настройте цветовую схему приложения</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Тёмная тема</Label>
              <p className="text-sm text-muted-foreground">
                Снижает нагрузку на глаза в тёмных условиях
              </p>
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-cyan-500"
            />
          </CardContent>
        </Card>

        {/* Фон */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Задний фон
            </CardTitle>
            <CardDescription>Выберите стиль заднего фона рабочей области</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackgroundSelector value={background} onChange={setBackground} />
            <Button onClick={handleSavePersonalization} className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
              <Save className="mr-2 h-4 w-4" /> Сохранить фон
            </Button>
          </CardContent>
        </Card>

        {/* Шрифты */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Type className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
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
            <Button onClick={handleSavePersonalization} className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0">
              <Save className="mr-2 h-4 w-4" /> Сохранить шрифты
            </Button>
          </CardContent>
        </Card>

        {/* Дата рождения */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
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
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''}
              />
            </div>
            <Button onClick={handleSaveBirthDate} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0">
              <Save className="mr-2 h-4 w-4" /> Сохранить дату
            </Button>
          </CardContent>
        </Card>


        {/* Интеграции (TMDB/Jikan) */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-sky-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-sky-500/20">
                <Key className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              Интеграции
            </CardTitle>
            <CardDescription>Подключение внешних сервисов для рекомендаций</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tmdb-key">TMDB API Key (Movies & Series)</Label>
               <div className="flex gap-2">
                  <Input
                    id="tmdb-key"
                    type="password"
                    placeholder="Enter your TMDB Read Access Token or API Key"
                    value={tempPreferences.tmdbApiKey || ''}
                    onChange={(e) => setTempPreferences(prev => ({ ...prev, tmdbApiKey: e.target.value }))}
                    className="focus-visible:ring-cyan-500"
                  />
               </div>
              <p className="text-xs text-muted-foreground">
                Необходим для поиска рекомендаций фильмов. Получить ключ (API Read Access Token) можно <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="underline hover:text-cyan-500 transition-colors">здесь</a>.
              </p>
            </div>
             <Button
              onClick={async () => {
                try {
                    await useAuthStore.getState().updateProfile({
                        preferences: {
                            ...user?.preferences,
                            ...(tempPreferences as UserPreferences)
                        }
                    });
                    toast.success('API ключи сохранены');
                    // Force refresh user to get new prefs
                    // window.location.reload(); 
                } catch {
                    toast.error('Ошибка сохранения');
                }
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white border-0"
            >
              <Save className="mr-2 h-4 w-4" /> Сохранить ключи
            </Button>
          </CardContent>
        </Card>

        {/* AI Настройки */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
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
              onClick={async () => {
                try {
                    // Сохраняем ключ локально
                    if (tempPreferences.aiKey !== undefined) {
                        setAiKey(tempPreferences.aiKey);
                        if (tempPreferences.aiKey) {
                            localStorage.setItem(`ai_secure_key_${user?.id}`, tempPreferences.aiKey);
                        } else {
                             localStorage.removeItem(`ai_secure_key_${user?.id}`);
                        }
                    }

                    // Сохраняем остальные настройки на сервер
                    // Сохраняем остальные настройки на сервер
                    const safePrefs = { ...tempPreferences };
                    delete safePrefs.aiKey;
                    
                    await useAuthStore.getState().updateProfile({
                        preferences: {
                            ...user?.preferences,
                            ...(safePrefs as UserPreferences)
                        }
                    });

                    toast.success('Настройки AI и приватности сохранены');
                } catch (e) {
                    toast.error('Ошибка сохранения настроек');
                    console.error(e);
                }
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0"
            >
              <Save className="mr-2 h-4 w-4" /> Сохранить настройки AI
            </Button>
          </CardContent>
        </Card>

        {/* Безопасность */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
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

                <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0" disabled={isSubmitting}>
                  <Lock className="mr-2 h-4 w-4" /> Обновить пароль
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>

        {/* Аккаунт */}
        <Card className="overflow-hidden border-0 shadow-md hover-lift">
          <div className="h-1 bg-gradient-to-r from-slate-500 to-zinc-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-500/20">
                <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              Аккаунт
            </CardTitle>
            <CardDescription>Информация о текущем пользователе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Username</Label>
                <p className="font-semibold text-base">{user?.username}</p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
                <p className="font-semibold text-base">{user?.email}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <Button variant="destructive" className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 border-0" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="overflow-hidden border-destructive/50 shadow-md hover-lift">
            <div className="h-1 bg-destructive" />
            <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
                <div className="p-2 rounded-lg bg-destructive/10">
                <TriangleAlert className="h-5 w-5 text-destructive" />
                </div>
                Опасная зона
            </CardTitle>
            <CardDescription>Управление полным сбросом данных</CardDescription>
            </CardHeader>
            <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                    Сбросить все данные
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Это действие нельзя отменить. Вся ваша коллекция (фильмы, жанры, рейтинги) будет удалена навсегда.
                    База данных будет полностью очищена.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={async () => {
                            try {
                                await mediaApi.reset();
                                toast.success('Данные успешно сброшены');
                                window.location.href = '/';
                            } catch (e) {
                                console.error(e);
                                toast.error('Не удалось сбросить данные');
                            }
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Сбросить всё
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
