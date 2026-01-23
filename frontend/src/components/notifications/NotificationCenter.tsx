import { useState } from 'react';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationItem } from './NotificationItem';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotificationStore();

  const handleAction = (notification: { id: string; link?: string }) => {
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
    markAsRead(notification.id);
  };

  const filteredNotifications = (tab: string) => {
     if (tab === 'unread') return notifications.filter(n => !n.isRead);
     if (tab === 'system') return notifications.filter(n => n.type === 'system' || n.type === 'update');
     return notifications;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full animate-in zoom-in"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
             <h4 className="font-semibold leading-none">Уведомления</h4>
             {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} новых</Badge>}
          </div>
          <div className="flex gap-1">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={markAllAsRead}
                title="Пометить все как прочитанные"
                disabled={unreadCount === 0}
            >
                <CheckCheck className="h-4 w-4" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={clearAll}
                title="Очистить историю"
                disabled={notifications.length === 0}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="px-4 py-2 border-b bg-muted/30">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="all" className="text-xs">Все</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Непрочитанные</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">Системные</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="h-[400px]">
             {['all', 'unread', 'system'].map((tab) => (
                <TabsContent key={tab} value={tab} className="m-0 focus-visible:ring-0 focus-visible:outline-none">
                    {filteredNotifications(tab).length > 0 ? (
                        <div className="flex flex-col">
                            {filteredNotifications(tab).map((notification) => (
                                <NotificationItem 
                                    key={notification.id} 
                                    notification={notification} 
                                    onMarkAsRead={markAsRead}
                                    onRemove={removeNotification}
                                    onAction={handleAction}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-4 text-muted-foreground">
                            <Bell className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-sm">Нет уведомлений</p>
                        </div>
                    )}
                </TabsContent>
             ))}
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
