import type { ReactNode } from "react";
import Equation from "@/components/explained/evidence/Equation";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import { LimitNote } from "@/components/explained/evidence/notes";
import {
  SimulationButton,
  SimulationSwitch,
  WhenReal,
  WhenSimulated,
} from "@/components/explained/evidence/Simulation";
import { fill, kt } from "@/components/explained/i18n";
import DriftNote from "@/components/explained/marks/DriftNote";
import { Glyph } from "@/components/explained/marks/glyphs";
import Tag from "@/components/explained/marks/Tag";
import { EX_BUTTON, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
import { CONTRACT_CHECKS } from "./_lib/checks";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import {
  STATEMENT_WORDS,
  compareOutputs,
  decodeStatement,
} from "./_lib/statement";

/**
 * The first screen (TDH-DESIGN.md §4, genre V; evidence first): the title
 * and lede, then the proof of the 2026-10-11 day as a verdict, with its
 * limit inside the block and the three totals that agree, and its failing
 * case one press away (a pair whose outputs differ, which the contract
 * refuses; marked Simulated). Then the newer decisions that touch it, and
 * the record so far.
 */
const TOTAL_WORD = STATEMENT_WORDS.findIndex(
  (word) => word.name === "totalTDH"
);

/**
 * The failing pair: program B's output is proof A's with the total one
 * higher, and the contract's own comparison (its check 2) names the word it
 * refuses.
 */
function refusedWord(facts: PageFacts): number {
  const words = facts.strings("proofs.day.wordsA");
  if (!words) return TOTAL_WORD;
  const a = decodeStatement(words);
  const b = a.map((entry) =>
    entry.index === TOTAL_WORD && entry.value !== null
      ? {
          ...entry,
          hex: `0x${(entry.value + 1n).toString(16).padStart(64, "0")}`,
        }
      : entry
  );
  const verdict = compareOutputs(a, b);
  return verdict.accepted ? TOTAL_WORD : verdict.word;
}

function Header({
  locale,
  chapterNumber,
  pageNumber,
  pageTitle,
}: {
  readonly locale: SupportedLocale;
  readonly chapterNumber: string;
  readonly pageNumber: string;
  readonly pageTitle: string;
}) {
  return (
    <header className="tw-pt-[30px] md:tw-pt-[52px]" id="top">
      <span className={EX_TEXT.label}>
        {rich(locale, k("eyebrow"), {
          chapter: <span>{chapterNumber}</span>,
          n: <span className="tw-text-primary-300">{pageNumber}</span>,
          page: pageTitle,
        })}
      </span>
      <h1 className={`${EX_TEXT.h1r} tw-mt-4 tw-max-w-[900px]`}>
        {rich(locale, k("h1"))}
      </h1>
      <p className={`${EX_TEXT.lede} tw-mt-4 md:tw-mt-[22px]`} data-ex-lede="">
        {rich(locale, k("lede"))}
      </p>
    </header>
  );
}

function VerdictFrame({
  simulated,
  head,
  headline,
  children,
  aside,
  actions,
}: {
  readonly simulated: boolean;
  readonly head: ReactNode;
  readonly headline: ReactNode;
  readonly children: ReactNode;
  readonly aside: ReactNode;
  readonly actions: ReactNode;
}) {
  const frame = simulated
    ? "tw-border-error/55 tw-bg-[repeating-linear-gradient(135deg,rgba(249,112,102,0.05)_0_12px,transparent_12px_24px)]"
    : "tw-border-iron-800 tw-bg-[linear-gradient(135deg,rgba(60,203,127,0.06),transparent_55%)]";
  return (
    <section
      className={`tw-grid tw-grid-cols-1 tw-gap-[22px] tw-rounded-xl tw-border tw-border-solid tw-px-[18px] tw-py-5 md:tw-px-[30px] md:tw-pb-[26px] md:tw-pt-[30px] lg:tw-grid-cols-[minmax(0,1fr)_380px] lg:tw-gap-11 ${frame}`}
      data-verdict={simulated ? "simulated" : "halfpair"}
      {...(simulated ? { "data-simulated": "" } : {})}
    >
      <div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3.5">
          {head}
        </div>
        <h2 className="tw-m-0 tw-mb-3 tw-mt-4 tw-text-2xl tw-font-semibold tw-leading-[31px] tw-tracking-[-0.02em] tw-text-iron-50 md:tw-text-[30px] md:tw-leading-[38px]">
          {headline}
        </h2>
        {children}
      </div>
      <div>{aside}</div>
      {/* The actions span the frame, so the three sit on one row. */}
      <div className="tw-flex tw-flex-wrap tw-gap-2.5 lg:tw-col-span-2 lg:-tw-mt-3">
        {actions}
      </div>
    </section>
  );
}

function Actions({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  return (
    <>
      <a className={EX_BUTTON.cta} href="#statement">
        <span>
          {rich(locale, k("verdict.toWords"), {
            words: facts.print("proofs.statement.words"),
          })}
        </span>
      </a>
      <a className={EX_BUTTON.secondary} href="#guarantees">
        <span>{rich(locale, k("verdict.toGuarantees"))}</span>
      </a>
      <SimulationButton
        id="pairfails"
        edge={fill(locale, k("verdict.breakEdge"))}
        back={fill(locale, k("verdict.breakBack"))}
      />
    </>
  );
}

function RealVerdict({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const p = (children: ReactNode) => (
    <p className="tw-m-0 tw-mb-4 tw-max-w-[620px] tw-text-base tw-leading-[25px] tw-text-iron-300">
      {children}
    </p>
  );
  return (
    <VerdictFrame
      simulated={false}
      head={
        <>
          <HalfPair a b={false} locale={locale} />
          <span className="tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
            <b className="tw-font-semibold tw-text-iron-300">
              {facts.print("proofs.day.date", "long")}
            </b>
            {" · "}
            {rich(locale, "explained.kit.verdict.cycle", {
              cycle: facts.print("site.proofA.cycle"),
            })}
            {" · "}
            {rich(locale, k("verdict.retired"), {
              version: (
                <span className="tw-font-mono">
                  {facts.print("proofs.day.ruleVersion")}
                </span>
              ),
            })}
          </span>
        </>
      }
      headline={rich(locale, k("verdict.headline"))}
      aside={
        <>
          <Equation
            label={rich(locale, k("verdict.eqLabel"), {
              cycle: facts.print("site.proofA.cycle"),
            })}
            locale={locale}
            rows={[
              {
                who: fill(locale, k("verdict.eqProofA")),
                sub: fill(locale, k("verdict.eqProofASub")),
                value: facts.entry("site.proofA.totalWithoutBurn"),
              },
              {
                who: fill(locale, k("verdict.eqNative")),
                sub: fill(locale, k("verdict.eqNativeSub")),
                value: facts.entry("proofs.day.nativeTotal"),
              },
              {
                who: fill(locale, k("verdict.eqB")),
                sub: fill(locale, k("verdict.eqBSub")),
                value: facts.entry("proofs.dayB.total"),
              },
            ]}
          />
          <p className={`${EX_TEXT.meta} tw-m-0 tw-mt-3`}>
            {rich(locale, k("verdict.withBurn"), {
              total: facts.print("site.proofA.totalWithBurn"),
            })}
          </p>
          <p className={`${EX_TEXT.meta} tw-m-0 tw-mt-2`}>
            {rich(locale, k("verdict.source"), {
              bytes: facts.print("proofs.statement.bytes"),
              block: facts.print("site.proofA.ethCallBlock"),
            })}
          </p>
        </>
      }
      actions={<Actions locale={locale} facts={facts} />}
    >
      {p(
        rich(locale, k("verdict.body"), {
          date: facts.print("proofs.day.date"),
          version: (
            <span className="tw-font-mono">
              {facts.print("proofs.day.ruleVersion")}
            </span>
          ),
          hours: facts.print("site.proofA.provedHours"),
          minutes: facts.print("site.proofA.provedMinutes"),
          seconds: facts.print("proofs.day.nativeSeconds"),
        })
      )}
      {p(rich(locale, k("verdict.bodyB")))}
      <div>
        <LimitNote title={rich(locale, k("verdict.limitTitle"))}>
          {rich(locale, k("verdict.limitBody"), { decision: "D128" })}
        </LimitNote>
      </div>
    </VerdictFrame>
  );
}

function CheckStrip({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ol
      className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-2 tw-gap-x-1 tw-gap-y-2.5 tw-p-0 sm:tw-grid-cols-4"
      aria-label={fill(locale, k("sim.checksLabel"))}
    >
      {CONTRACT_CHECKS.map((check, index) => {
        let state: "passed" | "refused" | "notReached" = "notReached";
        if (index === 0) state = "passed";
        if (check.id === "outputs") state = "refused";
        const tone = {
          passed: "tw-border-green tw-text-iron-50",
          refused: "tw-border-error tw-text-iron-50",
          notReached: "tw-border-iron-700 tw-text-iron-400",
        }[state];
        return (
          <li
            key={check.id}
            className={`tw-border-0 tw-border-t-[3px] tw-border-solid tw-pt-[9px] tw-text-[13px] tw-font-semibold tw-leading-[18px] ${tone}`}
            data-check={check.id}
            data-state={state}
          >
            {rich(locale, k(`check.${check.id}.title`))}
            <span className="tw-block tw-font-medium tw-text-iron-400">
              {rich(
                locale,
                k(
                  {
                    passed: "sim.passed",
                    refused: "sim.refused",
                    notReached: "sim.notReached",
                  }[state] as "sim.passed"
                )
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SimulatedVerdict({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const total = facts.num("site.proofA.totalWithoutBurn");
  const word = String(refusedWord(facts));
  return (
    <VerdictFrame
      simulated
      head={
        <>
          <Glyph kind="shownFalse" className="tw-size-10" />
          <span className="tw-text-[15px] tw-font-bold tw-uppercase tw-tracking-[0.02em] tw-text-error">
            {rich(locale, k("sim.word"))}
          </span>
          <Tag kind="simulated" locale={locale} />
          <span className="tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
            {kt(locale, "explained.kit.simulated.note")}
          </span>
        </>
      }
      headline={rich(locale, k("sim.headline"))}
      aside={
        <>
          <Equation
            label={rich(locale, k("sim.eqLabel"), { word })}
            locale={locale}
            forceDiffers={[1]}
            rows={[
              {
                who: fill(locale, k("sim.eqA")),
                sub: fill(locale, k("sim.eqASub")),
                value: facts.entry("site.proofA.totalWithoutBurn"),
              },
              {
                who: fill(locale, k("sim.eqB")),
                sub: fill(locale, k("sim.eqBSub")),
                value: null,
                simulated:
                  total === null ? null : formatCount(locale, total + 1),
              },
            ]}
          />
          <p className={`${EX_TEXT.meta} tw-m-0 tw-mt-3`}>
            {rich(locale, k("sim.error"), {
              error: (
                <code className="tw-font-mono tw-text-iron-50">{`OutputsDiffer(${word})`}</code>
              ),
            })}
          </p>
        </>
      }
      actions={<Actions locale={locale} facts={facts} />}
    >
      <p className="tw-m-0 tw-text-base tw-leading-[25px] tw-text-iron-300">
        {rich(locale, k("sim.body"))}
      </p>
      <CheckStrip locale={locale} />
    </VerdictFrame>
  );
}

export default function ProofsHero({
  locale,
  facts,
  chapterNumber,
  pageNumber,
  pageTitle,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
  readonly chapterNumber: string;
  readonly pageNumber: string;
  readonly pageTitle: string;
}) {
  return (
    <>
      <Header
        locale={locale}
        chapterNumber={chapterNumber}
        pageNumber={pageNumber}
        pageTitle={pageTitle}
      />
      <div className="tw-mt-8" id="proof">
        <SimulationSwitch id="pairfails">
          <WhenReal>
            <RealVerdict locale={locale} facts={facts} />
          </WhenReal>
          <WhenSimulated>
            <SimulatedVerdict locale={locale} facts={facts} />
          </WhenSimulated>
        </SimulationSwitch>
      </div>
      <div className="tw-mt-6">
        <DriftNote by={["D136", "D137"]} locale={locale}>
          {rich(locale, k("drift"), {
            date: facts.print("proofs.day.date"),
            old: (
              <code className="tw-font-mono tw-text-[14px] tw-text-iron-50">
                {facts.print("proofs.day.ruleVersion")}
              </code>
            ),
            ruleId: facts.print("rules.ruleId"),
          })}
        </DriftNote>
      </div>
    </>
  );
}
