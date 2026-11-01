import type { ReactNode } from "react";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import Mark, { type MarkKind } from "@/components/explained/marks/Mark";
import Tag from "@/components/explained/marks/Tag";
import Track, { type Maturity } from "@/components/explained/marks/Track";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { ht, type HubKey } from "./copy";

/**
 * How to read these pages (EXPLAINED.md §3; MAP.md §3): the four questions
 * every claim answers, each with its marks and what each mark means.
 */
const NOTE = "tw-text-sm tw-leading-5 tw-text-iron-400";

const RULE: readonly { kind: MarkKind; note: HubKey }[] = [
  { kind: "decided", note: "guide.decided" },
  { kind: "absolute", note: "guide.absolute" },
  { kind: "proposed", note: "guide.proposed" },
  { kind: "open", note: "guide.open" },
];
const RUNS: readonly Maturity[] = ["design", "built", "live"];
const KNOW: readonly { kind: MarkKind; note?: HubKey }[] = [
  { kind: "proved", note: "guide.proved" },
  { kind: "tested", note: "guide.tested" },
  { kind: "shownFalse" },
  { kind: "notGuaranteed", note: "guide.notGuaranteed" },
  { kind: "assumed", note: "guide.assumed" },
  { kind: "notYet" },
];

function Column({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <div>
      <h3 className="tw-m-0 tw-mb-2.5 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50">
        {title}
      </h3>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0">
        {children}
      </ul>
    </div>
  );
}

export default function ReadingGuide({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section id="guide" className={EX_LAYOUT.section}>
      <div className={EX_LAYOUT.ed}>
        <div className="lg:tw-pt-2.5">
          <span className={EX_TEXT.label}>{ht(locale, "guide.label")}</span>
        </div>
        <div className={EX_LAYOUT.edWide}>
          <h2 className={EX_TEXT.h2}>{ht(locale, "guide.title")}</h2>
          <p className={`${EX_TEXT.body} tw-m-0 tw-mt-3 tw-max-w-[660px]`}>
            {ht(locale, "guide.body")}
          </p>
        </div>
      </div>
      <div className="tw-mt-8 tw-grid tw-grid-cols-1 tw-gap-6 md:tw-grid-cols-2 lg:tw-grid-cols-4 lg:tw-gap-5">
        <Column title={ht(locale, "guide.rule")}>
          {RULE.map((item) => (
            <li key={item.kind} className={NOTE}>
              <Mark kind={item.kind} locale={locale} size="sm" />{" "}
              {ht(locale, item.note)}
            </li>
          ))}
        </Column>
        <Column title={ht(locale, "guide.runs")}>
          {RUNS.map((maturity) => (
            <li key={maturity} className={NOTE}>
              <Track maturity={maturity} locale={locale} size="sm" />
            </li>
          ))}
        </Column>
        <Column title={ht(locale, "guide.know")}>
          {KNOW.map((item) => (
            <li key={item.kind} className={NOTE}>
              <Mark kind={item.kind} locale={locale} size="sm" />
              {item.note ? ` ${ht(locale, item.note)}` : ""}
            </li>
          ))}
          <li className={NOTE}>
            <HalfPair a b={false} locale={locale} />{" "}
            {ht(locale, "guide.halfPair")}
          </li>
        </Column>
        <Column title={ht(locale, "guide.since")}>
          <li className={NOTE}>{ht(locale, "guide.sinceLive")}</li>
          <li className={NOTE}>
            <Mark kind="drift" locale={locale} size="sm" />{" "}
            {ht(locale, "guide.drift")}
          </li>
          <li className={NOTE}>
            <Tag kind="example" locale={locale} /> {ht(locale, "guide.example")}
          </li>
        </Column>
      </div>
    </section>
  );
}
