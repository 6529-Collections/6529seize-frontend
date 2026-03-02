"use client";

import UserCICStatus from "@/components/user/utils/user-cic-status/UserCICStatus";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useMemo } from "react";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";

const TOP_RATERS_COUNT = 5;

export default function UserPageIdentityHeaderCIC({
  profile,
  cicOverview,
}: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
}) {
  const cicRating = cicOverview?.total_cic ?? profile.cic;
  const raterCount = cicOverview?.contributor_count ?? 0;

  const avatarItems = useMemo(
    () =>
      (cicOverview?.contributors.data ?? [])
        .slice(0, TOP_RATERS_COUNT)
        .map((c) => ({
          key: c.profile.handle ?? c.profile.primary_address,
          pfpUrl: c.profile.pfp ?? null,
          href: `/${c.profile.handle ?? c.profile.primary_address}`,
          ariaLabel: c.profile.handle ?? c.profile.primary_address,
          fallback: c.profile.handle
            ? c.profile.handle.charAt(0).toUpperCase()
            : "?",
          title: c.profile.handle ?? c.profile.primary_address,
          tooltipContent: (
            <span>
              {c.profile.handle ?? c.profile.primary_address} &middot;{" "}
              {formatNumberWithCommas(c.contribution)}
            </span>
          ),
        })),
    [cicOverview?.contributors.data]
  );

  return (
    <div className="tw-mb-8">
      <div className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        NIC
      </div>
      <div className="tw-mt-1 tw-flex tw-items-start tw-justify-between tw-gap-6">
        <div className="tw-flex tw-flex-col tw-items-start">
          <div className="tw-text-3xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-white">
            {formatNumberWithCommas(cicRating)}
          </div>
          <div className="tw-mt-2 tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-semibold tw-uppercase">
            <span className="-tw-mt-0.5 tw-h-4 tw-w-4 tw-flex-shrink-0">
              <UserCICTypeIconWrapper profile={profile} />
            </span>
            <UserCICStatus cic={cicRating} />
          </div>
        </div>
        <div className="tw-flex tw-shrink-0 tw-flex-col tw-items-end tw-gap-2.5">
          {avatarItems.length > 0 && (
            <OverlappingAvatars
              items={avatarItems}
              size="md"
              maxCount={TOP_RATERS_COUNT}
            />
          )}
          <span className="tw-text-sm tw-font-normal tw-text-iron-400">
            {formatNumberWithCommas(raterCount)}{" "}
            {raterCount === 1 ? "rater" : "raters"}
          </span>
        </div>
      </div>
    </div>
  );
}
