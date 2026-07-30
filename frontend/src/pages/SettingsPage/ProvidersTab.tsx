import { useState } from 'react';
import { Blocks, Cpu, FlaskConical, Save } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GENERIC_AI_PROVIDERS } from '@/components/personalization/providers.constants';
import { useAuthStore } from '@/store/authStore';
import { usePersonalization } from '@/hooks/usePersonalization';
import { stripAiKey, useAiKeyPersistence } from '@/hooks/useAiKeyPersistence';
import type { UserPreferences } from '@/api/auth';
import { logger } from '@/utils/logger';

/**
 * Таб «Провайдеры» — настройки альтернативных AI-провайдеров.
 * Задел на будущее: рекомендации сейчас работают через Claude / Codex
 * (таб «Интеграции & AI»), эти поля сохраняются в профиль для следующих фич.
 */
export function ProvidersTab() {
  const { user } = useAuthStore();
  const { aiKey } = usePersonalization();
  const persistAiKey = useAiKeyPersistence();

  const [draft, setDraft] = useState<Partial<UserPreferences>>(() => ({
    aiProvider: user?.preferences?.aiProvider,
    aiLimits: user?.preferences?.aiLimits,
    aiKey: aiKey || undefined,
  }));
  const [isSaving, setIsSaving] = useState(false);

  const handleLimitChange = (
    field: 'dailyRequests' | 'maxTokens',
    value: string,
  ) => {
    const numValue = parseInt(value) || 0;
    setDraft((prev) => ({
      ...prev,
      aiLimits: {
        ...prev.aiLimits,
        [field]: numValue,
      },
    }));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      persistAiKey(draft.aiKey);
      const safePrefs = stripAiKey(draft);

      await useAuthStore.getState().updateProfile({
        preferences: {
          ...user?.preferences,
          ...(safePrefs as UserPreferences),
        },
      });

      toast.success('Настройки провайдеров сохранены');
    } catch (e) {
      toast.error('Ошибка сохранения настроек');
      logger.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
              <Blocks className="h-5 w-5" />
            </div>
            Дополнительные провайдеры
            <Badge
              variant="secondary"
              className="ml-auto text-[10px] uppercase tracking-wider"
            >
              <FlaskConical className="w-3 h-3 mr-1" />
              Скоро
            </Badge>
          </CardTitle>
          <CardDescription>
            OpenAI, Gemini, Cohere и локальные LLM. Сейчас рекомендации
            работают через Claude / Codex — эти настройки сохранятся для
            будущих фич.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ai-provider">Провайдер</Label>
            <Select
              value={draft.aiProvider || ''}
              onValueChange={(provider) =>
                setDraft((prev) => ({ ...prev, aiProvider: provider }))
              }
            >
              <SelectTrigger id="ai-provider">
                <SelectValue placeholder="Выберите провайдера" />
              </SelectTrigger>
              <SelectContent>
                {GENERIC_AI_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-key">API key</Label>
            <Input
              id="ai-key"
              type="password"
              placeholder={
                user?.preferences?.hasAiKey
                  ? 'Ключ сохранён — введите новый для замены'
                  : 'sk-...'
              }
              value={draft.aiKey || ''}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, aiKey: e.target.value }))
              }
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Ключ хранится локально на устройстве и не отправляется на сервер.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="daily-requests" className="text-xs">
                Лимит запросов/день
              </Label>
              <Input
                id="daily-requests"
                type="number"
                min="0"
                placeholder="100"
                value={draft.aiLimits?.dailyRequests || ''}
                onChange={(e) =>
                  handleLimitChange('dailyRequests', e.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max-tokens" className="text-xs">
                Максимум токенов
              </Label>
              <Input
                id="max-tokens"
                type="number"
                min="0"
                placeholder="4000"
                value={draft.aiLimits?.maxTokens || ''}
                onChange={(e) => handleLimitChange('maxTokens', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Сохраняю…' : 'Сохранить'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="p-2 rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
              <Cpu className="h-4 w-4" />
            </div>
            Как это будет работать
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            В следующих версиях выбранный провайдер сможет генерировать
            рекомендации наравне с Claude и Codex — без ввода ключа заново.
          </p>
          <p>
            Лимиты (запросы/день и токены) ограничат расходы при облачных
            вызовах.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
