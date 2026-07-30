import { useNotificationStore } from '@/store/notificationStore';
import { toast } from '@/utils/app-toast';
export const useAppNotify = () => {
    const addNotification = useNotificationStore((state) => state.addNotification);
    const notify = (title, message, type = 'system') => {
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
            case 'success':
                toast.success(title, { description: message });
                break;
            case 'warning':
                toast.warning(title, { description: message });
                break;
            case 'error':
                toast.error(title, { description: message });
                break;
            case 'info':
            case 'system':
            default:
                toast.info(title, { description: message });
                break;
        }
    };
    return { notify };
};
