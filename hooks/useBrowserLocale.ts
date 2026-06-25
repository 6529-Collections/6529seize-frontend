"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";

const getBrowserLocale = (): SupportedLocale => {
  const [preferredLocale] = globalThis.navigator.languages;

  return normalizeLocale(preferredLocale ?? globalThis.navigator.language);
};

export const useBrowserLocale = (): SupportedLocale => {
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
