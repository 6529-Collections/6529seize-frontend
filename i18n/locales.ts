export const DEFAULT_LOCALE = "en-US" as const;

export const SUPPORTED_LOCALES = [
  DEFAULT_LOCALE,
  "en-GB",
  "fr-FR",
  "es-ES",
  "de-DE",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export function isSupportedLocale(
  locale: string | null | undefined
): locale is SupportedLocale {
  return typeof locale === "string" && SUPPORTED_LOCALE_SET.has(locale);
}

export function normalizeLocale(
  locale: string | null | undefined
): SupportedLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}
