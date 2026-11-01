import { kt } from "@/components/explained/i18n";
import { chapterById } from "@/components/explained/shell/chapters";
import type { PageIndexRow } from "@/components/explained/shell/PageIndex";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import ChapterPages from "./ChapterPages";
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
      className={EX_LAYOUT.sectionTight}
      aria-labelledby="tdh-deeper-title"
    >
      <div className={EX_LAYOUT.ed}>
        <div className="lg:tw-pt-2.5">
          <span className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-primary-300">
            05
          </span>
          <span className={EX_TEXT.label} id="tdh-deeper-title">
            {ot(locale, "index.label")}
          </span>
        </div>
        <div className={EX_LAYOUT.edWide}>
          <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300 lg:tw-pt-2.5">
            {orich(locale, "index.start", {
              hold: <span>{n("how")}</span>,
              check: <span>{n("check")}</span>,
            })}
          </p>
        </div>
      </div>
      <div className="tw-mt-6" id="tdh-explore">
        <ChapterPages rows={rows} locale={locale} />
      </div>
    </section>
  );
}
