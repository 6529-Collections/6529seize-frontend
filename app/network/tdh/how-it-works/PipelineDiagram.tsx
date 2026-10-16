import Link from "next/link";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { TDH_FOCUS_RING } from "../shared/tdhStyles";

/** Steps that are not part of the calculation: the worked example, the changes. */
const ASIDE_STEPS = new Set([12, 14]);
/** The step that is the calculation's result. */
const RESULT_STEP = 13;
const PIPELINE_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

/**
 * Diagram 1: the page as a rail of its fourteen steps, in order, each linking
 * to its section under the section's own title. The calculation runs from 1
 * to 13, the network total, drawn as a square end marker; 12 is the worked
 * example and 14 what changes at the cutover, drawn apart. From `md` only:
 * on phones the steps menu below does the same job.
 */
export function PipelineDiagram({
  locale,
  stepTitles,
}: {
  readonly locale: SupportedLocale;
  readonly stepTitles: Readonly<Record<number, string>>;
}) {
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-sr-only">
        {t(locale, "network.tdh.how.pipeline.desc")}
      </figcaption>
      <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-4 tw-gap-y-4 tw-p-0 xl:tw-grid-cols-7">
        {PIPELINE_STEPS.map((step) => {
          const aside = ASIDE_STEPS.has(step);
          const result = step === RESULT_STEP;
          let marker =
            "tw-border-iron-500 tw-bg-iron-900 tw-text-iron-100 group-hover:tw-border-primary-400";
          if (result) {
            marker =
              "tw-rounded-md tw-border-2 tw-border-primary-400 tw-bg-iron-950 tw-text-primary-200";
          } else if (aside) {
            marker =
              "tw-border-dashed tw-border-iron-600 tw-bg-iron-950 tw-text-iron-400";
          }
          return (
            <li key={step} className="tw-relative tw-min-w-0">
              <span
                aria-hidden="true"
                className={`tw-absolute tw-left-0 tw-right-0 tw-top-3.5 tw-h-px ${aside ? "tw-bg-iron-800" : "tw-bg-iron-700"}`}
              />
              <Link
                href={`#step-${step}`}
                aria-label={t(locale, "network.tdh.how.pipeline.goto", {
                  n: formatInteger(locale, step),
                  title: stepTitles[step] ?? "",
                })}
                className={`tw-group tw-relative tw-flex tw-min-h-11 tw-flex-col tw-gap-1.5 tw-rounded-lg tw-pr-3 tw-no-underline ${TDH_FOCUS_RING}`}
              >
                <span
                  className={`tw-flex tw-size-7 tw-items-center tw-justify-center ${result ? "" : "tw-rounded-full"} tw-border tw-border-solid tw-text-xs tw-font-semibold tw-tabular-nums tw-transition-colors motion-reduce:tw-transition-none ${marker}`}
                >
                  {formatInteger(locale, step)}
                </span>
                <span
                  className={`tw-text-[13px] tw-leading-5 tw-transition-colors motion-reduce:tw-transition-none ${
                    aside
                      ? "tw-text-iron-400 group-hover:tw-text-iron-200"
                      : "tw-text-iron-200 group-hover:tw-text-iron-50"
                  } ${result ? "tw-font-semibold tw-text-iron-50" : ""}`}
                >
                  {stepTitles[step] ?? ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p
        aria-hidden="true"
        className="tw-m-0 tw-mt-4 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2 tw-text-xs tw-text-iron-400"
      >
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span className="tw-size-3 tw-rounded-sm tw-border-2 tw-border-solid tw-border-primary-400" />
          {t(locale, "network.tdh.how.pipeline.legendResult")}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span className="tw-size-3 tw-rounded-full tw-border tw-border-dashed tw-border-iron-500" />
          {t(locale, "network.tdh.how.pipeline.legendAside")}
        </span>
      </p>
    </figure>
  );
}
