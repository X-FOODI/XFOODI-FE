'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export interface Notification {
  id: string;
  icon?: ReactNode;
  title: string;
  description: string;
  timestamp: Date;
  unread: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'unread'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Đơn hàng mới',
      description: 'Bạn có đơn hàng mới #1234 đang chờ xử lý',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      unread: true,
    },
    {
      id: '2',
      title: 'Đặt bàn thành công',
      description: 'Bàn số 5 đã được đặt thành công lúc 19:30',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      unread: true,
    },
    {
      id: '3',
      title: 'Khuyến mãi mới',
      description: 'Giảm 20% cho tất cả món ăn trong tuần này',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'unread'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      unread: true,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}


