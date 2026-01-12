"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { CIC_META } from "@/components/user/utils/user-cic-status/UserCICStatus";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { CICType } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser, cicToType, formatNumberWithCommas } from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { ProfileRatersParamsOrderBy, RateMatter } from "@/types/enums";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import UserCICTypeIconTooltipHeaders from "./UserCICTypeIconTooltipHeaders";
import UserCICTypeIconTooltipRate from "./UserCICTypeIconTooltipRate";
export default function UserCICTypeIconTooltip({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { address } = useSeizeConnectContext();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);

  const [cicType, setCicType] = useState<CICType>(cicToType(profile.cic));

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  useEffect(() => {
    setCicType(cicToType(profile.cic));
  }, [profile]);

  const { data: ratings } = useQuery<Page<RatingWithProfileInfoAndLevel>>({
    queryKey: [
      QueryKey.PROFILE_RATERS,
      {
        handleOrWallet: profile.handle,
        matter: RateMatter.NIC,
        page: 1,
        pageSize: 1,
        order: SortDirection.DESC,
        orderBy: ProfileRatersParamsOrderBy.RATING,
        given: false,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
        endpoint: `profiles/${profile.handle}/cic/ratings/by-rater`,
        params: {
          page: `${1}`,
          page_size: `${1}`,
          order: SortDirection.DESC.toLowerCase(),
          order_by: ProfileRatersParamsOrderBy.RATING.toLowerCase(),
          given: "false",
        },
      }),
    enabled: !!profile.handle,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-p-4">
      <UserCICTypeIconTooltipHeaders />
      <div className="tw-mt-4 tw-space-y-0.5">
        <span className="tw-block tw-font-semibold tw-text-iron-200">
          <span>Rating:</span>
          <span className="tw-ml-1 tw-font-bold tw-text-iron-200">
            {formatNumberWithCommas(profile.cic)}
          </span>
        </span>
        <span className="tw-block tw-font-semibold tw-text-iron-200">
          <span>Status:</span>
          <span className={`${CIC_META[cicType].class} tw-ml-1 tw-font-bold`}>
            {CIC_META[cicType].title}
          </span>
        </span>

        <span className="tw-block tw-font-semibold tw-text-iron-200">
          <span>Raters:</span>
          <span className="tw-ml-1 tw-font-bold tw-text-iron-200">
            {formatNumberWithCommas(ratings?.count ?? 0)}
          </span>
        </span>
      </div>
      {cicType === CICType.INACCURATE && (
        <div className="mt-2">
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-medium tw-text-iron-400">
            This profile is at risk of losing its handle if its NIC does not
            turn positive. The detailed process will go live after the
            experimental period is complete.
          </p>
        </div>
      )}
      {!isMyProfile && <UserCICTypeIconTooltipRate profile={profile} />}
    </div>
  );
}
