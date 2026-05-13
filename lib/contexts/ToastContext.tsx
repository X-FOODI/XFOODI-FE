'use client'

import Toast, { ToastType } from '@/components/ui/Toast';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
    if (process.env.NODE_ENV !== "production") {
      // Debug log to verify toast flow in dev
      // eslint-disable-next-line no-console
      console.log("[ToastProvider] showToast called", { type, title, message, duration });
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = { id, type, title, message, duration };
    
    setToasts(prev => {
      // Limit to maximum 5 toasts
      const updatedToasts = [...prev, newToast];
      if (updatedToasts.length > 5) {
        return updatedToasts.slice(-5);
      }
      return updatedToasts;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: 96,
          right: 16,
          zIndex: 100000,
          maxWidth: "420px",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              marginBottom: 12,
              pointerEvents: "auto",
            }}
          >
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
