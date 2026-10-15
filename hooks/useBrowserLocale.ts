"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  getBrowserLocale,
  type SupportedLocale,
} from "@/i18n/locales";
import { hasLocaleMessages, loadLocaleMessages } from "@/i18n/messages";

export const useBrowserLocale = (): SupportedLocale => {
  // Keep SSR and the first hydration render identical. Browser preferences
  // are applied by the effect only after hydration has completed.
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    let active = true;

    const updateLocale = () => {
      const browserLocale = getBrowserLocale();
      if (hasLocaleMessages(browserLocale)) {
        setLocale(browserLocale);
        return;
      }

      // Keep the current locale until the dictionary arrives, so copy and
      // formatting switch together. If it cannot load, stay where we are.
      loadLocaleMessages(browserLocale)
        .then(() => {
          if (active && getBrowserLocale() === browserLocale) {
            setLocale(browserLocale);
          }
        })
        .catch(() => undefined);
    };

    updateLocale();
    globalThis.addEventListener("languagechange", updateLocale);

    return () => {
      active = false;
      globalThis.removeEventListener("languagechange", updateLocale);
    };
  }, []);

  return locale;
};
