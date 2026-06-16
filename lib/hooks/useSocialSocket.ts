'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

function getSocketBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '');
  if (api) return api;
  return window.location.origin;
}

interface UseSocialSocketOptions {
  enabled?: boolean;
}

/**
 * Socket.io client for /hubs/social (replaces ASP.NET SignalR negotiate for XFOODI-BE).
 */
export function useSocialSocket({ enabled = true }: UseSocialSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token =
      localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    if (!token) return;

    const socket = io(getSocketBaseUrl(), {
      path: '/hubs/social/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled]);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { isConnected, on, off };
}
