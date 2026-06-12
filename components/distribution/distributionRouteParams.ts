import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

export type DistributionSearchParamValue = string | string[] | undefined;

export type DistributionSearchParams = {
  readonly locale?: DistributionSearchParamValue;
};

function getSearchParamValue(
  value: DistributionSearchParamValue
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function getDistributionRouteLocale({
  locale,
}: DistributionSearchParams): SupportedLocale {
  return normalizeLocale(getSearchParamValue(locale));
}

export function getDistributionRouteHrefWithLocale({
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

export function getDistributionDetailHref({
  basePath,
  id,
  locale,
}: {
  readonly basePath: "/meme-lab" | "/the-memes";
  readonly id: string | number;
  readonly locale: SupportedLocale;
}): string {
  return getDistributionRouteHrefWithLocale({
    href: `${basePath}/${encodeURIComponent(String(id))}/distribution`,
    locale,
  });
}
