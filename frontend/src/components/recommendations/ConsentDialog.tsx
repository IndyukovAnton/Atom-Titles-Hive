import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ConsentDialogProps {
  open: boolean;
  onCancel: () => void;
  onAccept: () => void;
}

export function ConsentDialog({ open, onCancel, onAccept }: ConsentDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            Передача данных в Anthropic
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            Запрос будет отправлен напрямую в Anthropic (Claude) с вашим API
            ключом.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Передаётся:</strong> список
            ваших тайтлов (название, оценка, жанры, статус), ваш текстовый
            запрос и выбранное настроение.
          </p>
          <p>
            <strong className="text-foreground">НЕ передаётся:</strong> email,
            пароль, личные данные профиля, ID пользователя.
          </p>
          <p className="text-xs">
            Anthropic может использовать запрос для улучшения моделей согласно
            их Terms of Service. Если вы используете privacy-mode ключ — не
            будет.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0"
            onClick={onAccept}
          >
            Отправить и больше не спрашивать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
