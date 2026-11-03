import { kt } from "@/components/explained/i18n";
import { chapterById } from "@/components/explained/shell/chapters";
import type { PageIndexRow } from "@/components/explained/shell/PageIndex";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
import ChapterPages from "./ChapterPages";
import SectionLabel from "./SectionLabel";
import { orich, ot, type OverviewKey } from "./copy";

/**
 * §05 In this chapter (TDH-DESIGN.md §4.1): the spine 1 to 4 with a line
 * each, then the shelf S1 to S5, each with a line too; and where to start.
 */
const SPINE_DESC: Readonly<Record<string, OverviewKey>> = {
  how: "index.how",
  wallets: "index.wallets",
  check: "index.check",
  sure: "index.sure",
  proofs: "index.proofs",
  spec: "index.spec",
  impl: "index.impl",
  design: "index.design",
  versions: "index.versions",
  glossary: "index.glossary",
};

/** Each page's line, by page id: the not-found view lists the pages with them too. */
export function tdhPageLines(locale: SupportedLocale): Record<string, string> {
  return {
    // The overview lists the other pages, not itself; the not-found view
    // lists it too, so it needs its own line.
    overview: ot(locale, "index.overview"),
    ...Object.fromEntries(
      Object.entries(SPINE_DESC).map(([id, key]) => [id, ot(locale, key)])
    ),
  };
}

export default function InThisChapter({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const tdh = chapterById("tdh");
  const spine = [...tdh.read, ...tdh.check].filter(
    (page) => page.n !== undefined
  );
  const rows: PageIndexRow[] = [
    ...spine.map((page) => {
      const desc = SPINE_DESC[page.id];
      return {
        no: page.n ?? "",
        title: kt(locale, page.title),
        href: page.href,
        ...(desc === undefined ? {} : { desc: ot(locale, desc) }),
      };
    }),
    ...tdh.shelf.map((page, index) => {
      const desc = SPINE_DESC[page.id];
      return {
        no: `S${index + 1}`,
        title: kt(locale, page.title),
        href: page.href,
        shelf: true,
        ...(desc === undefined ? {} : { desc: ot(locale, desc) }),
      };
    }),
  ];
  const n = (id: string) => spine.find((page) => page.id === id)?.n ?? "";
  return (
    <section
      id="tdh-deeper"
      className={EX_LAYOUT.section}
      aria-labelledby="tdh-deeper-title"
    >
      {/* The same statement row as §01 to §04: number, label, heading. */}
      <div className={EX_LAYOUT.stmt}>
        <div>
          <SectionLabel no="05" label={ot(locale, "index.label")} />
          <h2 className={EX_TEXT.stmt} id="tdh-deeper-title">
            {orich(locale, "index.title", {
              // A count of this chapter's pages, not a fact about 6529.
              count: (
                <span data-ex-allow-number="count">
                  {formatCount(locale, spine.length)}
                </span>
              ),
            })}
          </h2>
        </div>
        <p className={`${EX_TEXT.body} tw-m-0 lg:tw-pt-1.5`}>
          {orich(locale, "index.start", {
            hold: <span>{n("how")}</span>,
            check: <span>{n("check")}</span>,
          })}
        </p>
      </div>
      <div className="tw-mt-8 md:tw-mt-10" id="tdh-explore">
        <ChapterPages rows={rows} locale={locale} />
      </div>
    </section>
  );
}
