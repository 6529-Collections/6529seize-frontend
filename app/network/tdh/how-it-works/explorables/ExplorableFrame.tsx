import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { TDH_FOCUS_RING } from "../../shared/tdhStyles";

/**
 * The frame of an explorable (plan §4.7): a titled panel with a reset button.
 * The page's lede says once that the explorables compute in the browser and
 * that the computation of record is 6529.io's, then the Rust core's.
 */
export default function ExplorableFrame({
  locale,
  title,
  onReset,
  children,
}: {
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly onReset: () => void;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/25 tw-bg-iron-950 tw-p-4 sm:tw-p-5"
    >
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-3 tw-gap-y-1">
        <div className="tw-min-w-[12rem] tw-flex-1">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
            {t(locale, "network.tdh.how.tryIt")}
          </p>
          <h3 className="tw-m-0 tw-mt-0.5 tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-50">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={`tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-text-iron-400 hover:tw-text-iron-100 ${TDH_FOCUS_RING}`}
        >
          <ArrowPathIcon aria-hidden="true" className="tw-size-4" />
          {t(locale, "network.tdh.shared.reset")}
        </button>
      </div>
      <div className="tw-mt-3">{children}</div>
    </section>
  );
}
