import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { HUB_HREF } from "./chapters";
import HowWeKnowActions from "./HowWeKnowActions";

/**
 * How we know (EXPLAINED.md §6.2): the sources of the page, each with its
 * time, then the five actions. Every page ends with it.
 */
export interface HowWeKnowRow {
  readonly title: string;
  readonly body: ReactNode;
}

/** Where readers report an error: 6529.io's contact page. */
const REPORT_HREF = "/about/contact-us";
/** The corrections log: a section of the hub. */
const CORRECTIONS_HREF = `${HUB_HREF}#corrections`;

export default function HowWeKnow({
  rows,
  locale,
  title,
  slug,
  reportHref = REPORT_HREF,
  correctionsHref = CORRECTIONS_HREF,
}: {
  readonly rows: readonly HowWeKnowRow[];
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly slug: string;
  readonly reportHref?: string;
  readonly correctionsHref?: string;
}) {
  const heading = kt(locale, "explained.kit.hwk.title");
  // Rows fill whole lines: four as two pairs (four across on a wide
  // screen), two side by side, anything else in threes.
  const columns =
    rows.length % 4 === 0
      ? "md:tw-grid-cols-2 xl:tw-grid-cols-4"
      : rows.length === 2
        ? "md:tw-grid-cols-2"
        : "md:tw-grid-cols-3";
  return (
    <footer
      aria-label={heading}
      className="tw-mt-[88px] tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pb-[72px] tw-pt-[30px] md:tw-mt-[140px] lg:tw-grid lg:tw-grid-cols-[192px_minmax(0,1fr)] lg:tw-gap-x-8"
      data-ex-hwk=""
    >
      <h2 className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {heading}
      </h2>
      <div>
        <div
          className={`tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-5 lg:tw-mt-0 ${columns}`}
        >
          {rows.map((row) => (
            <div
              key={row.title}
              className="tw-text-sm tw-leading-[21px] tw-text-iron-400"
            >
              <b className="tw-mb-0.5 tw-block tw-text-[15px] tw-font-semibold tw-text-iron-50">
                {row.title}
              </b>
              {row.body}
            </div>
          ))}
        </div>
        <HowWeKnowActions
          locale={locale}
          title={title}
          slug={slug}
          reportHref={reportHref}
          correctionsHref={correctionsHref}
        />
      </div>
    </footer>
  );
}
