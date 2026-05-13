"use client";

import {
  THEME_COLOR_FIELDS,
  THEME_COLOR_MAP,
  type ThemeColorField,
} from "@/lib/constants/themeDefaults";

/**
 * Tenant Branding Injection
 *
 * Overrides CSS variables only when DB has non-empty values.
 * Empty fields → CSS variable removed → globals.css defaults apply naturally.
 */

export type TenantBrandConfig = Partial<Record<ThemeColorField, string>> & {
  logoUrl?: string;
};

// ── Color utilities (WCAG contrast) ──────────────────────────────

function hexToRgb(hex: string) {
  const v = hex.replace("#", "").trim();
  if (![3, 4, 6, 8].includes(v.length)) return null;
  const n =
    v.length <= 4
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  const [r, g, b] = [n.slice(0, 2), n.slice(2, 4), n.slice(4, 6)].map((s) =>
    parseInt(s, 16),
  );
  return [r, g, b].some(Number.isNaN) ? null : { r, g, b };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Returns black or white for readable text on the given background */
function pickOnColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#FFFFFF";
  return luminance(rgb) > 0.55 ? "#111111" : "#FFFFFF";
}

function pickReadableText(hex: string, mode: "light" | "dark"): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return mode === "dark" ? "#ECECEC" : "#111111";

  const lum = luminance(rgb);
  if (mode === "dark") {
    return lum > 0.45 ? "#111111" : "#ECECEC";
  }
  return lum > 0.6 ? "#111111" : "#F8FAFC";
}

function mix(hexA: string, hexB: string, ratioA: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const r = Math.round(a.r * ratioA + b.r * (1 - ratioA));
  const g = Math.round(a.g * ratioA + b.g * (1 - ratioA));
  const bch = Math.round(a.b * ratioA + b.b * (1 - ratioA));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bch)}`;
}

// ── Main injection ───────────────────────────────────────────────

/**
 * Apply tenant brand colors as CSS custom properties on <html>.
 * - Non-empty DB value → override CSS variable
 * - Empty/missing → remove override → globals.css default applies
 * - Auto-calculates readable text-on-primary color
 * - Caches to localStorage for FOUC prevention
 */
export function injectTenantBranding(config: TenantBrandConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Apply each theme color: set if present, remove if empty
  for (const field of THEME_COLOR_FIELDS) {
    const value = (config[field] || "").trim();
    if (value) {
      root.style.setProperty(THEME_COLOR_MAP[field].cssVar, value);
    } else {
      root.style.removeProperty(THEME_COLOR_MAP[field].cssVar);
    }
  }

  // Logo URL
  if (config.logoUrl?.trim()) {
    root.style.setProperty("--brand-logo-url", config.logoUrl.trim());
  }

  // Auto-calculate readable text color for primary backgrounds
  const primary = (config.primaryColor || "").trim();
  if (primary) {
    const onPrimary = pickOnColor(primary);
    root.style.setProperty("--text-inverse", onPrimary);
    root.style.setProperty("--on-primary", onPrimary);
  }

  // Auto-calculate readable text tokens for light/dark surfaces
  const lightBase = (config.lightBaseColor || "").trim();
  if (lightBase) {
    const textLight = pickReadableText(lightBase, "light");
    const mutedLight = mix(textLight, lightBase, 0.65);
    root.style.setProperty("--text-light-dynamic", textLight);
    root.style.setProperty("--text-muted-light-dynamic", mutedLight);
  } else {
    root.style.removeProperty("--text-light-dynamic");
    root.style.removeProperty("--text-muted-light-dynamic");
  }

  const darkBase = (config.darkBaseColor || "").trim();
  if (darkBase) {
    const textDark = pickReadableText(darkBase, "dark");
    const mutedDark = mix(textDark, darkBase, 0.68);
    root.style.setProperty("--text-dark-dynamic", textDark);
    root.style.setProperty("--text-muted-dark-dynamic", mutedDark);
  } else {
    root.style.removeProperty("--text-dark-dynamic");
    root.style.removeProperty("--text-muted-dark-dynamic");
  }

  // Cache to localStorage for FOUC prevention
  try {
    localStorage.setItem("restx-tenant-colors", JSON.stringify(config));
  } catch {
    // localStorage may be unavailable
  }
}
