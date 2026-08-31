"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import { useAuth } from "@/components/auth/Auth";
import ProgressChart from "@/components/levels/ProgressChart";
import TableOfLevels from "@/components/levels/TableOfLevels";
import YourLevelSummary from "@/components/levels/YourLevelSummary";
import {
  NETWORK_PAGE_TITLE_CLASSES,
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
  NETWORK_REFERENCE_SECTION_HEADING_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type NetworkLevelsMessageKey = Extract<MessageKey, `network.levels.${string}`>;

const PANEL_CLASS =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60";

const m = (locale: SupportedLocale, key: NetworkLevelsMessageKey) =>
  t(locale, key);

export default function LevelsClient() {
  const locale = useBrowserLocale();
  const {
    activeProfileProxy,
    connectedProfile,
    fetchingProfile,
    isAuthenticated,
  } = useAuth();
  const activeProfile = activeProfileProxy?.created_by ?? connectedProfile;
  const showYourLevel =
    isAuthenticated === true && !fetchingProfile && activeProfile !== null;

  useSetTitle(m(locale, "network.levels.metadata.title"));

  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/levels"
          desktopFlush
          withDivider
        />

        <article className="tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <header className="tw-pb-8 sm:tw-pb-10">
            <h1 className={NETWORK_PAGE_TITLE_CLASSES}>
              {m(locale, "network.levels.hero.title")}
            </h1>
            <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
              {m(locale, "network.levels.intro")}
            </p>
          </header>

          <div className={`${PANEL_CLASS} tw-overflow-hidden tw-p-4 sm:tw-p-6`}>
            <ProgressChart />
          </div>

          <section
            aria-labelledby="levels-thresholds-heading"
            className="tw-pb-8 tw-pt-8 sm:tw-pb-12 sm:tw-pt-10"
          >
            <div className="tw-max-w-3xl">
              <h2
                className={NETWORK_REFERENCE_SECTION_HEADING_CLASSES}
                id="levels-thresholds-heading"
              >
                {m(locale, "network.levels.table.caption")}
              </h2>
              <div className="tw-mt-4">
                <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
                  {m(locale, "network.levels.trust")}
                </p>
                <div className="tw-mt-4 tw-space-y-3 tw-text-sm tw-leading-6 tw-text-iron-400">
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

            {showYourLevel && (
              <YourLevelSummary locale={locale} profile={activeProfile} />
            )}

            <div className="tw-mt-6 tw-min-w-0 sm:tw-mt-8">
              <TableOfLevels />
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
