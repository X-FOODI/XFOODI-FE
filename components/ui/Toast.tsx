import {
    CheckCircleFilled,
    CloseCircleFilled,
    CloseOutlined,
    ExclamationCircleFilled,
    InfoCircleFilled
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  // Default to true to ensure visibility even if effect delays
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Optional: add slight delay if you want entry animation, 
    // but for debugging let's keep it simple or use CSS animation class
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(progressTimer);
        }
      }, 50);

      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearInterval(progressTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          borderColor: 'border-l-green-500',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-500',
          icon: <CheckCircleFilled className="text-xl" />,
          progressColor: 'bg-green-500'
        };
      case 'error':
        return {
          borderColor: 'border-l-red-500',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-500',
          icon: <CloseCircleFilled className="text-xl" />,
          progressColor: 'bg-red-500'
        };
      case 'warning':
        return {
          borderColor: 'border-l-yellow-500',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-600 dark:text-yellow-500',
          icon: <ExclamationCircleFilled className="text-xl" />,
          progressColor: 'bg-yellow-500'
        };
      case 'info':
        return {
          borderColor: 'border-l-blue-500',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-500',
          icon: <InfoCircleFilled className="text-xl" />,
          progressColor: 'bg-blue-500'
        };
      default:
        return {
          borderColor: 'border-l-gray-500',
          iconBg: 'bg-gray-100 dark:bg-gray-800',
          iconColor: 'text-gray-600 dark:text-gray-400',
          icon: <InfoCircleFilled className="text-xl" />,
          progressColor: 'bg-gray-500'
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      className={`
        max-w-sm w-full ${config.borderColor} border-l-4 rounded-lg shadow-xl
        transform transition-all duration-300 ease-in-out pointer-events-auto
        ${!isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-[120%] opacity-0 scale-95'
        }
      `}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        background: 'var(--card)',
        color: 'var(--text)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${config.iconBg} rounded-full p-2 mr-3`}>
            <div className={config.iconColor}>
              {config.icon}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold leading-5"
              style={{ color: 'var(--text)' }}
            >
              {title}
            </p>
            {message && (
              <p
                className="mt-1 text-sm leading-5"
                style={{ color: 'var(--text-muted)' }}
              >
                {message}
              </p>
            )}
          </div>
          
          {/* Close Button */}
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200"
            >
              <span className="sr-only">Close</span>
              <CloseOutlined className="text-sm" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      {duration > 0 && (
        <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${config.progressColor}`}
            style={{
              width: `${progress}%`,
              transition: 'width 50ms linear'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
