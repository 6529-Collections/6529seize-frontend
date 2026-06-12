import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

export type SearchParamValue = string | string[] | undefined;

export type RememesSearchParams = {
  readonly meme_id?: SearchParamValue;
  readonly locale?: SearchParamValue;
};

export function getSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function getRememesRouteLocale({
  locale,
}: {
  readonly locale?: SearchParamValue;
}): SupportedLocale {
  return normalizeLocale(getSearchParamValue(locale));
}

export function getInitialRememesMemeId({
  meme_id,
}: {
  readonly meme_id?: SearchParamValue;
}): number {
  const value = getSearchParamValue(meme_id);
  if (!value) {
    return 0;
  }

  const parsedValue = Number.parseInt(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function shouldNormalizeRememesMemeId({
  meme_id,
}: {
  readonly meme_id?: SearchParamValue;
}): boolean {
  const value = getSearchParamValue(meme_id);
  if (value === null) {
    return false;
  }

  if (!value) {
    return true;
  }

  return !Number.isFinite(Number.parseInt(value));
}

export function getRememesBrowseQuery({
  locale,
  memeId,
}: {
  readonly locale: SupportedLocale;
  readonly memeId: number;
}): string {
  const query = new URLSearchParams();

  if (memeId) {
    query.set("meme_id", memeId.toString());
  }

  if (locale !== DEFAULT_LOCALE) {
    query.set("locale", locale);
  }

  return query.toString();
}

export function getRouteHrefWithLocale({
  href,
  locale,
}: {
  readonly href: string;
  readonly locale: SupportedLocale;
}): string {
  if (locale === DEFAULT_LOCALE) {
    return href;
  }

  const [pathname, currentQuery = ""] = href.split("?");
  const query = new URLSearchParams(currentQuery);
  query.set("locale", locale);

  return `${pathname}?${query.toString()}`;
}

export function getRememeDetailHref({
  contract,
  id,
  locale,
}: {
  readonly contract: string;
  readonly id: string | number;
  readonly locale: SupportedLocale;
}): string {
  return getRouteHrefWithLocale({
    href: `/rememes/${contract}/${id}`,
    locale,
  });
}
