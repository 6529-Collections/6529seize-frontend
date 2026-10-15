import {
  DEFAULT_LOCALE,
  getBrowserLocale,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";
import type {
  LocaleDictionary,
  NonDefaultLocale,
} from "@/i18n/localeDictionaries";

// Turbopack browser bundles resolve `@/i18n/localeDictionaries` to this file
// (see `turbopack.resolveAlias` in config/nextConfig.ts). Each non-default
// dictionary is a separate chunk loaded on first use; until it arrives, `t()`
// falls back to en-US copy. The exports mirror `./localeDictionaries.ts`.

const ROUTE_LOCALE_PARAM = "locale";

const LOCALE_DICTIONARY_LOADERS: Record<
  NonDefaultLocale,
  () => Promise<LocaleDictionary>
> = {
  "en-GB": () =>
    import("@/i18n/messages/en-GB").then((module) => module.EN_GB_MESSAGES),
  "fr-FR": () =>
    import("@/i18n/messages/fr-FR").then((module) => module.FR_FR_MESSAGES),
  "es-ES": () =>
    import("@/i18n/messages/es-ES").then((module) => module.ES_ES_MESSAGES),
  "de-DE": () =>
    import("@/i18n/messages/de-DE").then((module) => module.DE_DE_MESSAGES),
};

const loadedDictionaries = new Map<NonDefaultLocale, LocaleDictionary>();
const pendingLoads = new Map<NonDefaultLocale, Promise<LocaleDictionary>>();

function isNonDefaultLocale(
  locale: SupportedLocale
): locale is NonDefaultLocale {
  return locale !== DEFAULT_LOCALE;
}

export function getLocaleDictionary(
  locale: NonDefaultLocale
): LocaleDictionary | undefined {
  return loadedDictionaries.get(locale);
}

export function loadLocaleDictionary(
  locale: NonDefaultLocale
): Promise<LocaleDictionary> {
  const pendingLoad = pendingLoads.get(locale);
  if (pendingLoad) {
    return pendingLoad;
  }

  const load = LOCALE_DICTIONARY_LOADERS[locale]().then((dictionary) => {
    loadedDictionaries.set(locale, dictionary);
    return dictionary;
  });
  pendingLoads.set(locale, load);
  // Drop a failed load so a later caller asks again. In a production
  // Turbopack bundle a chunk that failed usually keeps failing until the page
  // reloads; copy stays in en-US meanwhile.
  load.catch(() => {
    pendingLoads.delete(locale);
  });
  return load;
}

function startLoad(locale: SupportedLocale): Promise<unknown> | null {
  return isNonDefaultLocale(locale)
    ? loadLocaleDictionary(locale).catch(() => undefined)
    : null;
}

// Start both requests while the page's scripts evaluate, before hydration.
// `?locale=` pages were server-rendered in that locale and hydrate once it
// arrives; the browser locale is applied after hydration by useBrowserLocale.
// Some browser contexts (workers, prerender) have no location.
const pageLocation = (globalThis as { location?: Location }).location;
const routeLocale = normalizeLocale(
  pageLocation === undefined
    ? null
    : new URLSearchParams(pageLocation.search).get(ROUTE_LOCALE_PARAM)
);
// Settles whether the dictionary loads or its chunk fails. After a failure
// the page hydrates with en-US copy and React re-renders over the server
// markup; holding hydration longer would not help.
let routeLocaleLoadSettled = false;
const routeLocaleLoad =
  startLoad(routeLocale)?.finally(() => {
    routeLocaleLoadSettled = true;
  }) ?? null;
void startLoad(getBrowserLocale());

export function getPendingRouteLocaleLoad(): Promise<unknown> | null {
  if (
    !isNonDefaultLocale(routeLocale) ||
    routeLocaleLoadSettled ||
    loadedDictionaries.has(routeLocale)
  ) {
    return null;
  }
  return routeLocaleLoad;
}
