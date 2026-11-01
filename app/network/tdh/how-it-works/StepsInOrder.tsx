import Link from "next/link";
import { DAY, REGISTRY_V14 } from "@/components/explained/engine/tdh";
import { EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { ENGINE } from "@/lib/explained/engine";
import { formatCents, formatCount } from "@/lib/explained/format";
import {
  Para,
  Section,
  Statement,
  StatementLabel,
} from "@/components/explained/layout/rows";
import { rich } from "@/components/explained/rich";
import { ht, type HowKey } from "./copy";

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
}

const STEPS: readonly Step[] = [
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
    rule: () => "E = max(minted + adj, floor), H = max(E)",
  },
  {
    id: "rates",
    href: "#part-b",
    sections: "§5.3, §8.1",
    rule: (n) =>
      [
        "Meme:     RATE(H, E), RATE(n, d) = HALFUP(B64(B64(n ÷ d) × 100))",
        `Gradient: RATE(H, G), at least ${n(R.gradient_rate_minimum)} cents`,
        `NextGen:  RATE(H, Nc), c = token div ${n(R.nextgen_collection_divisor)}`,
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
      `pairs registered both ways → groups of ≤ ${n(R.consolidation_max_wallets)}`,
  },
  {
    id: "stacks",
    href: "#step-4",
    sections: "§7.1",
    rule: () => "net(w) per transaction; last in, first out",
  },
  {
    id: "base",
    href: "#step-8",
    sections: "§4.3, §7.2, §8.2",
    rule: (n) =>
      `raw = Σ (T − a) div ${n(R.day_s)}; base = (rate × raw + 50) div 100`,
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
];

/**
 * One copy through every step (the full calculation by hand): a 310-copy
 * card held one whole hundred days, in a wallet of its own with one
 * Gradient. Every number is the engine's, on today's H.
 */
export interface Trace {
  readonly h: number;
  readonly edition: number;
  readonly days: number;
  readonly rateCents: number;
  readonly base: number;
  readonly betaCents: number;
  readonly final: number;
}

export function traceOf(h: number, edition: number, nMemes: number): Trace {
  const days = 100;
  const rateCents = ENGINE.rateCents(h, edition);
  const base = ENGINE.baseTdh(rateCents, days);
  const betaCents = ENGINE.boostCents({
    fullSets: 0,
    gradients: 1,
    completeSeasons: [],
    genesis: false,
    nakamoto: false,
    nMemes,
  });
  return {
    h,
    edition,
    days,
    rateCents,
    base,
    betaCents,
    final: ENGINE.finalTdh(base, betaCents),
  };
}

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
    rates: { H: n(t.h), E: n(t.edition), cents: n(t.rateCents) },
    seasons: {},
    identities: {},
    stacks: { days: n(t.days) },
    records: { base: n(t.base) },
    boost: { cents: n(t.betaCents), beta: c(t.betaCents) },
    totals: { final: n(t.final) },
  };
  // The base and the final are P26's notation with the trace's numbers in
  // them: code, not copy, as the rules beside them are. Beta is in cents.
  if (id === "base") {
    return `(${n(t.rateCents)} × ${n(t.days)} + 50) div 100 = ${n(t.base)}`;
  }
  if (id === "final") {
    // Zero-width spaces after each bracket let a narrow column break there.
    return `HALFUP(\u200bB64(\u200b${n(t.base)} × B64(\u200b${n(t.betaCents)} ÷ 100))) = ${n(t.final)}`;
  }
  const params = values[id];
  return params === undefined ? null : ht(locale, key, params);
}

export default function StepsInOrder({
  locale,
  trace,
}: {
  readonly locale: SupportedLocale;
  /** The worked example, or null when the editions could not be read. */
  readonly trace: Trace | null;
}) {
  const n = (value: number) => formatCount(locale, value);
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
        <ol className="tw-m-0 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-0">
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              className="tw-grid tw-grid-cols-[32px_minmax(0,1fr)] tw-gap-x-3 tw-gap-y-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 md:tw-grid-cols-[40px_minmax(0,200px)_minmax(0,1fr)_120px] md:tw-items-baseline md:tw-gap-x-5 xl:tw-grid-cols-[40px_minmax(0,190px)_minmax(0,1fr)_minmax(0,300px)_110px]"
              data-step={step.id}
            >
              <span className="tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link
                className={`tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 tw-no-underline hover:tw-underline ${EX_FOCUS}`}
                href={step.href}
              >
                {ht(locale, `explained.tdh.how.order.${step.id}` as HowKey)}
              </Link>
              <code className="tw-col-start-2 tw-whitespace-pre-wrap tw-break-words tw-font-mono tw-text-[13.5px] tw-leading-[21px] tw-text-iron-300 md:tw-col-start-auto">
                {step.rule(n)}
              </code>
              {trace !== null && (
                <span
                  className="tw-col-span-2 tw-col-start-1 tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/60 tw-pl-2.5 tw-text-[13px] tw-leading-[20px] tw-text-iron-300 md:tw-col-span-2 md:tw-col-start-3 md:tw-row-start-2 md:tw-text-[14px] md:tw-leading-[21px] xl:tw-col-span-1 xl:tw-col-start-auto xl:tw-row-start-auto"
                  data-trace={step.id}
                >
                  {traceLine(step.id, trace, locale)}
                </span>
              )}
              <span
                className={`tw-col-start-2 md:tw-col-start-4 md:tw-row-start-1 md:tw-text-right xl:tw-col-start-auto xl:tw-row-start-auto ${EX_TEXT.small}`}
              >
                {`P26 ${step.sections}`}
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
          {trace !== null && (
            <>
              {" "}
              <span className="tw-text-iron-400">
                {ht(locale, "explained.tdh.how.trace.caption")}
              </span>
            </>
          )}
        </figcaption>
      </figure>
    </Section>
  );
}
