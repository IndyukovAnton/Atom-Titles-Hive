import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Brain } from 'lucide-react';
import { toast } from 'sonner';

import { recommendationsApi } from '@/api/recommendations';
import type { RecommendationItem } from '@/api/recommendations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecommendationsGrid } from './RecommendationsGrid';

interface AiAssistantSectionProps {
  onAdd: (item: RecommendationItem) => void;
}

export function AiAssistantSection({ onAdd }: AiAssistantSectionProps) {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { prompt: string; provider: string; apiKey?: string }) =>
      recommendationsApi.getAiRecommendations(
        data.prompt,
        data.provider,
        data.apiKey,
      ),
    onError: () => {
      toast.error('Failed to generate recommendations');
    },
    onSuccess: () => {
      toast.success('Recommendations generated successfully!');
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    mutation.mutate({ prompt, provider, apiKey });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit border-0 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              AI Assistant
            </CardTitle>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                mutation.isPending
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-green-500/15 text-green-600 dark:text-green-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  mutation.isPending
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-green-500'
                }`}
              />
              {mutation.isPending ? 'Processing' : 'Ready'}
            </div>
          </div>
          <CardDescription>
            Умные рекомендации на основе ваших предпочтений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Провайдер</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="focus:ring-indigo-500">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="local">Local LLM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">
                API Key{' '}
                <span className="text-muted-foreground font-normal">
                  (опционально)
                </span>
              </label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="focus-visible:ring-indigo-500"
              />
              <p className="text-xs text-muted-foreground">
                Оставьте пустым для использования системного ключа
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Ваш запрос</label>
              <textarea
                className="flex w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-none"
                placeholder="Хочу что-то похожее на Cyberpunk Edgerunners, но с большим количеством комедии..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg"
              size="lg"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Сгенерировать
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {mutation.data ? (
          <RecommendationsGrid items={mutation.data} type="ai" onAdd={onAdd} />
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center text-muted-foreground bg-gradient-to-br from-indigo-500/5 to-violet-500/5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 mb-4">
              <Brain className="w-12 h-12 text-indigo-500/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Готов к работе
            </h3>
            <p className="max-w-md mt-2">
              Опишите, что вы ищете, и наш AI проанализирует тысячи тайтлов,
              чтобы найти идеальное совпадение.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
