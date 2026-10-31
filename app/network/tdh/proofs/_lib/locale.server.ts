import { headers } from "next/headers";
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

/**
 * The language the page renders in: `?locale=` first (the gates render
 * every page in de-DE with it), then the reader's Accept-Language, matched
 * exactly or by language ("de" reads de-DE), then en-US.
 *
 * Promotion candidate for the kit (lane P1 has the same helper).
 */
export type SearchParams = Readonly<
  Record<string, string | string[] | undefined>
>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function localeFromAcceptLanguage(
  header: string | null
): SupportedLocale | null {
  const tags = (header ?? "")
    .split(",")
    .map((part) => part.split(";")[0]?.trim() ?? "")
    .filter((tag) => tag.length > 0 && tag !== "*");
  for (const tag of tags) {
    if (isSupportedLocale(tag)) {
      return normalizeLocale(tag);
    }
    const language = tag.toLowerCase().split("-")[0];
    const match = SUPPORTED_LOCALES.find(
      (locale) => locale.toLowerCase().split("-")[0] === language
    );
    if (match) {
      return match;
    }
  }
  return null;
}

export async function resolveLocale(
  params: SearchParams
): Promise<SupportedLocale> {
  const asked = first(params["locale"]);
  if (asked && isSupportedLocale(asked)) {
    return normalizeLocale(asked);
  }
  const list = await headers();
  return (
    localeFromAcceptLanguage(list.get("accept-language")) ??
    normalizeLocale(null)
  );
}
