import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

export type SearchParamValue = string | string[] | undefined;

export type RememesSearchParams = {
  readonly [key: string]: SearchParamValue;
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

const REMEMES_MEME_ID_PATTERN = /^\d+$/;

function parseRememesMemeId(value: string | null): number {
  if (value === null || value === "" || !REMEMES_MEME_ID_PATTERN.test(value)) {
    return 0;
  }

  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

export function getInitialRememesMemeId({
  meme_id,
}: {
  readonly meme_id?: SearchParamValue;
}): number {
  return parseRememesMemeId(getSearchParamValue(meme_id));
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

  const parsedValue = parseRememesMemeId(value);
  return parsedValue === 0 || value !== parsedValue.toString();
}

export function getRememesBrowseQuery({
  locale,
  memeId,
  searchParams,
}: {
  readonly locale: SupportedLocale;
  readonly memeId: number;
  readonly searchParams?: RememesSearchParams | undefined;
}): string {
  const query = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (key === "meme_id" || key === "locale") {
      return;
    }

    const values = Array.isArray(value) ? value : [value];
    values.forEach((paramValue) => {
      if (paramValue !== undefined) {
        query.append(key, paramValue);
      }
    });
  });

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
    href: `/rememes/${encodeURIComponent(contract)}/${encodeURIComponent(
      String(id)
    )}`,
    locale,
  });
}

export function getRememeDetailApiQuery({
  contract,
  id,
}: {
  readonly contract: string;
  readonly id: string | number;
}): string {
  return new URLSearchParams({ contract, id: String(id) }).toString();
}

export function getRememesAddHref({
  locale,
}: {
  readonly locale: SupportedLocale;
}): string {
  return getRouteHrefWithLocale({
    href: "/rememes/add",
    locale,
  });
}
