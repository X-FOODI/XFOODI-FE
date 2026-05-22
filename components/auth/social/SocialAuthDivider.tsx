"use client";


export type SocialAuthDividerProps = {
  label: string;
  className?: string;
};

/** “Hoặc đăng nhập bằng” centered between horizontal rules */
export function SocialAuthDivider({ label, className }: SocialAuthDividerProps) {
  return (
    <div
      className={`relative w-full py-1 my-6 sm:my-8 ${className || ""}`.trim()}
      role="separator"
      aria-label={label}
    >
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-[#ddd]" />
      </div>
      <div className="relative flex justify-center px-3 sm:px-4">
        <span className="max-w-[90%] text-center text-xs sm:text-sm font-normal text-gray-400 bg-[var(--bg-base)] px-3 sm:px-4 leading-snug">
          {label}
        </span>
      </div>
    </div>
  );
}
