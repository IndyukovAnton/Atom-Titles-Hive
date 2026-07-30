import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useNotificationStore = create()(persist((set) => ({
    notifications: [],
    unreadCount: 0,
    addNotification: (notification) => {
        const newNotification = {
            ...notification,
            id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
            createdAt: Date.now(),
            isRead: false,
        };
        set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },
    markAsRead: (id) => {
        set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (!notification || notification.isRead)
                return state;
            const updatedNotifications = state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n);
            return {
                notifications: updatedNotifications,
                unreadCount: state.unreadCount - 1,
            };
        });
    },
    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        }));
    },
    removeNotification: (id) => {
        set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (!notification)
                return state;
            const wasUnread = !notification.isRead;
            const updatedNotifications = state.notifications.filter((n) => n.id !== id);
            return {
                notifications: updatedNotifications,
                unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
            };
        });
    },
    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },
}), {
    name: 'notification-storage',
}));
