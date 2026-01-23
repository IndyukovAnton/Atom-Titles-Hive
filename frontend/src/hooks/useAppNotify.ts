
import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationType } from '@/store/notificationStore';
import { toast } from 'sonner';

export const useAppNotify = () => {
  const addNotification = useNotificationStore((state) => state.addNotification);

  const notify = (title: string, message: string, type: NotificationType = 'system') => {
    // Save to history
    addNotification({
      title,
      message,
      type,
    });

    // Show toast
    switch (type) {
        case 'recommendation':
            toast.message(title, { description: message, icon: '⭐' });
            break;
        case 'update':
            toast.success(title, { description: message });
            break;
        case 'system':
        default:
            toast.info(title, { description: message });
            break;
    }
  };

  return { notify };
};
