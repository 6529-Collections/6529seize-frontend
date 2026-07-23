"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import ProgressChart from "@/components/levels/ProgressChart";
import TableOfLevels from "@/components/levels/TableOfLevels";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type NetworkLevelsMessageKey = Extract<MessageKey, `network.levels.${string}`>;

const SECTION_HEADING_CLASS =
  "tw-m-0 tw-text-lg tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl";
const PANEL_CLASS =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60";
const EDITORIAL_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-items-start tw-gap-6 lg:tw-grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:tw-gap-12";

const m = (locale: SupportedLocale, key: NetworkLevelsMessageKey) =>
  t(locale, key);

export default function LevelsClient() {
  const locale = useBrowserLocale();

  useSetTitle("Levels | Network");

  return (
    <main
      className={`${NETWORK_REFERENCE_PAGE_CLASSES} tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900 tw-text-iron-100`}
    >
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/levels"
          withDivider
        />

        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <header className="tw-pb-8 sm:tw-pb-10">
            <h1 className="tw-m-0 tw-text-[22px] tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
              {m(locale, "network.levels.hero.title")}
            </h1>
            <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
              {m(locale, "network.levels.intro")}
            </p>
          </header>

          <div className={`${PANEL_CLASS} tw-overflow-hidden tw-p-4 sm:tw-p-6`}>
            <ProgressChart />
          </div>

          <section
            aria-labelledby="levels-thresholds-heading"
            className={`${EDITORIAL_GRID_CLASS} tw-pb-8 tw-pt-8 sm:tw-pb-12 sm:tw-pt-10`}
          >
            <div className="lg:tw-sticky lg:tw-top-28">
              <h2
                className={SECTION_HEADING_CLASS}
                id="levels-thresholds-heading"
              >
                {m(locale, "network.levels.table.caption")}
              </h2>
              <div className="tw-mt-4">
                <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
                  {m(locale, "network.levels.trust")}
                </p>
                <div className="tw-mt-4 tw-space-y-3 tw-text-sm tw-leading-6 tw-text-iron-500">
                  <p className="tw-m-0">{m(locale, "network.levels.limit")}</p>
                  <p className="tw-m-0">
                    {m(locale, "network.levels.determinedByTable")}
                  </p>
                  <p className="tw-m-0">
                    {m(locale, "network.levels.adjustments")}
                  </p>
                </div>
              </div>
            </div>

            <div className="tw-min-w-0">
              <TableOfLevels />
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
