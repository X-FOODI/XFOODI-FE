"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { SocialAuthDivider } from "./SocialAuthDivider";

export type SocialAuthMethodsProps = {
  dividerLabel: string;
  children: ReactNode;
  className?: string;
};

/** Divider + stacked social buttons (Google, phone, …) */
export function SocialAuthMethods({
  dividerLabel,
  children,
  className,
}: SocialAuthMethodsProps) {
  return (
    <section className={clsx("w-full", className)} aria-label={dividerLabel}>
      <SocialAuthDivider label={dividerLabel} />
      <div className="flex w-full flex-col gap-3">{children}</div>
    </section>
  );
}
