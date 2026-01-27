import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { usePersonalization } from '../hooks/usePersonalization';
import { 
  Moon, Sun, LogOut, ArrowLeft, User, Shield, 
  Palette, Type, Bot, Calendar, Save, Key, TriangleAlert,
  Fingerprint, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AccountSettings } from '@/components/personalization/AccountSettings';
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Password change data:', data);
      setMessage({ type: 'success', text: 'Пароль успешно обновлен' });
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
    toast.info('Функция сохранения даты рождения скоро будет доступна');
  };

  return (
    <div className="container max-w-5xl py-8 px-4 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-background/80">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Настройки
            </h1>
            <p className="text-muted-foreground text-sm">
              Управление внешним видом, безопасностью и интеграциями
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link to="/changelog">Что нового?</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link to="/privacy">Приватность</Link>
            </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1.5 bg-muted/40 backdrop-blur-sm rounded-xl border">
           <TabsTrigger value="appearance" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Внешний вид</span>
           </TabsTrigger>
           <TabsTrigger value="account" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Аккаунт</span>
           </TabsTrigger>
           <TabsTrigger value="integrations" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Интеграции & AI</span>
           </TabsTrigger>
           <TabsTrigger value="security" className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Безопасность</span>
           </TabsTrigger>
        </TabsList>

        {/* Tab 1: Appearance */}
        <TabsContent value="appearance" className="space-y-6 animate-in slide-in-from-left-4 duration-300 zoom-in-95">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Тема */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm">

                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{marginTop: '-20px', marginLeft: '0px'}}/>
                        </div>
                        Тема оформления
                    </CardTitle>
                    <CardDescription>Выберите предпочтительную цветовую схему интерфейса</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between p-6 pt-0">
                    <div className="space-y-0.5">
                    <Label className="text-base font-medium">Тёмная тема</Label>
                    <p className="text-sm text-muted-foreground">
                        Снижает нагрузку на глаза
                    </p>
                    </div>
                    <Switch 
                    checked={theme === 'dark'} 
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600"
                    />
                </CardContent>
            </Card>

            {/* Шрифты */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm row-span-2">

            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                        <Type className="h-5 w-5" />
                    </div>
                    Типографика
                </CardTitle>
                <CardDescription>Настройте размер и семейство шрифта для комфортного чтения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FontSettings
                fontFamily={fontFamily}
                fontSize={fontSize}
                onFontFamilyChange={setFontFamily}
                onFontSizeChange={setFontSize}
                />
                <Button onClick={handleSavePersonalization} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md hover:shadow-lg transition-all">
                <Save className="mr-2 h-4 w-4" /> Сохранить настройки
                </Button>
            </CardContent>
            </Card>

            {/* Фон */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm md:col-span-1">

            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
                    <Palette className="h-5 w-5" />
                    </div>
                    Задний фон
                </CardTitle>
                <CardDescription>Персонализируйте рабочее пространство</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <BackgroundSelector value={background} onChange={setBackground} />
                <Button onClick={handleSavePersonalization} variant="outline" className="w-full border-purple-500/20 hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400 group">
                <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> Сохранить фон
                </Button>
            </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Account */}
        <TabsContent value="account" className="space-y-6 animate-in slide-in-from-right-4 duration-300 zoom-in-95">
           <AccountSettings />
        </TabsContent>

        {/* Tab 3: Integrations & AI */}
        <TabsContent value="integrations" className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 zoom-in-95">
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* AI Настройки - Main Focus */}
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm xl:col-span-2">

                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                        <Bot className="h-5 w-5" />
                    </div>
                    Искусственный Интеллект
                    </CardTitle>
                    <CardDescription>
                    Настройте параметры нейросети для получения персонализированных рекомендаций
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <AISettings
                        preferences={tempPreferences}
                        onChange={handleAIPreferencesChange}
                    />
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                        onClick={async () => {
                            try {
                                if (tempPreferences.aiKey !== undefined) {
                                    setAiKey(tempPreferences.aiKey);
                                    if (tempPreferences.aiKey) {
                                        localStorage.setItem(`ai_secure_key_${user?.id}`, tempPreferences.aiKey);
                                    } else {
                                        localStorage.removeItem(`ai_secure_key_${user?.id}`);
                                    }
                                }
                                const safePrefs = { ...tempPreferences };
                                delete safePrefs.aiKey;
                                
                                await useAuthStore.getState().updateProfile({
                                    preferences: {
                                        ...user?.preferences,
                                        ...(safePrefs as UserPreferences)
                                    }
                                });

                                toast.success('Настройки AI успешно применены');
                            } catch (e) {
                                toast.error('Ошибка сохранения настроек');
                                console.error(e);
                            }
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                        >
                            <Sparkles className="mr-2 h-4 w-4" /> Применить настройки AI
                        </Button>
                    </div>
                </CardContent>
                </Card>

                {/* TMDB & Services */}
                <div className="space-y-6">
                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm h-full">

                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20">
                            <Key className="h-5 w-5" />
                        </div>
                        Киносервисы (TMDB)
                        </CardTitle>
                        <CardDescription>Источники данных о фильмах</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                        <Label htmlFor="tmdb-key" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">TMDB API Key</Label>
                        <div className="relative">
                            <Input
                                id="tmdb-key"
                                type="password"
                                placeholder="Введите токен доступа..."
                                value={tempPreferences.tmdbApiKey || ''}
                                onChange={(e) => setTempPreferences(prev => ({ ...prev, tmdbApiKey: e.target.value }))}
                                className="font-mono text-sm pl-10 focus-visible:ring-cyan-500"
                            />
                            <div className="absolute left-3 top-2.5 text-muted-foreground">
                                <Key className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Используется для поиска метаданных и постеров. Получите ключ на <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="underline hover:text-cyan-500 transition-colors">themoviedb.org</a>.
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
                                toast.success('Ключ TMDB сохранен');
                            } catch {
                                toast.error('Ошибка сохранения');
                            }
                        }}
                        variant="outline"
                        className="w-full border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-600"
                        >
                        <Save className="mr-2 h-4 w-4" /> Сохранить ключ
                        </Button>
                    </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        {/* Tab 4: Security */}
        <TabsContent value="security" className="space-y-6 animate-in slide-in-from-right-4 duration-300 zoom-in-95">
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
                    <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
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
                            message.type === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''
                            }`}
                        >
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                        )}

                        <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-md transition-all mt-2" disabled={isSubmitting}>
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
                    <CardDescription className="text-destructive/80">Действия с необратимыми последствиями</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border border-destructive/20 rounded-xl bg-background/50">
                            <h4 className="font-semibold text-destructive mb-1">Сброс данных</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Удаляет всю вашу коллекцию, оценки и историю просмотров. Это действие нельзя отменить.
                            </p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full shadow-sm hover:shadow-md transition-all">
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
                        </div>
                    </CardContent>
                </Card>
             </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
