import { normalizeLocale, type SupportedLocale } from "@/i18n/locales";

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
