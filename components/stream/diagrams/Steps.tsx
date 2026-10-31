import type { SupportedLocale } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";

interface StepItem {
  readonly title: string;
  readonly detail?: string;
}

/**
 * A numbered sequence: vertical in narrow containers, horizontal from 34rem.
 * The `<ol>` is the accessible version; the arrows are decorative.
 */
export default function Steps({
  steps,
  label,
  locale,
}: {
  readonly steps: readonly StepItem[];
  readonly label: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <ol
      aria-label={label}
      className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-6 tw-p-0 @[34rem]:tw-auto-cols-fr @[34rem]:tw-grid-flow-col @[34rem]:tw-gap-4"
    >
      {steps.map((step, index) => (
        <li key={step.title} className="tw-relative tw-min-w-0">
          <span className="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-xs tw-font-semibold tw-text-iron-200">
            {formatInteger(locale, index + 1)}
          </span>
          <span className="tw-mt-2 tw-block tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
            {step.title}
          </span>
          {step.detail === undefined ? null : (
            <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
              {step.detail}
            </span>
          )}
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="tw-absolute tw-left-9 tw-top-1 tw-hidden tw-text-iron-500 @[34rem]:tw-left-auto @[34rem]:tw-right-0 @[34rem]:tw-block"
            >
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
