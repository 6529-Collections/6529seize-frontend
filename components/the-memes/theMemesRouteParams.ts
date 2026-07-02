import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

export type SearchParamValue = string | string[] | undefined;

export type TheMemesSearchParams = {
  readonly [key: string]: SearchParamValue;
  readonly sort?: SearchParamValue;
  readonly sort_dir?: SearchParamValue;
  readonly szn?: SearchParamValue;
  readonly year?: SearchParamValue;
  readonly locale?: SearchParamValue;
};

export function getSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function getTheMemesRouteLocale({
  locale,
}: {
  readonly locale?: SearchParamValue;
}): SupportedLocale {
  return normalizeLocale(getSearchParamValue(locale));
}

export function getTheMemesRouteHrefWithLocale({
  href,
  locale,
}: {
  readonly href: string;
  readonly locale: SupportedLocale;
}): string {
  const [pathname = "", currentQuery = ""] = href.split("?");
  const query = new URLSearchParams(currentQuery);

  if (locale === DEFAULT_LOCALE) {
    query.delete("locale");
  } else {
    query.set("locale", locale);
  }

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function getTheMemesBrowseHref({
  locale,
  seasonId,
  sort,
  sortDir,
  yearId,
}: {
  readonly locale: SupportedLocale;
  readonly seasonId?: number | null | undefined;
  readonly sort: string;
  readonly sortDir: string;
  readonly yearId?: number | null | undefined;
}): string {
  const query = new URLSearchParams({
    sort,
    sort_dir: sortDir,
  });

  if (yearId !== null && yearId !== undefined) {
    query.set("year", yearId.toString());
  }

  if (seasonId !== null && seasonId !== undefined) {
    query.set("szn", seasonId.toString());
  }

  return getTheMemesRouteHrefWithLocale({
    href: `/the-memes?${query.toString()}`,
    locale,
  });
}

export function getTheMemesDetailHref({
  id,
  locale,
}: {
  readonly id: string | number;
  readonly locale: SupportedLocale;
}): string {
  return getTheMemesRouteHrefWithLocale({
    href: `/the-memes/${encodeURIComponent(String(id))}`,
    locale,
  });
}
