"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";
import { RateMatter } from "@/enums";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";
import type {
  ProfileRatersParams,
} from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import ProfileRatersTableWrapper from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageRepHeader from "./header/UserPageRepHeader";
import UserPageRepNewRep from "./new-rep/UserPageRepNewRep";
import UserPageRepReps from "./reps/UserPageRepReps";
import UserPageRepActivityLog from "./UserPageRepActivityLog";
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

  const params = useParams();
  const user = (params?.["user"] as string)?.toLowerCase();

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
