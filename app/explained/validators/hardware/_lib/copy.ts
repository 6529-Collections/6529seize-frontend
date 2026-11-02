import type { ReactNode } from "react";
import { fill } from "@/components/explained/i18n";
import { rich, type RichValues } from "@/components/explained/rich";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

/**
 * The page's own strings: `explained.validators.hardware.*`, in
 * `i18n/messages/explainedValidatorsHardware.<locale>.json`. A key that is
 * not in en-US fails the typecheck. Numbers are never in a string: each is
 * a placeholder filled with a fact (`facts.tsx`).
 */
type HwKey = Extract<MessageKey, `explained.validators.hardware.${string}`>;
export type HwSuffix = HwKey extends `explained.validators.hardware.${infer S}`
  ? S
  : never;

function key(suffix: HwSuffix): HwKey {
  return `explained.validators.hardware.${suffix}` as HwKey;
}

export function hw(
  locale: SupportedLocale,
  suffix: HwSuffix,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, key(suffix), params);
}

export function hwRich(
  locale: SupportedLocale,
  suffix: HwSuffix,
  values: RichValues = {}
): ReactNode {
  return rich(locale, key(suffix), values);
}

/**
 * A message with its placeholders left in, for a client component that
 * fills them per row ("machine {price}").
 */
export function hwTemplate(locale: SupportedLocale, suffix: HwSuffix): string {
  return t(locale, key(suffix));
}

/** The page's route and its id in the chapter map. */
export const HARDWARE_ROUTE = "/explained/validators/hardware";
export const HARDWARE_PAGE_ID = "hardware";
export const VALIDATORS_CHAPTER_ID = "validators";
