import type { ReactNode } from "react";
import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";
import { rich, type RichValues } from "@/components/explained/rich";

/**
 * The overview's copy: every string is a key under explained.tdh.overview
 * (i18n/messages/explainedTdhOverview.<locale>.json). A key never holds a
 * number; numbers are placeholders filled from facts.
 */
const NS = "explained.tdh.overview.";

type FullKey = Extract<MessageKey, `explained.tdh.overview.${string}`>;
export type OverviewKey = FullKey extends `explained.tdh.overview.${infer K}`
  ? K
  : never;

function overviewKey(key: OverviewKey): FullKey {
  return `${NS}${key}` as FullKey;
}

/** A plain overview string, its placeholders filled. */
export function ot(
  locale: SupportedLocale,
  key: OverviewKey,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, overviewKey(key), params);
}

/** An overview string whose placeholders are nodes: facts, bold words, links. */
export function orich(
  locale: SupportedLocale,
  key: OverviewKey,
  params: RichValues
): ReactNode {
  return rich(locale, overviewKey(key), params);
}
