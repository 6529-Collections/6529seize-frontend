import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  LEGACY_BROWSER_NOTICE_ID,
  LEGACY_BROWSER_VARIANTS,
  type LegacyBrowserVariant,
} from "./legacyBrowserGate";

const COPY: Readonly<
  Record<
    LegacyBrowserVariant,
    { readonly title: MessageKey; readonly body: MessageKey }
  >
> = {
  ios: { title: "legacyBrowser.ios.title", body: "legacyBrowser.ios.body" },
  other: {
    title: "legacyBrowser.other.title",
    body: "legacyBrowser.other.body",
  },
};

/**
 * Shown by the inline legacy-browser scripts (legacyBrowserGate.ts) on
 * browsers that cannot run the site; hidden by inline CSS everywhere else.
 * Rendered in the server locale, like the root layout's `lang`.
 */
export default function LegacyBrowserNotice() {
  return (
    <div id={LEGACY_BROWSER_NOTICE_ID}>
      {LEGACY_BROWSER_VARIANTS.map((variant) => (
        <section
          key={variant}
          data-legacy-variant={variant}
          aria-labelledby={`${LEGACY_BROWSER_NOTICE_ID}-${variant}`}
        >
          <h1 id={`${LEGACY_BROWSER_NOTICE_ID}-${variant}`}>
            {t(DEFAULT_LOCALE, COPY[variant].title)}
          </h1>
          <p>{t(DEFAULT_LOCALE, COPY[variant].body)}</p>
        </section>
      ))}
    </div>
  );
}
