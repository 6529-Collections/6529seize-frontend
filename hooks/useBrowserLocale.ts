"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

const getBrowserLocale = (): SupportedLocale => {
  const browserLanguages: unknown = Reflect.get(
    globalThis.navigator,
    "languages"
  );
  const browserLanguage: unknown = Reflect.get(
    globalThis.navigator,
    "language"
  );
  const preferredLocale =
    Array.isArray(browserLanguages) && typeof browserLanguages[0] === "string"
      ? browserLanguages[0]
      : undefined;

  return normalizeLocale(
    preferredLocale ??
      (typeof browserLanguage === "string" ? browserLanguage : undefined)
  );
};

export const useBrowserLocale = (): SupportedLocale => {
  // Keep SSR and the first hydration render identical. Browser preferences
  // are applied by the effect only after hydration has completed.
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const updateLocale = () => {
      setLocale(getBrowserLocale());
    };

    updateLocale();
    globalThis.addEventListener("languagechange", updateLocale);

    return () => {
      globalThis.removeEventListener("languagechange", updateLocale);
    };
  }, []);

  return locale;
};
