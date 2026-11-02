import { getNodeEnv } from "@/config/env";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

/** A shared kit string: mark words, "Break it", tags, How-we-know actions. */
export type KitKey = Extract<MessageKey, `explained.kit.${string}`>;

type Params = Readonly<Record<string, string | number>>;

const UNFILLED = /\{(\w+)\}/;

/**
 * A message with every placeholder filled. A key never contains a number:
 * numbers are arguments filled from facts (TDH-DESIGN.md §2). A placeholder
 * left unfilled is a bug, so outside production it throws instead of
 * printing `{name}`.
 */
export function fill(
  locale: SupportedLocale,
  key: MessageKey,
  params: Params = {}
): string {
  const text = t(locale, key, params);
  const missing = UNFILLED.exec(text);
  if (missing && getNodeEnv() !== "production") {
    throw new Error(`${key}: no value for {${missing[1] ?? ""}}`);
  }
  return text;
}

/** A kit string. */
export function kt(
  locale: SupportedLocale,
  key: KitKey,
  params: Params = {}
): string {
  return fill(locale, key, params);
}
