import { PlusIcon } from "@heroicons/react/24/outline";

import type { SupportedLocale } from "@/i18n/locales";

import { FAQ_ITEM_SPECS } from "./page.content";
import { cx, GLASS_PANEL_CLASS, m, SECTION_HEADING_CLASS } from "./page.utils";

export function FaqSection({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section className="tw-mx-auto tw-w-full tw-max-w-3xl tw-pb-20 tw-pt-12 md:tw-pb-24 md:tw-pt-16">
      <div className="tw-mb-12 tw-text-center">
        <h2 className={cx("tw-mb-4", SECTION_HEADING_CLASS)}>
          {m(locale, "join6529.faq.heading")}
        </h2>
        <p className="tw-text-[15px] tw-font-light tw-leading-6 tw-text-white/40">
          {m(locale, "join6529.faq.subheading")}
        </p>
      </div>
      <div className="tw-space-y-2">
        {FAQ_ITEM_SPECS.map((item) => (
          <details
            className={cx(GLASS_PANEL_CLASS, "tw-group tw-cursor-pointer")}
            key={item.id}
          >
            <summary className="tw-flex tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-px-6 tw-py-5 tw-text-base tw-font-medium tw-text-white/70 tw-transition-colors group-hover:tw-text-white [&::-webkit-details-marker]:tw-hidden">
              <span>{m(locale, item.questionKey)}</span>
              <PlusIcon
                aria-hidden="true"
                className="tw-h-3 tw-w-3 tw-shrink-0 tw-text-white/30 tw-transition-transform group-open:tw-rotate-45"
              />
            </summary>
            <div className="tw-px-6 tw-pb-6 tw-text-sm tw-leading-relaxed tw-text-white/40">
              {m(locale, item.answerKey)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
