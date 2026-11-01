import Link from "next/link";
import Mark from "@/components/explained/marks/Mark";
import Track from "@/components/explained/marks/Track";
import { EX_LAYOUT, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { Fact } from "@/app/explained/_lib/facts";
import { orich, ot, type OverviewKey } from "./copy";
import SectionLabel from "./SectionLabel";

/**
 * §02 What it is for (TDH-DESIGN.md §4.1): your TDH is your weight here.
 * One number, recomputed daily, weighs four things: votes on the next
 * card, the ratings you can give, your Level (all live), and validators
 * later (decided, D112). The art itself is CC0: the hub's one-minute
 * answer says where that stops.
 */
interface Use {
  readonly title: OverviewKey;
  readonly body: OverviewKey;
  readonly status: "live" | "decided";
}

const USES: readonly Use[] = [
  { title: "uses.votes", body: "uses.votesBody", status: "live" },
  { title: "uses.ratings", body: "uses.ratingsBody", status: "live" },
  { title: "uses.level", body: "uses.levelBody", status: "live" },
  { title: "uses.validators", body: "uses.validatorsBody", status: "decided" },
];

/** Cells of the 2 × 2 grid: a rule on the left of the second column, none under the last row. */
function cellFrame(index: number): string {
  const right =
    index % 2 === 1
      ? "md:tw-border-l md:tw-border-solid md:tw-border-iron-900"
      : "";
  const bottom = index < 2 ? "md:tw-border-b" : "md:tw-border-b-0";
  return `${right} ${bottom}`;
}

export default function WhatItIsFor({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  return (
    <section id="tdh-weight" className={EX_LAYOUT.section}>
      <div className={EX_LAYOUT.stmt}>
        <div>
          <SectionLabel no="02" label={ot(locale, "weight.label")} />
          <h2 className={EX_TEXT.stmt}>{ot(locale, "weight.title")}</h2>
        </div>
        <div className="lg:tw-pt-1.5">
          <p className={`${EX_TEXT.body} tw-m-0`}>
            {orich(locale, "weight.body", {
              cc0: (
                <Link className={EX_LINK} href="/explained#cc0">
                  {ot(locale, "weight.cc0")}
                </Link>
              ),
            })}
          </p>
        </div>
      </div>
      <figure
        className="tw-m-0 tw-mt-10 tw-grid tw-grid-cols-1 md:tw-mt-12 md:tw-grid-cols-[200px_minmax(0,1fr)]"
        aria-label={ot(locale, "uses.aria")}
      >
        <div className="tw-flex tw-flex-col tw-justify-start tw-gap-1.5 tw-rounded-t-xl tw-border tw-border-solid tw-border-primary-400/50 tw-bg-primary-400/[0.12] tw-p-4 md:tw-rounded-l-xl md:tw-rounded-tr-none md:tw-p-6">
          <span className={EX_TEXT.label}>{ot(locale, "uses.src")}</span>
          <span className="tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-primary-300">
            {ot(locale, "uses.srcNum")}
          </span>
          <span className={EX_TEXT.cap}>{ot(locale, "uses.srcCap")}</span>
        </div>
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-rounded-b-xl tw-border tw-border-t-0 tw-border-solid tw-border-iron-800 tw-p-0 md:tw-grid-cols-2 md:tw-rounded-r-xl md:tw-rounded-bl-none md:tw-border-l-0 md:tw-border-t">
          {USES.map((use, index) => (
            <li
              key={use.title}
              className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-p-4 last:tw-border-b-0 md:tw-px-6 md:tw-py-4 ${cellFrame(index)}`}
            >
              <h3 className={`${EX_TEXT.h4} md:tw-text-lg`}>
                {ot(locale, use.title)}
              </h3>
              <p className="tw-m-0 tw-mb-2.5 tw-mt-1.5 tw-text-base tw-leading-[25px] tw-text-iron-300">
                {use.title === "uses.validators"
                  ? orich(locale, use.body, {
                      version: (
                        <Fact
                          book={book}
                          id="site.validator.version"
                          locale={locale}
                        />
                      ),
                    })
                  : ot(locale, use.body)}
              </p>
              {use.status === "live" ? (
                <Track maturity="live" locale={locale} size="sm" />
              ) : (
                <Mark kind="decided" locale={locale} size="sm" refText="D112" />
              )}
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}
