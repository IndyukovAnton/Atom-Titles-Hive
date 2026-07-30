import { CloudOff } from 'lucide-react';

/** Единое состояние ошибки загрузки для секций рекомендаций. */
export function RecommendationsError() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
      <CloudOff className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Не удалось загрузить рекомендации</h3>
      <p className="text-muted-foreground max-w-sm mt-2">
        Проверьте подключение к серверу и попробуйте обновить страницу.
      </p>
    </div>
  );
}
