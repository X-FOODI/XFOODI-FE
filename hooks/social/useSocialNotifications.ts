'use client';

import { useNotificationStore } from '@/store/social';
import type { SocialNotification } from '@/lib/types/social';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSocialSocket } from '@/lib/hooks/useSocialSocket';
import { useCallback, useEffect, useRef } from 'react';

export function useSocialNotifications() {
  const { user, isAuthReady } = useAuth();
  const { notifications, unreadCount, refresh, prependNotification, markRead, markAllRead, loading } =
    useNotificationStore();
  const refreshedRef = useRef(false);

  const { on, off, isConnected } = useSocialSocket({
    enabled: isAuthReady && !!user,
  });

  useEffect(() => {
    if (!isAuthReady || !user || refreshedRef.current) return;
    refreshedRef.current = true;
    refresh();
  }, [isAuthReady, user, refresh]);

  const handleRealtime = useCallback(
    (payload: SocialNotification) => {
      if (payload?.id) prependNotification(payload);
    },
    [prependNotification]
  );

  useEffect(() => {
    if (!isConnected) return;
    const handler = (payload: unknown) => handleRealtime(payload as SocialNotification);
    on('ReceiveNotification', handler);
    on('NotificationReceived', handler);
    return () => {
      off('ReceiveNotification', handler);
      off('NotificationReceived', handler);
    };
  }, [isConnected, on, off, handleRealtime]);

  useEffect(() => {
    if (!isAuthReady || !user || isConnected) return;
    const interval = setInterval(() => refresh(), 60_000);
    return () => clearInterval(interval);
  }, [isAuthReady, user, isConnected, refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
    isRealtimeConnected: isConnected,
  };
}
