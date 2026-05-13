export type SupportedLocale = "vi" | "en";

type TranslationMap = Record<string, { vi?: string; en?: string }>;

const STORAGE_KEY = "restx:ingredient-type-translations";

const normalizeCode = (code?: string | null) => (code || "").trim().toLowerCase();

const safeParse = (raw: string | null): TranslationMap => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const readTypeTranslations = (): TranslationMap => {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
};

export const writeTypeTranslations = (map: TranslationMap) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

export const upsertTypeTranslation = (code: string, locale: SupportedLocale, value?: string | null) => {
  const key = normalizeCode(code);
  const text = (value || "").trim();
  if (!key || !text) return;

  const map = readTypeTranslations();
  const old = map[key] || {};
  map[key] = { ...old, [locale]: text };
  writeTypeTranslations(map);
};

export const upsertTypeTranslations = (code: string, values: { vi?: string | null; en?: string | null }) => {
  const key = normalizeCode(code);
  if (!key) return;

  const map = readTypeTranslations();
  const old = map[key] || {};
  map[key] = {
    ...old,
    ...(values.vi ? { vi: values.vi.trim() } : {}),
    ...(values.en ? { en: values.en.trim() } : {}),
  };
  writeTypeTranslations(map);
};

export const getTypeTranslation = (
  code: string,
  locale: SupportedLocale,
  fallback?: string,
) => {
  const key = normalizeCode(code);
  if (!key) return fallback || "";

  const map = readTypeTranslations();
  const item = map[key];
  if (!item) return fallback || "";

  if (locale === "vi") return item.vi || item.en || fallback || "";
  return item.en || item.vi || fallback || "";
};
