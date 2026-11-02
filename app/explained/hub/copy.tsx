import type { ReactNode } from "react";
import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";
import { rich, type RichValues } from "@/components/explained/rich";

/**
 * The hub's copy: every string is a key under explained.hub
 * (i18n/messages/explainedHub.<locale>.json), numbers filled from facts.
 * The hub's second line is `explained.hub.mission`, one key, so the owner's
 * mission sentence replaces the descriptive line by changing its value.
 */
const NS = "explained.hub.";

type FullKey = Extract<MessageKey, `explained.hub.${string}`>;
export type HubKey = FullKey extends `explained.hub.${infer K}` ? K : never;

function hubKey(key: HubKey): FullKey {
  return `${NS}${key}` as FullKey;
}

export function ht(
  locale: SupportedLocale,
  key: HubKey,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, hubKey(key), params);
}

export function hrich(
  locale: SupportedLocale,
  key: HubKey,
  params: RichValues
): ReactNode {
  return rich(locale, hubKey(key), params);
}
