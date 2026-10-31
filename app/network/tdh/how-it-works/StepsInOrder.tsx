import Link from "next/link";
import { DAY, REGISTRY_V14 } from "@/components/explained/engine/tdh";
import { EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
import { Para, Section, Statement, StatementLabel } from "./_kit/layout";
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
    rule: () => "rate = HALFUP(B64(B64(H ÷ E) × 100))",
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
    rule: () => "beta = HALFUP((10⁶ + meme_u + grad_u) ÷ 10⁴)",
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

export default function StepsInOrder({
  locale,
}: {
  readonly locale: SupportedLocale;
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
              className="tw-grid tw-grid-cols-[32px_minmax(0,1fr)] tw-gap-x-3 tw-gap-y-1.5 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 md:tw-grid-cols-[40px_minmax(0,230px)_minmax(0,1fr)_150px] md:tw-items-baseline md:tw-gap-x-5"
              data-step={step.id}
            >
              <span className="tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link
                className={`${EX_LINK} tw-text-base tw-font-semibold tw-leading-6`}
                href={step.href}
              >
                {ht(locale, `explained.tdh.how.order.${step.id}` as HowKey)}
              </Link>
              <code className="tw-col-start-2 tw-whitespace-pre-wrap tw-break-words tw-font-mono tw-text-[13.5px] tw-leading-[21px] tw-text-iron-300 md:tw-col-start-auto">
                {step.rule(n)}
              </code>
              <span
                className={`tw-col-start-2 md:tw-col-start-auto md:tw-text-right ${EX_TEXT.small}`}
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
        </figcaption>
      </figure>
    </Section>
  );
}
