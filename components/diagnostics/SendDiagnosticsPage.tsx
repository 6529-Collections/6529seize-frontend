"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  ABOUT_CARD_CLASS_NAME,
  ABOUT_PAGE_BOUNDARY_CLASS_NAME,
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_SUPPORTING_TEXT_CLASS_NAME,
} from "@/components/about/AboutLayout";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/diagnostics";
import dynamic from "next/dynamic";

// The panel reads this device's flight recorder, which the server never has.
const DiagnosticsPanel = dynamic(() => import("./DiagnosticsPanel"), {
  ssr: false,
});

/** `/about/diagnostics`: the help-menu entry and support deep link. */
export default function SendDiagnosticsPage() {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "diagnostics.metadata.title"));

  return (
    <main
      className={`tailwind-scope ${ABOUT_PAGE_BOUNDARY_CLASS_NAME} tw-bg-black tw-text-iron-50`}
    >
      <AboutContentsDropdown
        className="tw-w-full tw-px-4 sm:tw-px-6 lg:tw-px-8"
        currentHref="/about/diagnostics"
        flushBottom
        withDivider
      />
      <div className="tw-mx-auto tw-w-full tw-max-w-3xl tw-space-y-6 tw-px-4 tw-pb-16 tw-pt-8 sm:tw-px-6 sm:tw-pt-12 lg:tw-px-8">
        <header className="tw-space-y-3">
          <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>
            {t(locale, "diagnostics.title")}
          </h1>
          <p className={ABOUT_SUPPORTING_TEXT_CLASS_NAME}>
            {t(locale, "diagnostics.intro")}
          </p>
        </header>
        <div className={`${ABOUT_CARD_CLASS_NAME} tw-p-4 sm:tw-p-6`}>
          <DiagnosticsPanel />
        </div>
      </div>
    </main>
  );
}
