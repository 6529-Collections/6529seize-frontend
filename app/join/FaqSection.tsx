import type { SupportedLocale } from "@/i18n/locales";

import { FaqAccordion, type FaqAccordionItem } from "./FaqAccordion";
import { FAQ_ITEM_SPECS, type JoinLinks } from "./page.content";
import { cx, m, resolveHref, SECTION_HEADING_CLASS } from "./page.utils";

export function FaqSection({
  links,
  locale,
}: {
  readonly links: JoinLinks;
  readonly locale: SupportedLocale;
}) {
  const items: readonly FaqAccordionItem[] = FAQ_ITEM_SPECS.map((item) => {
    const faqItem = {
      id: item.id,
      question: m(locale, item.questionKey),
      answer: m(locale, item.answerKey),
      learnMoreLabel: m(locale, "join6529.action.learnMore"),
    };

    return item.learnMoreHref === undefined
      ? faqItem
      : {
          ...faqItem,
          learnMoreHref: resolveHref(item.learnMoreHref, links),
        };
  });

  return (
    <section
      className="tw-mx-auto tw-w-full tw-max-w-5xl tw-px-4 tw-py-12 md:tw-px-6 md:tw-py-16 lg:tw-px-8"
      id="faq"
    >
      <div className="tw-mx-auto tw-mb-12 tw-max-w-4xl tw-text-center">
        <h2 className={cx("tw-mb-4", SECTION_HEADING_CLASS)}>
          {m(locale, "join6529.faq.heading")}
        </h2>
        <p className="tw-text-[15px] tw-font-light tw-leading-6 tw-text-iron-500">
          {m(locale, "join6529.faq.subheading")}
        </p>
      </div>
      <FaqAccordion items={items} />
    </section>
  );
}
