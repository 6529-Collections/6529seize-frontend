"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { HOME_SECTION_TITLE_CLASSES } from "./homeInteractionStyles";

export default function HomePageTextSection() {
  const locale = useBrowserLocale();
  return (
    <section
      aria-labelledby="network-society-heading"
      data-home-section="About 6529"
      className="tw-px-4 tw-py-20 md:tw-px-6 md:tw-py-32 lg:tw-px-8"
    >
      <div className="tw-mx-auto tw-grid tw-max-w-[1200px] tw-gap-6 md:tw-grid-cols-[0.85fr_1.6fr] md:tw-gap-14">
        <h2
          id="network-society-heading"
          className={`${HOME_SECTION_TITLE_CLASSES} tw-max-w-[320px]`}
        >
          {t(locale, "home.statement.title")}
        </h2>
        <div>
          <p className="tw-m-0 tw-text-pretty tw-text-[21px] tw-leading-[1.5] tw-tracking-[-0.025em] tw-text-iron-400 md:tw-text-[30px] md:tw-leading-[1.45]">
            {t(locale, "home.statement.before")}
            <strong className="tw-font-normal tw-text-iron-100">
              {t(locale, "home.statement.emphasis")}
            </strong>
            {t(locale, "home.statement.after")}
          </p>
          <p className="tw-mb-0 tw-mt-6 tw-w-fit tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-px-3 tw-py-2 tw-text-[10px] tw-font-medium tw-uppercase tw-leading-relaxed tw-tracking-[0.08em] tw-text-iron-400">
            {t(locale, "home.statement.goal")}
          </p>
        </div>
      </div>
    </section>
  );
}
