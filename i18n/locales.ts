export const DEFAULT_LOCALE = "en-US" as const;

export const SUPPORTED_LOCALES = [
  DEFAULT_LOCALE,
  "en-GB",
  "fr-FR",
  "es-ES",
  "de-DE",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const SUPPORTED_LOCALE_BY_KEY = SUPPORTED_LOCALES.reduce<
  Record<string, SupportedLocale>
>((locales, locale) => {
  locales[locale.toLowerCase()] = locale;
  return locales;
}, {});

function getCanonicalSupportedLocale(
  locale: string | null | undefined
): SupportedLocale | undefined {
  return typeof locale === "string"
    ? SUPPORTED_LOCALE_BY_KEY[locale.toLowerCase()]
    : undefined;
}

export function isSupportedLocale(locale: string | null | undefined): boolean {
  return getCanonicalSupportedLocale(locale) !== undefined;
}

export function normalizeLocale(
  locale: string | null | undefined
): SupportedLocale {
  return getCanonicalSupportedLocale(locale) ?? DEFAULT_LOCALE;
}
