"use client";

import { useEffect } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

/**
 * The server renders every page with the default locale, so the root layout
 * declares that as the document language. `useBrowserLocale` keeps SSR and the
 * first hydration render on the default locale and switches to the browser's
 * language afterwards. Keep `<html lang>` in step with it once it does
 * (WCAG 3.1.1), so a screen reader pronounces the translated copy correctly.
 * Content rendered in a route's `?locale=` carries its own `lang` (WCAG 3.1.2).
 */
export default function DocumentLanguage() {
  const locale = useBrowserLocale();

  useEffect(() => {
    const root = document.documentElement;
    if (root.lang !== locale) {
      root.lang = locale;
    }
  }, [locale]);

  return null;
}
