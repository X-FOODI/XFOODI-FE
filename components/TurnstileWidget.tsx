'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useCallback } from 'react';

interface TurnstileWidgetProps {
  /** Called when the user successfully completes the challenge */
  onSuccess: (token: string) => void;
  /** Called when the challenge expires (token becomes invalid) */
  onExpire?: () => void;
  /** Called when an error occurs */
  onError?: () => void;
  /** Theme: 'auto' follows system dark/light mode */
  theme?: 'auto' | 'light' | 'dark';
  /** Additional CSS class */
  className?: string;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/**
 * Reusable Cloudflare Turnstile widget for bot protection.
 * Wraps @marsidev/react-turnstile with consistent styling and behavior.
 * 
 * Usage:
 * ```tsx
 * <TurnstileWidget 
 *   onSuccess={(token) => setTurnstileToken(token)} 
 *   onExpire={() => setTurnstileToken('')}
 * />
 * ```
 */
export default function TurnstileWidget({
  onSuccess,
  onExpire,
  onError,
  theme = 'auto',
  className = '',
}: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance | null>(null);

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  const handleError = useCallback(() => {
    onError?.();
  }, [onError]);

  if (!SITE_KEY) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`text-xs text-yellow-500 p-2 border border-yellow-500/30 rounded-lg bg-yellow-500/5 ${className}`}>
          ⚠️ NEXT_PUBLIC_TURNSTILE_SITE_KEY not set — Turnstile disabled in dev
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <Turnstile
        ref={ref}
        siteKey={SITE_KEY}
        onSuccess={onSuccess}
        onExpire={handleExpire}
        onError={handleError}
        options={{
          theme,
          size: 'flexible',
        }}
      />
    </div>
  );
}

/**
 * Hook-style helper to reset the Turnstile widget.
 * Use the ref from TurnstileWidget to call reset after form submission failures.
 */
export { type TurnstileInstance };
