import clsx from "clsx";
import type { Metadata } from "next";

import {
  ABOUT_LEAD_TEXT_CLASS_NAME,
  ABOUT_PAGE_TITLE_CLASS_NAME,
  CONTENT_PAGE_CONTAINER_CLASS,
  CONTENT_PAGE_MAIN_CLASS,
} from "@/components/about/AboutLayout";
import { getAppMetadata } from "@/components/providers/metadata";
import WorldTimeZonesAttribution from "@/components/tools/time-zones/WorldTimeZonesAttribution";
import WorldTimeZonesExplorer from "@/components/tools/time-zones/WorldTimeZonesExplorer";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.css";

const TIME_ZONES_PAGE_LOCALE = DEFAULT_LOCALE;

export const metadata: Metadata = getAppMetadata(
  {
    title: t(TIME_ZONES_PAGE_LOCALE, "tools.timeZones.metadata.title"),
    description: t(
      TIME_ZONES_PAGE_LOCALE,
      "tools.timeZones.metadata.description"
    ),
  },
  { canonicalPath: "/tools/time-zones" }
);

// Static shell rendered on the server. Only the live clocks, map and table
// below are a Client Component, and they render times after mount.
export default function WorldTimeZonesPage() {
  const locale = TIME_ZONES_PAGE_LOCALE;
  return (
    <main className={clsx(styles["main"], CONTENT_PAGE_MAIN_CLASS)}>
      <div
        className={clsx(
          CONTENT_PAGE_CONTAINER_CLASS,
          "tw-mx-auto tw-w-full tw-max-w-[90rem] sm:tw-pt-10"
        )}
      >
        <header>
          <p className="tw-m-0 tw-mb-2 tw-text-label tw-font-semibold tw-uppercase tw-text-iron-400">
            {t(locale, "tools.timeZones.eyebrow")}
          </p>
          <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>
            {t(locale, "tools.timeZones.title")}
          </h1>
          <p
            className={clsx(
              ABOUT_LEAD_TEXT_CLASS_NAME,
              "tw-m-0 tw-mt-3 tw-max-w-3xl"
            )}
          >
            {t(locale, "tools.timeZones.lead")}
          </p>
        </header>
        <WorldTimeZonesExplorer />
        <WorldTimeZonesAttribution locale={locale} />
      </div>
    </main>
  );
}
