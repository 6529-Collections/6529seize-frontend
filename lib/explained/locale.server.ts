import { headers } from "next/headers";
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

/**
 * The language a 6529 Explained page is rendered in, the same on every
 * translated page of every chapter. `?locale=` wins (the gates render
 * every page in de-DE with it); otherwise the reader's browser language
 * from Accept-Language, as 6529.io's client pages read
 * `navigator.language`, matched exactly or by language ("de" reads de-DE);
 * otherwise en-US.
 */
export type ExplainedParams = Readonly<
  Record<string, string | string[] | undefined>
>;

export function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function byLanguage(tag: string): SupportedLocale | null {
  const language = tag.toLowerCase().split("-")[0];
  return (
    SUPPORTED_LOCALES.find(
      (locale) => locale.toLowerCase().split("-")[0] === language
    ) ?? null
  );
}

export function localeFromAcceptLanguage(
  header: string | null
): SupportedLocale | null {
  const preferred = (header ?? "")
    .split(",")
    .map((part) => part.split(";")[0]?.trim() ?? "")
    .filter((tag) => tag.length > 0 && tag !== "*");
  for (const tag of preferred) {
    if (isSupportedLocale(tag)) {
      return normalizeLocale(tag);
    }
    const match = byLanguage(tag);
    if (match) {
      return match;
    }
  }
  return null;
}

export async function resolveExplainedLocale(
  params: ExplainedParams
): Promise<SupportedLocale> {
  const asked = firstParam(params["locale"]);
  if (asked && isSupportedLocale(asked)) {
    return normalizeLocale(asked);
  }
  const list = await headers();
  return (
    localeFromAcceptLanguage(list.get("accept-language")) ??
    normalizeLocale(null)
  );
}
