'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { forwardRef, useCallback } from 'react';

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
 * Supports forwardRef so parent pages can call ref.current?.reset()
 * after a failed submission to force a fresh, valid token on retry.
 *
 * Usage:
 * ```tsx
 * const turnstileRef = useRef<TurnstileInstance | null>(null);
 *
 * <TurnstileWidget
 *   ref={turnstileRef}
 *   onSuccess={(token) => setTurnstileToken(token)}
 *   onExpire={() => setTurnstileToken('')}
 * />
 *
 * // After an error:
 * turnstileRef.current?.reset();
 * setTurnstileToken('');
 * ```
 */
const TurnstileWidget = forwardRef<TurnstileInstance, TurnstileWidgetProps>(
  function TurnstileWidget(
    { onSuccess, onExpire, onError, theme = 'auto', className = '' },
    ref
  ) {
    const handleExpire = useCallback(() => {
      onExpire?.();
    }, [onExpire]);

    const handleError = useCallback(() => {
      onError?.();
    }, [onError]);

    if (!SITE_KEY) {
      if (process.env.NODE_ENV === 'development') {
        return (
          <div
            className={`text-xs text-yellow-500 p-2 border border-yellow-500/30 rounded-lg bg-yellow-500/5 ${className}`}
          >
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
);

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
export { type TurnstileInstance };
