"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useMemo } from "react";
import { IdentityActivityContext } from "@/components/profile-activity/IdentityActivityContext";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import ProfileActivityLogs from "@/components/profile-activity/ProfileActivityLogs";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { RateMatter } from "@/types/enums";

export default function UserPageCombinedActivityLog({
  initialActivityLogParams,
  matter,
  withMatterFilter = true,
  layout = "desktop",
}: {
  readonly initialActivityLogParams: ActivityLogParams;
  readonly matter?: RateMatter | null;
  readonly withMatterFilter?: boolean;
  readonly layout?: "desktop" | "mobile";
}) {
  const locale = useBrowserLocale();
  const hasHydrated = useHasHydrated();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const enabled =
    hasHydrated && (layout === "desktop" ? isDesktop : !isDesktop);
  const params = useMemo(
    () =>
      matter === undefined
        ? initialActivityLogParams
        : { ...initialActivityLogParams, matter },
    [initialActivityLogParams, matter]
  );

  return (
    <IdentityActivityContext value={true}>
      <div className="tw-group/profile-activity" data-typography="identity">
        <ProfileActivityLogs
          initialParams={params}
          withFilters={true}
          withMatterFilter={withMatterFilter}
          enabled={enabled}
        >
          <h3 className="tw-m-0 tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 lg:tw-text-xl lg:tw-normal-case lg:tw-tracking-normal lg:tw-text-iron-100">
            {t(locale, "profileActivity.heading")}
          </h3>
        </ProfileActivityLogs>
      </div>
    </IdentityActivityContext>
  );
}
