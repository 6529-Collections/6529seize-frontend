"use client";

import {
  ApiProfileRepRatesState,
  RateMatter,
} from "../../../entities/IProfile";
import UserPageRepNewRep from "./new-rep/UserPageRepNewRep";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import UserPageRepReps from "./reps/UserPageRepReps";
import UserPageRepHeader from "./header/UserPageRepHeader";
import { AuthContext } from "../../auth/Auth";
import ProfileRatersTableWrapper, {
  ProfileRatersParams,
} from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageRepActivityLog from "./UserPageRepActivityLog";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
export default function UserPageRep({
  profile,
  initialRepReceivedParams,
  initialRepGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialRepReceivedParams: ProfileRatersParams;
  readonly initialRepGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const [rater, setRater] = useState<string | undefined>(undefined);
  useEffect(
    () => setRater(connectedProfile?.handle?.toLowerCase()),
    [connectedProfile]
  );

  const { data: repRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      { rater: rater, handleOrWallet: user },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${user}/rep/ratings/received`,
        params: rater ? { rater } : {},
      }),
    enabled: !!user,
  });

  return (
    <div className="tailwind-scope">
      <UserPageRepHeader repRates={repRates ?? null} />
      <UserPageRateWrapper profile={profile} type={RateMatter.REP}>
        <UserPageRepNewRep profile={profile} repRates={repRates ?? null} />
      </UserPageRateWrapper>
      <UserPageRepReps repRates={repRates ?? null} profile={profile} />

      <div className="tw-mt-6 lg:tw-mt-8 tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-y-6 lg:tw-gap-y-10 tw-gap-x-8 lg:tw-gap-x-10">
        <div>
          <ProfileRatersTableWrapper initialParams={initialRepGivenParams} />
        </div>
        <div>
          <ProfileRatersTableWrapper initialParams={initialRepReceivedParams} />
        </div>
      </div>

      <div className="tw-mt-6 lg:tw-mt-8">
        <UserPageRepActivityLog
          initialActivityLogParams={initialActivityLogParams}
        />
      </div>
    </div>
  );
}
