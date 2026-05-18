"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Shared styles for Google + phone social login buttons */
export const socialAuthButtonClassName =
  "group w-full h-12 min-h-[3rem] inline-flex items-center justify-center gap-3 rounded-xl border border-[#ddd] bg-white px-4 py-3 text-sm font-medium leading-none text-gray-800 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:shadow-sm";

export type SocialAuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  children: ReactNode;
  loading?: boolean;
};

export function SocialAuthButton({
  icon,
  children,
  loading = false,
  className,
  disabled,
  type = "button",
  ...rest
}: SocialAuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(socialAuthButtonClassName, className)}
      {...rest}
    >
      {loading ? (
        <span
          className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
          aria-hidden
        />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
      )}
      <span className="truncate text-center">{children}</span>
    </button>
  );
}
