import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { fmt, isFact, type FactEntry } from "@/lib/explained/facts";
import { kt, type KitKey } from "../i18n";
import { Glyph, type GlyphKind } from "../marks/glyphs";
import Tag from "../marks/Tag";
import FactValue from "../facts/FactValue";

/**
 * One day's verdict (EXPLAINED.md §6.4): the word with its mark, the date
 * and cycle, the holder sentence, the limit inside the same block, then the
 * totals as an equation and the file's hash against the index. A day uses
 * the same marks as a claim: Equal is Tested, Differs Shown false, a known
 * cause Tested with the words, a missing file Not guaranteed, a late run ↻.
 */
export type VerdictState =
  | "equal"
  | "differs"
  | "knownCause"
  | "missing"
  | "late"
  | "simulated";

const WORD: Record<VerdictState, KitKey> = {
  equal: "explained.kit.verdict.equal",
  differs: "explained.kit.verdict.differs",
  simulated: "explained.kit.verdict.differs",
  knownCause: "explained.kit.verdict.knownCause",
  missing: "explained.kit.verdict.missing",
  late: "explained.kit.verdict.late",
};

const GLYPH: Record<VerdictState, GlyphKind> = {
  equal: "tested",
  knownCause: "tested",
  differs: "shownFalse",
  simulated: "shownFalse",
  missing: "notGuaranteed",
  late: "notYet",
};

const FRAME: Record<VerdictState, string> = {
  equal:
    "tw-border-green/40 tw-bg-[linear-gradient(135deg,rgba(60,203,127,0.09),transparent_60%)]",
  knownCause:
    "tw-border-green/40 tw-bg-[linear-gradient(135deg,rgba(60,203,127,0.09),transparent_60%)]",
  differs: "tw-border-error/55 tw-bg-error/[0.05]",
  simulated:
    "tw-border-error/55 tw-bg-[repeating-linear-gradient(135deg,rgba(249,112,102,0.05)_0_12px,transparent_12px_24px)]",
  missing: "tw-border-dashed tw-border-iron-700",
  late: "tw-border-dashed tw-border-iron-700",
};

const WORD_TONE: Record<VerdictState, string> = {
  equal: "tw-text-green",
  knownCause: "tw-text-green",
  differs: "tw-text-error",
  simulated: "tw-text-error",
  missing: "tw-text-iron-300",
  late: "tw-text-iron-300",
};

export default function Verdict({
  state,
  date,
  cycle,
  headline,
  children,
  aside,
  actions,
  incident,
  locale,
  word,
}: {
  readonly state: VerdictState;
  /**
   * The verdict's word when the state's own does not say it: a day whose
   * 6529.io upload was not compared shows the Not guaranteed frame with
   * "Not compared", not "No file for this day".
   */
  readonly word?: string;
  /** The result's date and cycle, from the facts. */
  readonly date: FactEntry | null;
  readonly cycle: FactEntry | null;
  /** The holder sentence, as a heading. */
  readonly headline: ReactNode;
  /** The detail and the limit, inside the block. */
  readonly children?: ReactNode;
  /** The equation and the file line. */
  readonly aside?: ReactNode;
  /** Today's receipt, check your record, Break it. */
  readonly actions?: ReactNode;
  /** A failing day's incident steps, the first `done` of them reached. */
  readonly incident?: {
    readonly steps: readonly string[];
    readonly done: number;
  };
  readonly locale: SupportedLocale;
}) {
  const simulated = state === "simulated";
  const shownWord = word ?? kt(locale, WORD[state]);
  return (
    <section
      className={`tw-grid tw-grid-cols-1 tw-gap-[22px] tw-rounded-xl tw-border tw-border-solid tw-px-[18px] tw-py-5 max-[359px]:tw-px-3 md:tw-px-[30px] md:tw-pb-[26px] md:tw-pt-[30px] lg:tw-grid-cols-[minmax(0,1fr)_380px] lg:tw-gap-11 ${FRAME[state]}`}
      data-verdict={state}
      aria-label={shownWord}
    >
      <div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3.5">
          <Glyph kind={GLYPH[state]} className="tw-size-10" />
          <span
            className={`tw-text-[15px] tw-font-bold tw-uppercase tw-tracking-[0.02em] ${WORD_TONE[state]}`}
          >
            {shownWord}
          </span>
          {simulated ? (
            <>
              <Tag kind="simulated" locale={locale} />
              <span className="tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
                {kt(locale, "explained.kit.verdict.simulatedNote")}
              </span>
            </>
          ) : (
            <span className="tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
              <b className="tw-font-semibold tw-text-iron-300">
                <FactValue fact={date} locale={locale} style="long" />
              </b>
              {cycle &&
                isFact(cycle) &&
                ` · ${kt(locale, "explained.kit.verdict.cycle", { cycle: fmt(cycle, locale) })}`}
            </span>
          )}
        </div>
        <h2 className="tw-m-0 tw-mb-3 tw-mt-4 tw-text-2xl tw-font-semibold tw-leading-[31px] tw-tracking-[-0.02em] tw-text-iron-50 max-[359px]:tw-hyphens-auto max-[359px]:tw-text-xl max-[359px]:tw-leading-[27px] md:tw-text-[32px] md:tw-leading-10">
          {headline}
        </h2>
        {children}
        {incident && (
          <ol
            className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-3 tw-gap-x-1 tw-gap-y-2.5 tw-p-0 md:tw-grid-cols-5"
            aria-label={kt(locale, "explained.kit.verdict.incident")}
          >
            {incident.steps.map((step, index) => (
              <li
                key={step}
                className={`tw-border-0 tw-border-t-[3px] tw-border-solid tw-pt-[9px] tw-text-[13px] tw-font-semibold ${index < incident.done ? "tw-border-error tw-text-iron-50" : "tw-border-iron-700 tw-text-iron-400"}`}
              >
                {step}
              </li>
            ))}
          </ol>
        )}
        {actions !== undefined && actions !== null && (
          <div className="tw-mt-[22px] tw-flex tw-flex-wrap tw-gap-2.5">
            {actions}
          </div>
        )}
      </div>
      {aside !== undefined && aside !== null && <div>{aside}</div>}
    </section>
  );
}
