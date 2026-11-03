import type { ReactNode } from "react";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import { fill } from "@/components/explained/i18n";
import { rich } from "@/components/explained/rich";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { CONTRACT_CHECKS } from "./_lib/checks";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";

/**
 * The page's subject, drawn under its title at every width (TDH-DESIGN.md
 * §4, genre V): first what one proof did, a day of Ethereum read and proved
 * into a few hundred bytes that mainnet's verifier accepts, the band
 * narrowing as the bytes do; then where the pair stands. Program A's line is
 * solid as far as the verifier it reached, in a read-only call, and dashed
 * on to the contract, which has never received it; program B's is dashed
 * all the way; the test pair is outlined, never filled, so no reader takes
 * it for a day; the contract's checks are hollow, none run on a real day.
 */

/** The figure's own strings: `explained.tdh.proofs.figure.*`. */
type FigureKey = Parameters<typeof k>[0] extends infer S
  ? S extends `figure.${infer R}`
    ? R
    : never
  : never;

function Station({
  kicker,
  big,
  unit,
  cap,
  last = false,
}: {
  readonly kicker: ReactNode;
  readonly big: ReactNode;
  readonly unit?: ReactNode;
  readonly cap: ReactNode;
  readonly last?: boolean;
}) {
  return (
    <li
      className={`tw-relative tw-flex tw-min-w-0 tw-flex-col tw-gap-1 tw-border-0 tw-border-l-2 tw-border-solid tw-pl-4 ${last ? "tw-border-green" : "tw-border-iron-700"}`}
    >
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {kicker}
      </span>
      <span className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-1.5">
        <b
          className={`tw-text-[26px] tw-font-semibold tw-tabular-nums tw-leading-8 tw-tracking-[-0.02em] max-[419px]:tw-text-[18px] max-[419px]:tw-leading-7 ${last ? "tw-text-green" : "tw-text-iron-50"}`}
        >
          {big}
        </b>
        {unit !== undefined && (
          <span className="tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-300">
            {unit}
          </span>
        )}
      </span>
      <span className="tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {cap}
      </span>
    </li>
  );
}

/**
 * A lane's line to the contract: solid as far as it got, dashed where it has
 * not; the stub after a reached verifier is the short way still to go.
 */
function LaneLine({
  solid,
  stub = false,
}: {
  readonly solid: boolean;
  readonly stub?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`tw-hidden tw-h-0 tw-border-0 tw-border-t-2 lg:tw-block ${stub ? "tw-w-10 tw-shrink-0" : "tw-min-w-6 tw-flex-1"} ${solid ? "tw-border-solid tw-border-green" : "tw-border-dashed tw-border-iron-600"}`}
    />
  );
}

function Lane({
  mark,
  title,
  sub,
  reached,
  testCycle = false,
}: {
  readonly mark: ReactNode;
  readonly title: ReactNode;
  readonly sub: ReactNode;
  /** What the lane's line reaches before the contract, if anything. */
  readonly reached?: ReactNode;
  readonly testCycle?: boolean;
}) {
  return (
    <li
      className={`tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4 ${testCycle ? "tw-border-dashed tw-border-iron-700" : "tw-border-iron-800 tw-bg-iron-950"}`}
      // The lane's right part is its drawn line, the way still to go to the
      // contract: a lane that never reached it is empty there on purpose.
      data-tdh-check-ignore="empty-card"
    >
      <span className="tw-shrink-0">{mark}</span>
      <span className="tw-flex tw-min-w-0 tw-flex-col lg:tw-max-w-[440px]">
        <b className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
          {title}
        </b>
        <span className="tw-text-[15px] tw-leading-6 tw-text-iron-300">
          {sub}
        </span>
      </span>
      <LaneLine solid={reached !== undefined} />
      {reached !== undefined && (
        <span className="tw-shrink-0 tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-green">
          {reached}
        </span>
      )}
      {reached !== undefined && <LaneLine solid={false} stub />}
    </li>
  );
}

export default function ProofsFigure({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const t = (key: FigureKey) => k(`figure.${key}`);
  return (
    <figure
      className="tw-m-0 tw-mt-8 tw-grid tw-gap-6 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-[linear-gradient(135deg,rgba(60,203,127,0.05),transparent_45%)] tw-p-4 sm:tw-p-5 md:tw-mt-10 md:tw-p-7"
      data-fig="half-pair"
      aria-label={fill(locale, t("aria"))}
    >
      <figcaption className={EX_TEXT.label}>
        {rich(locale, t("label"), { date: facts.print("proofs.day.date") })}
      </figcaption>
      <div>
        <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-5 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4 lg:tw-gap-6">
          <Station
            kicker={fill(locale, t("read"))}
            big={facts.print("proofs.day.inputBytes")}
            unit={fill(locale, t("bytes"))}
            cap={rich(locale, t("readCap"), {
              blocks: facts.print("proofs.day.blocks"),
            })}
          />
          <Station
            kicker={fill(locale, t("steps"))}
            big={facts.print("proofs.day.steps")}
            unit={fill(locale, t("stepsUnit"))}
            cap={rich(locale, t("stepsCap"), {
              hours: facts.print("site.proofA.provedHours"),
              minutes: facts.print("site.proofA.provedMinutes"),
            })}
          />
          <Station
            kicker={fill(locale, t("proof"))}
            big={facts.print("proofs.pair.proofBytesA")}
            unit={fill(locale, t("bytes"))}
            cap={fill(locale, t("proofCap"))}
          />
          <Station
            kicker={fill(locale, t("verify"))}
            big={fill(locale, t("verifyBig"))}
            cap={rich(locale, t("verifyCap"), {
              block: facts.block("site.proofA.ethCallBlock"),
            })}
            last
          />
        </ol>
        {/* The bytes narrowing, from the day read to the proof: a band that
            thins under the first three stations, then a hairline on. */}
        <svg
          aria-hidden="true"
          className="tw-mt-4 tw-hidden tw-h-6 tw-w-full lg:tw-block"
          viewBox="0 0 1000 24"
          preserveAspectRatio="none"
        >
          <polygon
            points="0,0 0,24 500,14 750,11.5 1000,11.5 1000,12.5 750,12.5 500,10"
            fill="rgba(206,207,212,0.16)"
          />
          <line
            x1="750"
            y1="12"
            x2="1000"
            y2="12"
            stroke="#3CCB7F"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-pt-6 lg:tw-grid-cols-[minmax(0,1fr)_300px] lg:tw-items-stretch">
        <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0">
          <Lane
            mark={<HalfPair a b={false} word={false} locale={locale} />}
            title={fill(locale, t("a"))}
            sub={rich(locale, t("aSub"), {
              date: facts.print("proofs.day.date"),
            })}
            reached={fill(locale, t("aReached"))}
          />
          <Lane
            mark={<HalfPair a={false} b={false} word={false} locale={locale} />}
            title={fill(locale, t("b"))}
            sub={rich(locale, t("bSub"), {
              date: facts.print("proofs.day.date"),
            })}
          />
          <Lane
            mark={<HalfPair a b test word={false} locale={locale} />}
            title={fill(locale, t("test"))}
            sub={rich(locale, t("testSub"), {
              cycle: facts.print("proofs.pairV14.cycle"),
              date: facts.print("proofs.pairV14.provedOn"),
            })}
            testCycle
          />
        </ul>
        <div
          className="tw-flex tw-flex-col tw-justify-between tw-gap-4 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-600 tw-px-4 tw-py-3.5"
          data-fig-contract=""
        >
          <div>
            <b className="tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
              {fill(locale, t("contract"))}
            </b>
            <span className="tw-block tw-text-[15px] tw-leading-6 tw-text-iron-300">
              {rich(locale, t("contractSub"), {
                count: facts.print("proofs.contract.checks"),
              })}
            </span>
            {/* The checks, hollow: none has run on a real day. */}
            <ol
              className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-wrap tw-gap-1.5 tw-p-0"
              aria-hidden="true"
            >
              {CONTRACT_CHECKS.map((check, index) => (
                <li
                  key={check.id}
                  className="tw-grid tw-size-7 tw-place-items-center tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-text-[13px] tw-font-semibold tw-tabular-nums tw-text-iron-400"
                >
                  {index + 1}
                </li>
              ))}
            </ol>
          </div>
          <span className="tw-block tw-border-0 tw-border-t tw-border-dashed tw-border-iron-700 tw-pt-3 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-300">
            {fill(locale, t("recorded"))}
          </span>
        </div>
      </div>
    </figure>
  );
}
