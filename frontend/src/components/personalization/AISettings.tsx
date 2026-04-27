import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Cpu,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { UserPreferences } from '@/api/auth';
import { recommendationsApi, type CliStatus } from '@/api/recommendations';

const CLAUDE_MODELS: {
  id: NonNullable<UserPreferences['claudeModel']>;
  name: string;
  hint: string;
}[] = [
  { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6', hint: 'Сбалансированный (рекомендуется)' },
  { id: 'claude-opus-4-7', name: 'Opus 4.7', hint: 'Самый умный, дороже' },
  { id: 'claude-haiku-4-5', name: 'Haiku 4.5', hint: 'Быстрый и дешёвый' },
];

interface AISettingsProps {
  preferences?: UserPreferences;
  onChange: (preferences: Partial<UserPreferences>) => void;
}

export function AISettings({ preferences, onChange }: AISettingsProps) {
  const source = preferences?.aiSource ?? 'claude-api';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="w-4 h-4" />
        <p>
          Настройки AI используются для персональных рекомендаций.
          {source === 'claude-cli'
            ? ' Локальный CLI работает на вашем устройстве — данные никуда не уходят, кроме вашего собственного входа в Claude.'
            : ' Облачный API передаёт данные в Anthropic.'}
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Источник рекомендаций
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SourceCard
            active={source === 'claude-api'}
            onSelect={() => onChange({ aiSource: 'claude-api' })}
            icon={<Cloud className="w-5 h-5" />}
            title="Claude (Cloud API)"
            subtitle="Через API key Anthropic"
          />
          <SourceCard
            active={source === 'claude-cli'}
            onSelect={() => onChange({ aiSource: 'claude-cli' })}
            icon={<Terminal className="w-5 h-5" />}
            title="Claude (Local CLI)"
            subtitle="Через локально установленный claude"
          />
        </div>
      </div>

      <Separator />

      {source === 'claude-api' ? (
        <ApiSection preferences={preferences} onChange={onChange} />
      ) : (
        <CliSection preferences={preferences} onChange={onChange} />
      )}

      <Separator />

      <GenericProviderSection preferences={preferences} onChange={onChange} />
    </div>
  );
}

function SourceCard({
  active,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
        active
          ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 shadow-md'
          : 'border-border bg-background/60 hover:border-indigo-500/40'
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          active
            ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <ChevronRight
        className={`w-4 h-4 ${active ? 'text-indigo-500' : 'text-muted-foreground/40'}`}
      />
    </button>
  );
}

const GENERIC_AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI (GPT)' },
  { id: 'anthropic', name: 'Anthropic (Claude API)' },
  { id: 'google', name: 'Google (Gemini)' },
  { id: 'cohere', name: 'Cohere' },
  { id: 'local', name: 'Local LLM' },
];

function GenericProviderSection({
  preferences,
  onChange,
}: {
  preferences?: UserPreferences;
  onChange: (preferences: Partial<UserPreferences>) => void;
}) {
  const handleLimitChange = (
    field: 'dailyRequests' | 'maxTokens',
    value: string,
  ) => {
    const numValue = parseInt(value) || 0;
    onChange({
      aiLimits: {
        ...preferences?.aiLimits,
        [field]: numValue,
      },
    });
  };

  return (
    <details className="rounded-xl border bg-background/40 group">
      <summary className="cursor-pointer select-none flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
        <span className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Дополнительные провайдеры (OpenAI / Gemini / etc.)
        </span>
        <span className="text-xs text-muted-foreground">
          для будущих фич
        </span>
      </summary>
      <div className="border-t px-4 py-4 space-y-4">
        <p className="text-xs text-muted-foreground">
          Эти настройки сохраняются в профиле, но в текущей версии
          рекомендации используют только Claude. Раздел задел на расширения.
        </p>

        <div className="space-y-2">
          <Label htmlFor="ai-provider">Провайдер</Label>
          <Select
            value={preferences?.aiProvider || ''}
            onValueChange={(provider) => onChange({ aiProvider: provider })}
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
            placeholder="..."
            value={preferences?.aiKey || ''}
            onChange={(e) => onChange({ aiKey: e.target.value })}
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="daily-requests" className="text-xs">
              Лимит запросов/день
            </Label>
            <Input
              id="daily-requests"
              type="number"
              min="0"
              placeholder="100"
              value={preferences?.aiLimits?.dailyRequests || ''}
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
              value={preferences?.aiLimits?.maxTokens || ''}
              onChange={(e) => handleLimitChange('maxTokens', e.target.value)}
            />
          </div>
        </div>
      </div>
    </details>
  );
}

function ApiSection({
  preferences,
  onChange,
}: {
  preferences?: UserPreferences;
  onChange: (preferences: Partial<UserPreferences>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label htmlFor="anthropic-key" className="flex items-center gap-2">
          <KeyRound className="w-4 h-4" />
          Anthropic API key
        </Label>
        <Input
          id="anthropic-key"
          type="password"
          placeholder="sk-ant-..."
          value={preferences?.anthropicApiKey || ''}
          onChange={(e) => onChange({ anthropicApiKey: e.target.value })}
          autoComplete="off"
        />
        <a
          href="https://console.anthropic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Получить ключ на console.anthropic.com
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-3">
        <Label htmlFor="claude-model" className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Модель по умолчанию
        </Label>
        <Select
          value={preferences?.claudeModel || 'claude-sonnet-4-6'}
          onValueChange={(value) =>
            onChange({ claudeModel: value as UserPreferences['claudeModel'] })
          }
        >
          <SelectTrigger id="claude-model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLAUDE_MODELS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex flex-col">
                  <span>{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {m.hint}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between space-x-2 rounded-xl border bg-background/40 px-4 py-3">
        <Label
          htmlFor="claude-web-search-api"
          className="flex flex-col space-y-1"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Поиск новинок в вебе
          </span>
          <span className="font-normal text-xs text-muted-foreground">
            Claude проверит свежие релизы (≈$0.05 / запрос)
          </span>
        </Label>
        <Switch
          id="claude-web-search-api"
          checked={preferences?.claudeUseWebSearch ?? true}
          onCheckedChange={(checked) =>
            onChange({ claudeUseWebSearch: checked })
          }
        />
      </div>
    </div>
  );
}

function CliSection({
  preferences,
  onChange,
}: {
  preferences?: UserPreferences;
  onChange: (preferences: Partial<UserPreferences>) => void;
}) {
  const [status, setStatus] = useState<CliStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await recommendationsApi.getCliStatus();
      setStatus(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось проверить CLI');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-background/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CliStatusIcon status={status} loading={loading} error={error} />
            <div>
              <div className="text-sm font-semibold">
                {loading
                  ? 'Проверяю Claude CLI...'
                  : error
                    ? 'Ошибка проверки CLI'
                    : !status?.installed
                      ? 'Claude CLI не найден'
                      : !status.authed
                        ? 'CLI установлен, но не авторизован'
                        : `Claude CLI готов${status.version ? ` (v${status.version})` : ''}`}
              </div>
              {(error || status?.error || status?.path) && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {error || status?.error || `Путь: ${status?.path}`}
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refresh()}
            disabled={loading}
            className="gap-1"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="w-3.5 h-3.5" />
            )}
            Re-check
          </Button>
        </div>

        {!status?.installed && !loading && (
          <div className="text-xs text-muted-foreground space-y-1.5 pt-1">
            <p>Чтобы использовать Claude CLI, установите его:</p>
            <code className="block bg-muted px-2 py-1.5 rounded text-[11px]">
              npm install -g @anthropic-ai/claude-code
            </code>
            <p>Затем выполните <code className="bg-muted px-1 rounded">claude</code> и войдите в аккаунт Anthropic.</p>
          </div>
        )}

        {status?.installed && !status.authed && !loading && (
          <div className="text-xs text-muted-foreground space-y-1.5 pt-1">
            <p>CLI установлен, но требует входа. В терминале выполните:</p>
            <code className="block bg-muted px-2 py-1.5 rounded text-[11px]">
              claude
            </code>
            <p>и войдите. После этого нажмите Re-check.</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="claude-cli-path" className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Путь к бинарю
          <span className="text-muted-foreground font-normal text-xs">
            (опционально, если не в PATH)
          </span>
        </Label>
        <Input
          id="claude-cli-path"
          type="text"
          placeholder="claude"
          value={preferences?.claudeCliPath || ''}
          onChange={(e) => onChange({ claudeCliPath: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Оставьте пустым для авто-определения. Пример: <code className="bg-muted px-1 rounded">/usr/local/bin/claude</code> или <code className="bg-muted px-1 rounded">C:\Users\...\claude.cmd</code>
        </p>
      </div>

      <div className="flex items-center justify-between space-x-2 rounded-xl border bg-background/40 px-4 py-3">
        <Label
          htmlFor="claude-web-search-cli"
          className="flex flex-col space-y-1"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Разрешать WebSearch
          </span>
          <span className="font-normal text-xs text-muted-foreground">
            Claude CLI воспользуется встроенным WebSearch для новинок
          </span>
        </Label>
        <Switch
          id="claude-web-search-cli"
          checked={preferences?.claudeUseWebSearch ?? true}
          onCheckedChange={(checked) =>
            onChange({ claudeUseWebSearch: checked })
          }
        />
      </div>
    </div>
  );
}

function CliStatusIcon({
  status,
  loading,
  error,
}: {
  status: CliStatus | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (error || !status?.installed) {
    return (
      <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
        <XCircle className="w-5 h-5" />
      </div>
    );
  }
  if (!status.authed) {
    return (
      <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="p-2 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400">
      <CheckCircle2 className="w-5 h-5" />
    </div>
  );
}
