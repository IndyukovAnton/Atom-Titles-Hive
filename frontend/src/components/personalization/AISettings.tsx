import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Shield, KeyRound, Cpu } from 'lucide-react';
import type { UserPreferences } from '@/api/auth';

const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI (GPT)' },
  { id: 'anthropic', name: 'Anthropic (Claude)' },
  { id: 'google', name: 'Google (Gemini)' },
  { id: 'cohere', name: 'Cohere' },
  { id: 'local', name: 'Local LLM' },
];

interface AISettingsProps {
  preferences?: UserPreferences;
  onChange: (preferences: Partial<UserPreferences>) => void;
}

export function AISettings({ preferences, onChange }: AISettingsProps) {
  const handleProviderChange = (provider: string) => {
    onChange({ aiProvider: provider });
  };

  const handleKeyChange = (key: string) => {
    onChange({ aiKey: key });
  };

  const handleLimitChange = (field: 'dailyRequests' | 'maxTokens', value: string) => {
    const numValue = parseInt(value) || 0;
    onChange({
      aiLimits: {
        ...preferences?.aiLimits,
        [field]: numValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <p>Настройки AI используются для модуля рекомендаций. Ваши ключи хранятся зашифрованными.</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label htmlFor="ai-provider" className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Провайдер
        </Label>
        <Select
          value={preferences?.aiProvider || ''}
          onValueChange={handleProviderChange}
        >
          <SelectTrigger id="ai-provider">
            <SelectValue placeholder="Выберите провайдера AI" />
          </SelectTrigger>
          <SelectContent>
            {AI_PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label htmlFor="ai-key" className="flex items-center gap-2">
          <KeyRound className="w-4 h-4" />
          API Key
        </Label>
        <Input
          id="ai-key"
          type="password"
          placeholder="Введите ваш API ключ"
          value={preferences?.aiKey || ''}
          onChange={(e) => handleKeyChange(e.target.value)}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Ключ будет храниться безопасно и использоваться только для запросов от вашего имени.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="daily-requests">Лимит запросов в день</Label>
          <Input
            id="daily-requests"
            type="number"
            min="0"
            placeholder="100"
            value={preferences?.aiLimits?.dailyRequests || ''}
            onChange={(e) => handleLimitChange('dailyRequests', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-tokens">Максимум токенов</Label>
          <Input
            id="max-tokens"
            type="number"
            min="0"
            placeholder="4000"
            value={preferences?.aiLimits?.maxTokens || ''}
            onChange={(e) => handleLimitChange('maxTokens', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
