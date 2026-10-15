import type { DEFAULT_LOCALE, SupportedLocale } from "@/i18n/locales";
import { DE_DE_MESSAGES } from "@/i18n/messages/de-DE";
import { EN_GB_MESSAGES } from "@/i18n/messages/en-GB";
import type { MessageKey } from "@/i18n/messages/en-US";
import { ES_ES_MESSAGES } from "@/i18n/messages/es-ES";
import { FR_FR_MESSAGES } from "@/i18n/messages/fr-FR";

// Dictionaries for every locale except the en-US default, which
// `@/i18n/messages` always bundles. Server rendering, SSR of client
// components, Jest and webpack builds use this module, so each dictionary is
// available synchronously. Turbopack browser bundles resolve
// `./localeDictionaries.browser.ts` instead (see `turbopack.resolveAlias` in
// config/nextConfig.ts) and load each dictionary only when it is needed.
// Import this module only as `@/i18n/localeDictionaries` so the alias applies.

export type NonDefaultLocale = Exclude<SupportedLocale, typeof DEFAULT_LOCALE>;
export type LocaleDictionary = Partial<Record<MessageKey, string>>;

const LOCALE_DICTIONARIES: Record<NonDefaultLocale, LocaleDictionary> = {
  "en-GB": EN_GB_MESSAGES,
  "fr-FR": FR_FR_MESSAGES,
  "es-ES": ES_ES_MESSAGES,
  "de-DE": DE_DE_MESSAGES,
};

/** Returns the dictionary if it can be used now, without waiting. */
export function getLocaleDictionary(
  locale: NonDefaultLocale
): LocaleDictionary | undefined {
  return LOCALE_DICTIONARIES[locale];
}

/** Resolves with the dictionary once it can be used. */
export function loadLocaleDictionary(
  locale: NonDefaultLocale
): Promise<LocaleDictionary> {
  return Promise.resolve(LOCALE_DICTIONARIES[locale]);
}

/**
 * Returns a load to wait for before hydrating, or `null`. Every dictionary is
 * already here, so nothing is ever pending.
 */
export function getPendingRouteLocaleLoad(): Promise<unknown> | null {
  return null;
}
