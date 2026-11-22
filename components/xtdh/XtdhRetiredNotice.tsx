"use client";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useXtdhRetirement } from "@/hooks/useXtdhRetirement";
import { t } from "@/i18n/messages";

/**
 * Says where xTDH stands in its retirement (lib/xtdh/retirement.ts): on the
 * freeze day that it is being retired and grants can't be created or
 * changed, from the switch-on that it was retired. Renders nothing while
 * xTDH is live.
 */
export default function XtdhRetiredNotice({
  className = "",
}: {
  readonly className?: string;
}) {
  const locale = useBrowserLocale();
  const retirement = useXtdhRetirement();
  if (retirement === "live") {
    return null;
  }
  return (
    <section
      aria-label={t(locale, "xtdh.retired.label")}
      data-testid="xtdh-retired-notice"
      className={`tailwind-scope tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-px-4 tw-py-3 ${className}`.trim()}
    >
      <LockClosedIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-primary-300"
      />
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
        {t(
          locale,
          retirement === "closing"
            ? "xtdh.retired.closing"
            : "xtdh.retired.body"
        )}
      </p>
    </section>
  );
}
