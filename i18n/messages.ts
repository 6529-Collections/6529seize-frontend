import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { DE_DE_MESSAGES } from "@/i18n/messages/de-DE";
import { EN_GB_MESSAGES } from "@/i18n/messages/en-GB";
import { EN_US_MESSAGES, type MessageKey } from "@/i18n/messages/en-US";
import { ES_ES_MESSAGES } from "@/i18n/messages/es-ES";
import { FR_FR_MESSAGES } from "@/i18n/messages/fr-FR";

export const TAB_TOGGLE_WITH_OVERFLOW_MESSAGES = {
  overflowFallbackLabel: "More",
  overflowMenuAriaLabel: "More tabs",
} as const;

type MessageParams = Record<string, string | number>;
type RichMessageParams<Value> = Record<string, string | number | Value>;

const MESSAGE_DICTIONARIES: Record<
  SupportedLocale,
  Partial<Record<MessageKey, string>>
> = {
  [DEFAULT_LOCALE]: EN_US_MESSAGES,
  "en-GB": EN_GB_MESSAGES,
  "fr-FR": FR_FR_MESSAGES,
  "es-ES": ES_ES_MESSAGES,
  "de-DE": DE_DE_MESSAGES,
};

function getMessageTemplate(locale: SupportedLocale, key: MessageKey): string {
  const fallbackTemplate = MESSAGE_DICTIONARIES[DEFAULT_LOCALE][key];
  if (fallbackTemplate === undefined) {
    throw new Error(`Missing source message for key: ${key}`);
  }

  return MESSAGE_DICTIONARIES[locale][key] ?? fallbackTemplate;
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
