import { normalizeLocale, type SupportedLocale } from "@/i18n/locales";

export type LocaleSearchParams = Promise<{
  readonly locale?: string | string[];
}>;

/**
 * The page's locale from `?locale=`, as the kit gallery and The Memes card
 * pages read it, so the gates can render every page in de-DE at 390
 * (EXPLAINED.md §12). Without one, en-US.
 */
export async function pageLocale(
  searchParams: LocaleSearchParams
): Promise<SupportedLocale> {
  const params = await searchParams;
  const value = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  return normalizeLocale(value);
}
