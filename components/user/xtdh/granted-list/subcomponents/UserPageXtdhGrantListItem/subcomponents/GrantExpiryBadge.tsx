"use client";

import { describeLastXtdhGrantRun } from "@/components/user/xtdh/utils/xtdhGrantLastRun";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

/**
 * "Last grant": the final daily xTDH run (00:00 UTC) that can add xTDH for a
 * grant ending at `validUntil`, shown in UTC so every viewer sees the same run.
 */
export function GrantExpiryBadge({
  validUntil,
}: Readonly<{ validUntil: number | string | null | undefined }>) {
  const locale = useBrowserLocale();
  if (!validUntil) {
    return null;
  }

  const lastRun = describeLastXtdhGrantRun(locale, validUntil);
  if (lastRun === null) {
    return null;
  }

  return (
    <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs">
      <span className="tw-text-iron-500">
        {t(locale, "xtdh.grant.lastGrant.label")}
      </span>
      <time dateTime={lastRun.iso} className="tw-font-medium tw-text-iron-300">
        {lastRun.label}
      </time>
    </div>
  );
}
