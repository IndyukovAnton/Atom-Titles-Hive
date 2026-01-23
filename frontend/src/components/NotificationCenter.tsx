
import { useState, useEffect, useCallback, memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Trash2, Info, Star, Zap } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification, NotificationType } from '@/store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Helper component for Icon
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'system': return <Info className="h-4 w-4 text-blue-500" />;
    case 'recommendation': return <Star className="h-4 w-4 text-yellow-500" />;
    case 'update': return <Zap className="h-4 w-4 text-green-500" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

// Выносим компонент NotificationItem
interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const NotificationItem = memo(function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  return (
  <div 
    className={cn(
      "flex flex-col gap-2 p-4 border-b hover:bg-muted/50 transition-colors relative group",
      !notification.isRead && "bg-muted/30"
    )}
    onClick={() => onMarkRead(notification.id)}
  >
    <div className="flex items-start gap-3">
      <div className="mt-1"><NotificationIcon type={notification.type} /></div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className={cn("text-sm font-medium leading-none", !notification.isRead && "font-bold")}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ru })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
      </div>
    </div>
    
    {!notification.isRead && (
      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
    )}

    <Button
      variant="ghost"
      size="icon"
      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-all"
      onClick={(e) => onDelete(notification.id, e)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
  );
});

// Выносим компонент списка
interface NotificationListProps {
  notifications: Notification[];
  type?: NotificationType;
  onMarkRead: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const NotificationList = memo(function NotificationList({ notifications, type, onMarkRead, onDelete }: NotificationListProps) {
  const list = type 
    ? notifications.filter(n => n.type === type)
    : notifications;

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <Bell className="h-8 w-8 mb-2 opacity-20" />
        <p>Нет уведомлений</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {list.map(n => (
        <NotificationItem 
          key={n.id} 
          notification={n} 
          onMarkRead={onMarkRead} 
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

// Иконка плюса
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    addNotification 
  } = useNotificationStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const unread = unreadCount; // unreadCount is number, not function
  const hasNotifications = notifications.length > 0;

  // Mock notifications for demonstration/testing
  useEffect(() => {
    // Only add mock notifications if empty to avoid spamming on reload
    if (!hasNotifications) {
      addNotification({
        title: 'Добро пожаловать!',
        message: 'Система уведомлений активирована.',
        type: 'system',
      });
    }
  }, [addNotification, hasNotifications]); // Run once on mount or when empty

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(id);
    toast.success('Уведомление удалено');
  }, [removeNotification]);

  const handleClearAll = useCallback(() => {
    clearAll();
    toast.success('Все уведомления удалены');
  }, [clearAll]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
    toast.success('Все уведомления прочитаны');
  }, [markAllAsRead]);

  // Simulation function
  const simulateNotification = () => {
    const types = ['system', 'recommendation', 'update'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const titles = {
      system: ['Системное сообщение', 'Обслуживание', 'Безопасность'],
      recommendation: ['Новый фильм для вас', 'Вам может понравиться', 'Топ недели'],
      update: ['Версия 2.0', 'Новые функции', 'Исправления ошибок'],
    };
    const title = titles[type][Math.floor(Math.random() * 3)];
    
    addNotification({
      title,
      message: `Это тестовое уведомление типа ${type}. Время: ${new Date().toLocaleTimeString()}`,
      type,
    });
    toast.info(`Новое уведомление: ${title}`);
  };



  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Уведомления">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background"
            >
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col font-sans">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Уведомления</SheetTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                title="Отметить все как прочитанные" 
                onClick={handleMarkAllRead}
                disabled={unread === 0}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Очистить все" 
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription className="hidden">
            Центр уведомлений
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <div className="px-6 py-2 border-b">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="system"><Info className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="recommendation"><Star className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="update"><Zap className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="all" className="m-0">
              <NotificationList notifications={notifications} onMarkRead={handleMarkAsRead} onDelete={handleDelete} />
            </TabsContent>
            <TabsContent value="system" className="m-0">
              <NotificationList notifications={notifications} type="system" onMarkRead={handleMarkAsRead} onDelete={handleDelete} />
            </TabsContent>
            <TabsContent value="recommendation" className="m-0">
              <NotificationList notifications={notifications} type="recommendation" onMarkRead={handleMarkAsRead} onDelete={handleDelete} />
            </TabsContent>
            <TabsContent value="update" className="m-0">
              <NotificationList notifications={notifications} type="update" onMarkRead={handleMarkAsRead} onDelete={handleDelete} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        {/* Debug/Demo Control */}
        <div className="p-4 border-t bg-muted/20">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={simulateNotification}>
                <PlusIcon className="mr-2 h-3 w-3" /> Тест: Создать уведомление
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


