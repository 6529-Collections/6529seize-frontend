import type { SupportedLocale } from "@/i18n/locales";
import { kt, type KitKey } from "../i18n";

/**
 * Who can repeat each step (EXPLAINED.md §6.4): the steps from Ethereum to
 * the page, each tagged with who can repeat it today. "Anyone" is green;
 * the rest say what they need.
 */
export type TrailWho =
  | "anyone"
  | "node"
  | "spec"
  | "source"
  | "record"
  | "sixFive";

const WHO: Record<TrailWho, KitKey> = {
  anyone: "explained.kit.trail.anyone",
  node: "explained.kit.trail.node",
  spec: "explained.kit.trail.spec",
  source: "explained.kit.trail.source",
  record: "explained.kit.trail.record",
  sixFive: "explained.kit.trail.sixFive",
};

export interface TrailStep {
  readonly title: string;
  readonly sub: string;
  readonly who: TrailWho;
}

export default function ProvenanceTrail({
  steps,
  locale,
}: {
  readonly steps: readonly TrailStep[];
  readonly locale: SupportedLocale;
}) {
  return (
    <ol
      className="tw-m-0 tw-list-none tw-p-0 lg:tw-grid lg:[grid-template-columns:repeat(var(--ex-trail),minmax(0,1fr))]"
      style={{ ["--ex-trail" as string]: String(steps.length) }}
      aria-label={kt(locale, "explained.kit.trail.label")}
      data-trail=""
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const open =
          step.who === "anyone" || step.who === "node" || step.who === "spec";
        return (
          <li
            key={step.title}
            className="tw-relative tw-pb-[18px] tw-pl-8 lg:tw-pb-0 lg:tw-pl-0 lg:tw-pr-3.5"
            data-who={step.who}
          >
            {!last && (
              <span
                className="tw-absolute tw-bottom-0 tw-left-2 tw-top-[18px] tw-w-0.5 tw-bg-iron-700 lg:tw-left-2 lg:tw-right-0 lg:tw-top-2 lg:tw-h-0.5 lg:tw-w-auto"
                aria-hidden="true"
              />
            )}
            <span
              className="tw-absolute tw-left-0 tw-top-0 tw-size-[18px] tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-400 tw-bg-[#0D0D0F] lg:tw-relative lg:tw-block"
              aria-hidden="true"
            />
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 lg:tw-mt-3.5">
              {step.title}
            </h3>
            <p className="tw-m-0 tw-text-sm tw-leading-[21px] tw-text-iron-400">
              {step.sub}
            </p>
            <span
              className={`tw-mt-2.5 tw-inline-flex tw-rounded tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-[13px] tw-font-semibold tw-leading-[18px] ${open ? "tw-border-green/45 tw-text-green" : "tw-border-iron-700 tw-text-iron-300"}`}
            >
              {kt(locale, WHO[step.who])}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
