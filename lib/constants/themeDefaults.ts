/**
 * Theme Color Configuration
 *
 * Single source of truth mapping: DB field → CSS variable → fallback.
 * Fallback values MUST match globals.css :root declarations.
 *
 * When a DB field is empty, the CSS variable is removed,
 * allowing globals.css defaults to apply naturally.
 */

export type ThemeColorField =
  | "primaryColor"
  | "lightBaseColor"
  | "lightSurfaceColor"
  | "lightCardColor"
  | "darkBaseColor"
  | "darkSurfaceColor"
  | "darkCardColor";

interface ThemeColorDef {
  /** CSS custom property name */
  cssVar: string;
  /** Fallback value (must match globals.css) */
  fallback: string;
  /** Human-readable label */
  label: string;
}

export const THEME_COLOR_MAP: Record<ThemeColorField, ThemeColorDef> = {
  primaryColor: {
    cssVar: "--primary",
    fallback: "#FF380B",
    label: "Primary Color",
  },
  lightBaseColor: {
    cssVar: "--bg-light-base",
    fallback: "#FFFFFF",
    label: "Base Background",
  },
  lightSurfaceColor: {
    cssVar: "--light-surface",
    fallback: "#F9FAFB",
    label: "Surface Color",
  },
  lightCardColor: {
    cssVar: "--light-card",
    fallback: "#FFFFFF",
    label: "Card Color",
  },
  darkBaseColor: {
    cssVar: "--bg-dark-base",
    fallback: "#0A0E14",
    label: "Base Background",
  },
  darkSurfaceColor: {
    cssVar: "--dark-surface",
    fallback: "#1A1F2E",
    label: "Surface Color",
  },
  darkCardColor: {
    cssVar: "--dark-card",
    fallback: "#151A24",
    label: "Card Color",
  },
};

/** All theme color field names */
export const THEME_COLOR_FIELDS = Object.keys(
  THEME_COLOR_MAP,
) as ThemeColorField[];

/** Get all fallback values as a flat object (for form initialization) */
export function getThemeDefaults(): Record<ThemeColorField, string> {
  return Object.fromEntries(
    THEME_COLOR_FIELDS.map((k) => [k, THEME_COLOR_MAP[k].fallback]),
  ) as Record<ThemeColorField, string>;
}
