import { Fragment, type ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";

/**
 * The lanes (EXPLAINED.md §4.4, §7.8): a day's pipeline as boxes and text
 * in HTML, so it reflows for free; left to right on a desktop, top to
 * bottom on a phone. A step that agrees is green-edged; two programs that
 * run side by side share one box, one above the other.
 */
export interface LaneStep {
  /** Set in capitals: a name whose case matters (6529.io) keeps it in a `tw-normal-case` span. */
  readonly kicker: ReactNode;
  readonly title: string;
  readonly cap?: ReactNode;
}

export type Lane =
  | (LaneStep & { readonly ok?: boolean; readonly pair?: undefined })
  | { readonly pair: readonly [LaneStep, LaneStep]; readonly ok?: boolean };

/**
 * A step's words. A lane of one step fills its box, its caption (the hash
 * or the count) at the box's foot, so every box in a row ends on content.
 */
function StepText({
  step,
  foot = false,
}: {
  readonly step: LaneStep;
  readonly foot?: boolean;
}) {
  return (
    <div className={`tw-flex tw-flex-col tw-gap-1 ${foot ? "tw-flex-1" : ""}`}>
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {step.kicker}
      </span>
      <b className="tw-text-base tw-font-semibold tw-leading-[23px] tw-text-iron-50">
        {step.title}
      </b>
      {step.cap !== undefined && (
        <span
          className={`tw-block tw-text-[13px] tw-leading-[19px] tw-text-iron-400 ${foot ? "tw-mt-auto tw-pt-2" : ""}`}
        >
          {step.cap}
        </span>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <div
      className="tw-flex tw-h-[22px] tw-items-center tw-justify-center lg:tw-h-auto"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 28 22"
        className="tw-h-[22px] tw-w-7 tw-rotate-90 lg:tw-rotate-0"
      >
        <line x1="4" y1="11" x2="20" y2="11" stroke="#60606C" strokeWidth="2" />
        <path d="M18 6l7 5-7 5z" fill="#93939F" />
      </svg>
    </div>
  );
}

export default function Lanes({
  lanes,
  label,
  locale,
}: {
  readonly lanes: readonly Lane[];
  /** What the lanes show: "The day's pipeline". */
  readonly label: string;
  readonly locale: SupportedLocale;
}) {
  const columns = lanes
    .map((lane) => (lane.pair ? "minmax(0,1.4fr)" : "minmax(0,1fr)"))
    .join(" 28px ");
  return (
    <ol
      className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-items-stretch tw-p-0 lg:[grid-template-columns:var(--ex-lanes)]"
      style={{ ["--ex-lanes" as string]: columns }}
      aria-label={kt(locale, "explained.kit.lanes.aria", { label })}
      data-fig="lanes"
    >
      {lanes.map((lane, index) => {
        const box = `tw-flex tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-p-4 ${lane.ok ? "tw-border-green/50 tw-bg-green/[0.09]" : "tw-border-iron-800 tw-bg-iron-950"} ${lane.pair ? "tw-gap-3.5" : "tw-gap-1"}`;
        return (
          <Fragment key={lane.pair ? lane.pair[0].title : lane.title}>
            {index > 0 && (
              <li className="tw-contents" aria-hidden="true">
                <Arrow />
              </li>
            )}
            <li className={box} data-lane-ok={lane.ok ? "1" : "0"}>
              {lane.pair ? (
                <>
                  <StepText step={lane.pair[0]} />
                  <div className="tw-border-0 tw-border-t tw-border-dashed tw-border-iron-700 tw-pt-3">
                    <StepText step={lane.pair[1]} />
                  </div>
                </>
              ) : (
                <StepText step={lane} foot />
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
