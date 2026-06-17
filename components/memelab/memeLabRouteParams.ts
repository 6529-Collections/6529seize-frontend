import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

export type SearchParamValue = string | string[] | undefined;

export type MemeLabListSearchParams = {
  readonly sort?: SearchParamValue;
  readonly sort_dir?: SearchParamValue;
  readonly locale?: SearchParamValue;
};

export type MemeLabCollectionSearchParams = {
  readonly sort?: SearchParamValue;
  readonly sort_dir?: SearchParamValue;
  readonly locale?: SearchParamValue;
};

export type MemeLabDetailSearchParams = {
  readonly focus?: SearchParamValue;
  readonly locale?: SearchParamValue;
};

export function getSearchParamValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function getMemeLabRouteLocale({
  locale,
}: {
  readonly locale?: SearchParamValue;
}): SupportedLocale {
  return normalizeLocale(getSearchParamValue(locale));
}

export function getMemeLabCollectionPath(collectionName: string): string {
  const slug = collectionName.trim().replace(/\s+/g, "-");
  return `/meme-lab/collection/${encodeURIComponent(slug)}`;
}

export function getMemeLabRouteHrefWithLocale({
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

export function getMemeLabDetailHref({
  id,
  locale,
}: {
  readonly id: string | number;
  readonly locale: SupportedLocale;
}): string {
  return getMemeLabRouteHrefWithLocale({
    href: `/meme-lab/${encodeURIComponent(String(id))}`,
    locale,
  });
}

export function getMemeLabCollectionHref({
  collectionName,
  locale,
}: {
  readonly collectionName: string;
  readonly locale: SupportedLocale;
}): string {
  return getMemeLabRouteHrefWithLocale({
    href: getMemeLabCollectionPath(collectionName),
    locale,
  });
}

export function getMemeLabCollectionName(collectionParam: string): string {
  try {
    return decodeURIComponent(collectionParam)
      .replaceAll("-", " ")
      .trim()
      .replace(/\s+/g, " ");
  } catch {
    return collectionParam.replaceAll("-", " ").trim().replace(/\s+/g, " ");
  }
}
