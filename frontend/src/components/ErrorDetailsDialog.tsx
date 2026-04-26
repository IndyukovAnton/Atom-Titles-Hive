import { AlertCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export interface LoggedError {
  id: string;
  message: string;
  context?: string;
  stack?: string;
  at: Date;
}

interface ErrorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: LoggedError[];
  onClear?: () => void;
  title?: string;
  description?: string;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export function ErrorDetailsDialog({
  open,
  onOpenChange,
  errors,
  onClear,
  title = 'Стек ошибок',
  description = 'Полный список ошибок этой сессии. Поможет, если нужно показать поддержке, что именно пошло не так.',
}: ErrorDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {errors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Пока ошибок нет.
            </p>
          ) : (
            <ol className="space-y-3 py-2">
              {errors.map((err, idx) => (
                <li
                  key={err.id}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">
                      #{errors.length - idx} · {formatTime(err.at)}
                    </span>
                    {err.context && (
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase tracking-wider">
                        {err.context}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{err.message}</p>
                  {err.stack && (
                    <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto bg-background/50 rounded p-2 border">
                      {err.stack}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          )}
        </ScrollArea>

        {onClear && errors.length > 0 && (
          <div className="flex justify-end pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Очистить лог
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
