import { forwardRef, useEffect, useRef, useState } from "react";

// ─── Native select variant (default) ─────────────────────────────────────────

type DropDownProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string;
  iconStyle?: React.CSSProperties;
};

const baseSelectClassName =
  "w-full px-3 py-2 pr-9 rounded-lg border outline-none transition-all appearance-none text-sm";

const baseStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderColor: "var(--border)",
  color: "var(--text)",
  cursor: "pointer",
};

const iconStyle: React.CSSProperties = {
  color: "var(--text-muted)",
};

export const DropDown = forwardRef<HTMLSelectElement, DropDownProps>(
  ({ className = "", style, containerClassName = "", iconStyle: customIconStyle, children, ...props }, ref) => {
    return (
      <div className={`relative ${containerClassName}`.trim()}>
        <select
          ref={ref}
          className={`${baseSelectClassName} ${className}`.trim()}
          style={{ ...baseStyle, ...style }}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4"
            style={{ ...iconStyle, ...customIconStyle }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

DropDown.displayName = "DropDown";

// ─── Button dropdown variant ──────────────────────────────────────────────────
// Use when you need a custom trigger button with a list of options (not a native select).

export interface DropDownOption {
  key: string;
  label: React.ReactNode;
}

interface ButtonDropDownProps {
  /** Content shown inside the trigger button */
  trigger: React.ReactNode;
  options: DropDownOption[];
  onSelect: (key: string) => void;
  disabled?: boolean;
  /** Fixed width in px applied to both button and menu. Defaults to 200. */
  width?: number;
  className?: string;
}

export function ButtonDropDown({
  trigger,
  options,
  onSelect,
  disabled = false,
  width = 200,
  className = "",
}: ButtonDropDownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (key: string) => {
    setOpen(false);
    onSelect(key);
  };

  return (
    <div ref={ref} className={`relative ${className}`.trim()} style={{ width }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-all disabled:opacity-50"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}>
        <span className="flex-1 text-left truncate">{trigger}</span>
        <svg
          className="w-4 h-4 flex-shrink-0 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50"
          style={{
            width,
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}>
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelect(opt.key)}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{ color: "var(--text)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
