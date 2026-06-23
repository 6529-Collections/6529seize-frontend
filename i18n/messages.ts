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

export const BOTTOM_NAVIGATION_MESSAGES = {
  primaryNavigationLabel: "Primary",
} as const;

type MessageParams = Record<string, string | number>;

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

function interpolateMessage(
  template: string,
  params: MessageParams = {}
): string {
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
  const fallbackTemplate = MESSAGE_DICTIONARIES[DEFAULT_LOCALE][key];
  if (fallbackTemplate === undefined) {
    throw new Error(`Missing source message for key: ${key}`);
  }

  const template = MESSAGE_DICTIONARIES[locale][key] ?? fallbackTemplate;

  return interpolateMessage(template, params);
}

export type { MessageKey };
