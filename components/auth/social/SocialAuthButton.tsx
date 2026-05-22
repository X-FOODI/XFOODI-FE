"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Shared layout + colors for Google / phone social login (always dark text on white). */
export const socialAuthButtonClassName =
  "social-auth-btn relative w-full h-12 min-h-[3rem] inline-flex items-center justify-center gap-3 rounded-xl border border-[#ddd] bg-white px-4 py-3 text-sm font-medium leading-snug text-gray-800 shadow-sm transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 aria-[busy=true]:pointer-events-none aria-[busy=true]:cursor-wait";

export type SocialAuthButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled"
> & {
  icon: ReactNode;
  children: ReactNode;
  loading?: boolean;
  /** Blocks interaction without `disabled` or faded text */
  inactive?: boolean;
};

export function SocialAuthButton({
  icon,
  children,
  loading = false,
  inactive = false,
  className,
  type = "button",
  ...rest
}: SocialAuthButtonProps) {
  const isInactive = inactive || loading;

  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={isInactive || undefined}
      className={`${socialAuthButtonClassName} ${className || ""}`.trim()}
      style={isInactive ? { pointerEvents: "none" } : undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800"
          aria-hidden
        />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-800 [&>svg]:h-5 [&>svg]:w-5 [&_.anticon]:text-gray-700">
          {icon}
        </span>
      )}
      <span className="social-auth-btn__label min-w-0 flex-1 truncate text-center text-sm font-medium text-gray-800">
        {children}
      </span>
    </button>
  );
}
