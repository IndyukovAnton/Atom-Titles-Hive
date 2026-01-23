import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationType } from '@/store/notificationStore';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onAction?: (notification: Notification) => void;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <X className="h-5 w-5 text-red-500" />;
    case 'recommendation':
      return <Sparkles className="h-5 w-5 text-purple-500" />;
    case 'update':
      return <Zap className="h-5 w-5 text-blue-500" />;
    case 'system':
      return <Bell className="h-5 w-5 text-primary" />;
    default:
      return <Info className="h-5 w-5 text-blue-400" />;
  }
};

export const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onRemove,
  onAction
}: NotificationItemProps) => {
  const { id, title, message, type, isRead, createdAt, link, actionLabel } = notification;

  return (
    <div 
      className={cn(
        "relative flex gap-4 p-4 transition-colors hover:bg-muted/50 border-b last:border-0 group",
        !isRead && "bg-muted/20"
      )}
    >
      <div className="mt-1 flex-shrink-0">
        {getIcon(type)}
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium leading-none", !isRead && "font-semibold text-foreground")}>
            {title}
          </p>
          <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
            <Clock className="mr-1 h-3 w-3" />
            {formatDistanceToNow(createdAt, { addSuffix: true, locale: ru })}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {message}
        </p>
        
        {(link || actionLabel) && (
            <div className="pt-2">
                <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => onAction && onAction(notification)}
                >
                    {actionLabel || 'Подробнее'}
                </Button>
            </div>
        )}
      </div>

      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border p-0.5">
         {!isRead && (
            <Button
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:text-primary"
              title="Прочитать"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(id);
              }}
            >
              <div className="h-2 w-2 rounded-full bg-primary" />
            </Button>
         )}
         <Button
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:text-destructive"
            title="Удалить"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
         >
            <X className="h-3 w-3" />
         </Button>
      </div>
      
      {/* Unread indicator dot if not hovered (for mobile mostly, but visible on desktop too just in case) */}
      {!isRead && (
          <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary group-hover:opacity-0 transition-opacity" />
      )}
    </div>
  );
};
