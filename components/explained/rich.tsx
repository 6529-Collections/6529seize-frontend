import { Fragment, type ReactNode } from "react";
import { getNodeEnv } from "@/config/env";
import type { SupportedLocale } from "@/i18n/locales";
import { tRich, type MessageKey } from "@/i18n/messages";
import { EN_US_MESSAGES } from "@/i18n/messages/en-US";
import { fill } from "./i18n";

/**
 * Messages with nodes inside them (TDH-DESIGN.md §2). A key never contains
 * a number, so each `{placeholder}` is filled with a node: most often a
 * fact printed with its source (`FactValue`, `FactText`), sometimes a link,
 * a mark or a code name. `rich` is the kit's `fill` for nodes, and like
 * `fill` it throws outside production when a placeholder is left unfilled,
 * instead of printing `{name}`.
 */
export type RichValues = Readonly<Record<string, ReactNode>>;

const PLACEHOLDER = /^\{\w+\}$/;

export function rich(
  locale: SupportedLocale,
  key: MessageKey,
  values: RichValues = {}
): ReactNode {
  const parts = tRich<ReactNode>(
    locale,
    key,
    values as Record<string, string | number | ReactNode>
  );
  const unfilled = parts.find(
    (part): part is string => typeof part === "string" && PLACEHOLDER.test(part)
  );
  if (unfilled !== undefined && getNodeEnv() !== "production") {
    throw new Error(`${key}: no value for ${unfilled}`);
  }
  return parts.map((part, index) => (
    // The parts are one message's fixed segments, in order.
    <Fragment key={index}>{part}</Fragment>
  ));
}

/** A plain message, for an attribute or a label that takes a string. */
export function plain(
  locale: SupportedLocale,
  key: MessageKey,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, key, params);
}

/** Whether a key built from data (a section id, an item id) has copy. */
export function isMessageKey(key: string): key is MessageKey {
  return Object.hasOwn(EN_US_MESSAGES, key);
}
