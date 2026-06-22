import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../../i18n/locales";

export const LONG_TEXT_STRESS_LOCALE = "de-DE" satisfies SupportedLocale;
export const ROUTE_LOCALE_PARAM = "locale";

export function withLocale(path: string, locale: SupportedLocale) {
  const url = new URL(path, "https://6529.local");

  if (locale === DEFAULT_LOCALE) {
    url.searchParams.delete(ROUTE_LOCALE_PARAM);
  } else {
    url.searchParams.set(ROUTE_LOCALE_PARAM, locale);
  }

  return `${url.pathname}${url.search}`;
}

export function getLocaleStressPaths(
  paths: readonly string[],
  locales: readonly SupportedLocale[] = SUPPORTED_LOCALES
) {
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      locale,
      path: withLocale(path, locale),
    }))
  );
}
