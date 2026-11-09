import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import {
  getLocaleDictionary,
  loadLocaleDictionary,
} from "@/i18n/localeDictionaries";
import { getSourceMessage } from "@/i18n/messageRegistry";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import { resolveMissingSourceMessage } from "@/i18n/sourceMessages";

export const TAB_TOGGLE_WITH_OVERFLOW_MESSAGES = {
  overflowFallbackLabel: "More",
  overflowMenuAriaLabel: "More tabs",
} as const;

type MessageParams = Record<string, string | number>;
type RichMessageParams<Value> = Record<string, string | number | Value>;

// en-US is the source locale. Its copy comes from the source message registry:
// `@/i18n/sourceMessages` registers the complete dictionary on the server and
// the root dictionary in browsers, where feature namespaces register
// themselves as they load. Other locales come from
// `@/i18n/localeDictionaries`, which browsers load on demand.

/** Whether `t()` can already return `locale` copy instead of en-US fallback. */
export function hasLocaleMessages(locale: SupportedLocale): boolean {
  return locale === DEFAULT_LOCALE || getLocaleDictionary(locale) !== undefined;
}

/** Resolves once `locale` copy is available to `t()`. */
export async function loadLocaleMessages(
  locale: SupportedLocale
): Promise<void> {
  if (locale !== DEFAULT_LOCALE) {
    await loadLocaleDictionary(locale);
  }
}

function getMessageTemplate(locale: SupportedLocale, key: MessageKey): string {
  const sourceTemplate =
    getSourceMessage(key) ?? resolveMissingSourceMessage(key);
  if (locale === DEFAULT_LOCALE) {
    return sourceTemplate;
  }

  // A locale whose dictionary has not loaded yet renders en-US copy.
  return getLocaleDictionary(locale)?.[key] ?? sourceTemplate;
}

function interpolateMessage(template: string, params: MessageParams): string {
  return template.replace(/\{(\w+)\}/g, (match, paramName) => {
    const value = params[paramName];
    return value === undefined ? match : String(value);
  });
}

export function t(
  locale: SupportedLocale,
  key: MessageKey,
  params: MessageParams = {}
): string {
  return interpolateMessage(getMessageTemplate(locale, key), params);
}

export function tRich<Value>(
  locale: SupportedLocale,
  key: MessageKey,
  params: RichMessageParams<Value>
): Array<string | Value> {
  const template = getMessageTemplate(locale, key);
  const parts: Array<string | Value> = [];
  const placeholderPattern = /\{(\w+)\}/g;
  let cursor = 0;

  for (const match of template.matchAll(placeholderPattern)) {
    const matchIndex = match.index;
    if (matchIndex > cursor) {
      parts.push(template.slice(cursor, matchIndex));
    }

    const paramName = match[1];
    const value = paramName === undefined ? undefined : params[paramName];
    if (value === undefined) {
      parts.push(match[0]);
    } else if (typeof value === "string" || typeof value === "number") {
      parts.push(String(value));
    } else {
      parts.push(value);
    }

    cursor = matchIndex + match[0].length;
  }

  if (cursor < template.length) {
    parts.push(template.slice(cursor));
  }

  return parts;
}

export type { MessageKey };
