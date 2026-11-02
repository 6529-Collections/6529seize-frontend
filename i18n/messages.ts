import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import {
  getLocaleDictionary,
  loadLocaleDictionary,
  type LocaleDictionary,
} from "@/i18n/localeDictionaries";
import { EN_US_MESSAGES, type MessageKey } from "@/i18n/messages/en-US";

export const TAB_TOGGLE_WITH_OVERFLOW_MESSAGES = {
  overflowFallbackLabel: "More",
  overflowMenuAriaLabel: "More tabs",
} as const;

type MessageParams = Record<string, string | number>;
type RichMessageParams<Value> = Record<string, string | number | Value>;

// en-US is the complete source dictionary and is always bundled. Other
// locales come from `@/i18n/localeDictionaries`, which browsers load on demand.
const SOURCE_MESSAGES: LocaleDictionary = EN_US_MESSAGES;

function getLocaleMessages(
  locale: SupportedLocale
): LocaleDictionary | undefined {
  return locale === DEFAULT_LOCALE
    ? SOURCE_MESSAGES
    : getLocaleDictionary(locale);
}

/** Whether `t()` can already return `locale` copy instead of en-US fallback. */
export function hasLocaleMessages(locale: SupportedLocale): boolean {
  return getLocaleMessages(locale) !== undefined;
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
  const fallbackTemplate = SOURCE_MESSAGES[key];
  if (fallbackTemplate === undefined) {
    throw new Error(`Missing source message for key: ${key}`);
  }

  // A locale whose dictionary has not loaded yet renders en-US copy.
  return getLocaleMessages(locale)?.[key] ?? fallbackTemplate;
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
