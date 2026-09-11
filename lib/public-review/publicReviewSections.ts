import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { PublicReviewSectionDefinition } from "@/lib/public-review/publicReviewTypes";

type SectionMessageEntry = readonly [id: string, messageKey: MessageKey];

export function createDefaultLocalePublicReviewSections<
  const Entries extends readonly SectionMessageEntry[],
>(
  entries: Entries
): { readonly [Index in keyof Entries]: PublicReviewSectionDefinition } {
  return entries.map(([id, messageKey]) => ({
    id,
    title: t(DEFAULT_LOCALE, messageKey),
  })) as unknown as {
    readonly [Index in keyof Entries]: PublicReviewSectionDefinition;
  };
}
