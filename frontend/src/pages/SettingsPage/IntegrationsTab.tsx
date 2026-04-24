import { useState } from 'react';
import { Bot, Key, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AISettings } from '@/components/personalization/AISettings';
import { useAuthStore } from '@/store/authStore';
import { usePersonalization } from '@/hooks/usePersonalization';
import type { UserPreferences } from '@/api/auth';
import { logger } from '@/utils/logger';

export function IntegrationsTab() {
  const { user } = useAuthStore();
  const { aiKey, setAiKey } = usePersonalization();

  const [tempPreferences, setTempPreferences] = useState<Partial<UserPreferences>>(() => ({
    ...(user?.preferences || {}),
    aiKey: aiKey || user?.preferences?.aiKey,
  }));

  const handleAIPreferencesChange = (aiPrefs: Partial<UserPreferences>) => {
    setTempPreferences((prev) => ({ ...prev, ...aiPrefs }));
  };

  const handleApplyAi = async () => {
    try {
      if (tempPreferences.aiKey !== undefined) {
        setAiKey(tempPreferences.aiKey);
        if (tempPreferences.aiKey) {
          localStorage.setItem(
            `ai_secure_key_${user?.id}`,
            tempPreferences.aiKey,
          );
        } else {
          localStorage.removeItem(`ai_secure_key_${user?.id}`);
        }
      }
      const safePrefs = { ...tempPreferences };
      delete safePrefs.aiKey;

      await useAuthStore.getState().updateProfile({
        preferences: {
          ...user?.preferences,
          ...(safePrefs as UserPreferences),
        },
      });

      toast.success('Настройки AI успешно применены');
    } catch (e) {
      toast.error('Ошибка сохранения настроек');
      logger.error(e);
    }
  };

  const handleSaveTmdb = async () => {
    try {
      await useAuthStore.getState().updateProfile({
        preferences: {
          ...user?.preferences,
          ...(tempPreferences as UserPreferences),
        },
      });
      toast.success('Ключ TMDB сохранен');
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
              onClick={handleApplyAi}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Применить настройки AI
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <Label
                htmlFor="tmdb-key"
                className="text-xs uppercase text-muted-foreground font-bold tracking-wider"
              >
                TMDB API Key
              </Label>
              <div className="relative">
                <Input
                  id="tmdb-key"
                  type="password"
                  placeholder="Введите токен доступа..."
                  value={tempPreferences.tmdbApiKey || ''}
                  onChange={(e) =>
                    setTempPreferences((prev) => ({
                      ...prev,
                      tmdbApiKey: e.target.value,
                    }))
                  }
                  className="font-mono text-sm pl-10 focus-visible:ring-cyan-500"
                />
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <Key className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Используется для поиска метаданных и постеров. Получите ключ на{' '}
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-cyan-500 transition-colors"
                >
                  themoviedb.org
                </a>
                .
              </p>
            </div>
            <Button
              onClick={handleSaveTmdb}
              variant="outline"
              className="w-full border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-600"
            >
              <Save className="mr-2 h-4 w-4" /> Сохранить ключ
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
