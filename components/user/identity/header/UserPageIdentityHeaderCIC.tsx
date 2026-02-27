"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import UserCICStatus from "@/components/user/utils/user-cic-status/UserCICStatus";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { ProfileRatersParamsOrderBy, RateMatter } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import TopRaterAvatars from "../../rep/header/TopRaterAvatars";

const TOP_RATERS_COUNT = 5;

export default function UserPageIdentityHeaderCIC({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const [cicRating, setCicRating] = useState<number>(profile.cic);

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
  });

  useEffect(() => {
    setCicRating(profile.cic);
  }, [profile]);

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
          <TopRaterAvatars
            handleOrWallet={profile.handle ?? ""}
            matter={RateMatter.NIC}
            count={TOP_RATERS_COUNT}
            size="md"
          />
          <span className="tw-text-sm tw-font-normal tw-text-iron-400">
            {formatNumberWithCommas(ratings?.count ?? 0)}{" "}
            {(ratings?.count ?? 0) === 1 ? "rater" : "raters"}
          </span>
        </div>
      </div>
    </div>
  );
}
