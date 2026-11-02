"use client";

import Link from "next/link";
import { DAY, REGISTRY_V14, finalTdh } from "@/components/explained/engine/tdh";
import { EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import {
  Para,
  Section,
  Statement,
  StatementLabel,
} from "@/components/explained/layout/rows";
import { rich } from "@/components/explained/rich";
import { useState } from "react";
import { Seg, Slider } from "@/components/explained/lens/controls";
import { ht, type HowKey } from "./copy";
import { traceOf, type Trace } from "./trace";

/**
 * Every step of P26, in its order (the owner's brief for this chapter: the
 * full calculation, with the exact rule beside each model). Each row names
 * the step, gives its rule in P26's own notation, its sections, and links
 * to the model on this page that moves it. The notation is code, not copy:
 * it is the same in every language, and its numbers are the registry's or
 * the arithmetic's own (P26 §1, §8).
 */
const R = REGISTRY_V14;
const CODE = "tw-font-mono tw-text-[14px] tw-text-iron-300";

interface Step {
  readonly id: string;
  readonly href: string;
  readonly sections: string;
  readonly rule: (n: (value: number) => string) => string;
  /** A line that sums a longer rule up; the Specification states it exactly. */
  readonly summary?: boolean;
}

const STEPS: readonly Step[] = [
  {
    id: "logs",
    href: "/network/tdh/specification#s3",
    sections: "§3",
    rule: () =>
      [
        "every log of the four contracts, once, decoded strictly",
        "in canonical order; a debit with too few copies: no result",
      ].join("\n"),
    summary: true,
  },
  {
    id: "snapshot",
    href: "#part-a",
    sections: "§4.1, §4.2",
    rule: (n) => `T = ts(B), ts(B) < N × ${n(DAY)} ≤ ts(B + 1)`,
  },
  {
    id: "eligible",
    href: "#step-3",
    sections: "§5.1",
    rule: (n) => `firstMint ≤ T − ${n(R.eligibility_min_age_s)}`,
  },
  {
    id: "editions",
    href: "#part-b",
    sections: "§5.2",
    rule: (n) =>
      [
        "E = max(minted + adj, floor), H = max(E)",
        `floor = min(totalMax, ${n(R.edition_floor_cap)}) if minted + adj < ${n(R.edition_floor_threshold)}`,
        "  and totalMax > 0, else 0",
      ].join("\n"),
  },
  {
    id: "rates",
    href: "#part-b",
    sections: "§5.3, §8.1",
    rule: (n) =>
      [
        "Meme:     RATE(H, E)",
        `Gradient: RATE(H, G), at least ${n(R.gradient_rate_minimum)} cents`,
        `NextGen:  RATE(H, Nc), c = token div ${n(R.nextgen_collection_divisor)},`,
        "          Nc = tokens in collection c",
        "RATE(n, d) = HALFUP(B64(B64(n ÷ d) × 100))",
      ].join("\n"),
  },
  {
    id: "seasons",
    href: "#part-c",
    sections: "§5.4",
    rule: () => "season k = Memes start_k … start_(k+1) − 1",
  },
  {
    id: "identities",
    href: "#part-d",
    sections: "§6.2, §6.3",
    rule: (n) =>
      [
        `pairs registered both ways → groups of ≤ ${n(R.consolidation_max_wallets)}`,
        `beyond ${n(R.consolidation_ungated_max_wallets)}: one linked both ways to all,`,
        `  every link from ${new Date(R.consolidation_gate_activation_s * 1000).toISOString().slice(0, 10)} (D136)`,
      ].join("\n"),
    summary: true,
  },
  {
    id: "stacks",
    href: "#step-4",
    sections: "§7.1",
    rule: () => "net(w) per transaction; last in, first out",
    summary: true,
  },
  {
    id: "base",
    href: "#step-8",
    sections: "§4.3, §7.2, §8.2",
    rule: (n) =>
      [
        `raw = Σ (T − a) div ${n(R.day_s)}`,
        "base = (rate × raw + 50) div 100",
      ].join("\n"),
  },
  {
    id: "records",
    href: "#part-d",
    sections: "§7.3",
    rule: () => "identity base = Σ wallet bases",
  },
  {
    id: "boost",
    href: "#part-c",
    sections: "§8.3",
    rule: () =>
      "beta = HALFUP((10⁶ + meme_u + grad_u) ÷ 10⁴)\nmeme_u: seasons and sets, grad_u: Gradients, in millionths",
  },
  {
    id: "final",
    href: "#part-d",
    sections: "§8.4",
    rule: () => "final = Σ HALFUP(B64(base × B64(beta ÷ 100)))",
  },
  {
    id: "totals",
    href: "#part-n",
    sections: "§8.5",
    rule: () => "total = Σ identity finals",
  },
  {
    // P26 §9 defines the result, not its roots: their encoding and hashing
    // are P28's and P53's (§4.1, §4.2), as the rule's last line says.
    id: "output",
    href: "/network/tdh/specification#s9",
    sections: "§9",
    rule: () =>
      [
        "header (N, B, hash(B), T,",
        "  rule version, registry hash)",
        "per identity: key, wallets, beta, final, per-token values",
        "roots: P28 and P53 §4.1–§4.2, not P26",
      ].join("\n"),
    summary: true,
  },
];

/** The specification's binary64 tie (§8.4): FINAL(25, 114). */
const FINAL_TIE = { base: 25, beta: 114 } as const;

function traceLine(
  id: string,
  t: Trace,
  locale: SupportedLocale
): string | null {
  const n = (value: number) => formatCount(locale, value);
  const c = (cents: number) => formatCents(locale, cents / 100);
  const key = `explained.tdh.how.trace.${id}` as HowKey;
  const values: Record<string, Record<string, string>> = {
    snapshot: {},
    eligible: {},
    editions: { E: n(t.edition), H: n(t.h) },
    rates: {
      H: n(t.h),
      E: n(t.edition),
      cents: n(t.rateCents),
      grad: n(t.gradRateCents),
    },
    seasons: {},
    identities: {},
    stacks: { days: n(t.days) },
    records: {
      card: n(t.base),
      grad: n(t.gradBase),
      base: n(t.base + t.gradBase),
    },
    boost: { cents: n(t.betaCents), beta: c(t.betaCents) },
    totals: { final: n(t.final) },
  };
  // The base and the final are P26's notation with the trace's numbers in
  // them: code, not copy, as the rules beside them are. Beta is in cents.
  if (id === "base") {
    // The card's line, then the Gradient's: one base per token.
    return [
      `(${n(t.rateCents)} × ${n(t.days)} + 50) div 100 = ${n(t.base)}`,
      `(${n(t.gradRateCents)} × ${n(t.days)} + 50) div 100 = ${n(t.gradBase)}`,
    ].join("\n");
  }
  if (id === "final") {
    // Zero-width spaces after each bracket let a narrow column break there.
    const one = (base: number, final: number) =>
      `HALFUP(\u200bB64(\u200b${n(base)} × B64(\u200b${n(t.betaCents)} ÷ 100))) = ${n(final)}`;
    return [
      one(t.base, t.cardFinal),
      one(t.gradBase, t.gradFinal),
      `${n(t.cardFinal)} + ${n(t.gradFinal)} = ${n(t.final)}`,
      // The one rounding trap a re-implementer meets here, computed by
      // the engine: the specification's tie (§8.4), where the decimal
      // product rounds the other way.
      ht(locale, "explained.tdh.how.trace.finalTie", {
        call: `FINAL(${n(FINAL_TIE.base)}, ${n(FINAL_TIE.beta)})`,
        final: n(finalTdh(FINAL_TIE.base, FINAL_TIE.beta)),
        decimal: n(Math.floor((FINAL_TIE.base * FINAL_TIE.beta + 50) / 100)),
      }),
    ].join("\n");
  }
  const params = values[id];
  return params === undefined ? null : ht(locale, key, params);
}

/** What the worked example is computed from, read on the server. */
export interface TraceInputs {
  readonly h: number;
  readonly nMemes: number;
  readonly gradRateCents: number;
  /** The editions a reader can pick, the first shown first; none below the threshold. */
  readonly editions: readonly number[];
}

const DAYS_MAX = 1000;

export default function StepsInOrder({
  locale,
  inputs,
}: {
  readonly locale: SupportedLocale;
  /** The worked example's inputs, or null when the editions could not be read. */
  readonly inputs: TraceInputs | null;
}) {
  const n = (value: number) => formatCount(locale, value);
  // The worked column is live: pick the card's edition and the days, and
  // every line beside the rules recomputes, in P26's order.
  const [edition, setEdition] = useState(inputs?.editions[0] ?? 0);
  const [days, setDays] = useState(100);
  const trace: Trace | null =
    inputs === null
      ? null
      : traceOf(inputs.h, edition, inputs.nMemes, inputs.gradRateCents, days);
  return (
    <Section id="steps">
      <Statement
        label={
          <StatementLabel>
            {ht(locale, "explained.tdh.how.order.label")}
          </StatementLabel>
        }
        title={ht(locale, "explained.tdh.how.order.title")}
      >
        <Para>{ht(locale, "explained.tdh.how.order.body")}</Para>
      </Statement>
      <figure className="tw-m-0 tw-mt-12" data-fig="steps">
        {trace !== null && inputs !== null && (
          // The worked holder is a new example, so it is introduced before
          // step 00 and the blue column reads as one story from the start;
          // its two controls drive every blue line below.
          <div
            className="tw-mb-5 tw-grid tw-max-w-[860px] tw-gap-3"
            data-lens="trace"
          >
            <p className="tw-m-0 tw-max-w-[580px] tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/60 tw-pl-3 tw-text-[15px] tw-leading-6 tw-text-iron-300">
              {ht(locale, "explained.tdh.how.trace.caption", {
                edition: n(trace.edition),
                threshold: n(R.edition_floor_threshold),
                days: n(trace.days),
              })}
            </p>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-3">
              <Seg
                label={ht(locale, "explained.tdh.how.trace.edition")}
                attr="edition"
                value={String(edition)}
                onChange={(value) => setEdition(Number(value))}
                options={inputs.editions.map((copies) => ({
                  value: String(copies),
                  label: ht(locale, "explained.tdh.how.trace.editionOption", {
                    copies: n(copies),
                  }),
                }))}
              />
              <div className="tw-flex tw-min-w-[220px] tw-flex-1 tw-flex-col tw-gap-1">
                <span className="tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-400">
                  {ht(locale, "explained.tdh.how.trace.daysValue", {
                    days: n(days),
                  })}
                </span>
                <Slider
                  label={ht(locale, "explained.tdh.how.trace.days")}
                  value={days}
                  min={1}
                  max={DAYS_MAX}
                  attr="days"
                  valueText={ht(locale, "explained.tdh.how.trace.daysValue", {
                    days: n(days),
                  })}
                  onChange={setDays}
                />
              </div>
            </div>
          </div>
        )}
        <ol className="tw-m-0 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-0">
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              className="tw-grid tw-grid-cols-[32px_minmax(0,1fr)] tw-gap-x-3 tw-gap-y-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 md:tw-grid-cols-[40px_minmax(0,200px)_minmax(0,1fr)_140px] md:tw-items-baseline md:tw-gap-x-5 xl:tw-grid-cols-[40px_minmax(0,170px)_minmax(0,1fr)_minmax(0,240px)_140px]"
              data-step={step.id}
            >
              <span className="tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-400">
                {String(index).padStart(2, "0")}
              </span>
              <Link
                className={`tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 tw-no-underline hover:tw-underline ${EX_FOCUS}`}
                href={step.href}
              >
                {ht(locale, `explained.tdh.how.order.${step.id}` as HowKey)}
              </Link>
              {/* An operator stays with what follows it, so a formula
                  breaks between terms, never inside one; a wrapped line
                  hangs two characters in. */}
              <code className="tw-col-start-2 tw-block tw-whitespace-pre-wrap tw-break-words tw-pl-[2ch] tw-indent-[-2ch] tw-font-mono tw-text-[14px] tw-leading-[21px] tw-text-iron-300 md:tw-col-start-auto">
                {step.rule(n).replace(/([≤−×÷=+→]) /g, "$1\u00a0")}
              </code>
              {trace !== null && (
                <span
                  className="tw-col-start-2 tw-whitespace-pre-line tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/60 tw-pl-2.5 tw-text-[13px] tw-leading-[20px] tw-text-iron-300 max-[359px]:tw-col-span-2 max-[359px]:tw-col-start-1 md:tw-col-span-2 md:tw-col-start-3 md:tw-row-start-2 md:tw-text-[14px] md:tw-leading-[21px] xl:tw-col-span-1 xl:tw-col-start-auto xl:tw-row-start-auto"
                  data-trace={step.id}
                >
                  {traceLine(step.id, trace, locale)}
                </span>
              )}
              <span
                className={`tw-col-start-2 md:tw-col-start-4 md:tw-row-start-1 md:tw-text-right xl:tw-col-start-auto xl:tw-row-start-auto ${EX_TEXT.small}`}
              >
                P26{" "}
                {step.sections.split(", ").map((section, index) => (
                  <span key={section}>
                    {index > 0 && ", "}
                    <Link
                      className={`tw-text-inherit tw-underline tw-decoration-iron-600 tw-underline-offset-2 hover:tw-text-iron-50 ${EX_FOCUS}`}
                      href={`/network/tdh/specification#s${section.slice(1).replace(".", "-")}`}
                    >
                      {section}
                    </Link>
                  </span>
                ))}
                {step.summary === true && (
                  <span className="tw-block">
                    {ht(locale, "explained.tdh.how.order.summary")}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
        <figcaption className="tw-mt-4 tw-max-w-[760px] tw-text-[15px] tw-leading-6 tw-text-iron-400">
          {rich(locale, "explained.tdh.how.order.caption", {
            div: <code className={CODE}>div</code>,
            halfup: <code className={CODE}>HALFUP</code>,
            b64: <code className={CODE}>B64</code>,
          })}
        </figcaption>
      </figure>
    </Section>
  );
}
