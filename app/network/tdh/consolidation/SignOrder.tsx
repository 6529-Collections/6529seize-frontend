import type { SupportedLocale } from "@/i18n/locales";
import { wt } from "./copy";

/**
 * The safe signing order (TDH-DESIGN.md §4.3, §03): A, B and C each link
 * one way to D, then D signs last, one batch to all three. HTML, not SVG:
 * four boxes that reflow to two columns on a phone. The last step is the
 * reader's action, in blue.
 */
const STEPS = [
  { from: "A", to: "D" },
  { from: "B", to: "D" },
  { from: "C", to: "D" },
] as const;

const BOX =
  "tw-flex tw-flex-col tw-gap-1 tw-rounded-lg tw-border tw-px-4 tw-py-3.5";
const NUMBER =
  "tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em]";

export default function SignOrder({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <figure
      className="tw-m-0 tw-mt-8 tw-grid tw-grid-cols-1 tw-gap-2.5 min-[360px]:tw-grid-cols-2 md:tw-grid-cols-4"
      aria-label={wt(locale, "explained.tdh.wallets.add.orderAria")}
      data-signorder=""
    >
      {STEPS.map((step, index) => (
        <div
          key={step.from}
          className={`${BOX} tw-border-dashed tw-border-iron-700`}
        >
          <span className={`${NUMBER} tw-text-iron-400`}>{index + 1}</span>
          <b className="tw-text-base tw-font-semibold tw-text-iron-50">
            {`${step.from} → ${step.to}`}
          </b>
          <span className="tw-text-[15px] tw-leading-[22px] tw-text-iron-400">
            {wt(locale, "explained.tdh.wallets.add.oneWay")}
          </span>
        </div>
      ))}
      <div
        className={`${BOX} tw-border-solid tw-border-primary-400 tw-bg-primary-400/[0.12]`}
      >
        <span className={`${NUMBER} tw-text-primary-300`}>
          <span>{STEPS.length + 1}</span>
          {" · "}
          <span>{wt(locale, "explained.tdh.wallets.add.last")}</span>
        </span>
        <b className="tw-text-base tw-font-semibold tw-text-iron-50">
          {`D → ${STEPS.map((step) => step.from).join(", ")}`}
        </b>
        <span className="tw-text-[15px] tw-leading-[22px] tw-text-iron-300">
          {wt(locale, "explained.tdh.wallets.add.batchCap")}
        </span>
      </div>
    </figure>
  );
}
