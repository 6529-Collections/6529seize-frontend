import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import UserPageRepRaters from "./UserPageRepRaters";
import UserPageRepNewRep from "./new-rep/UserPageRepNewRep";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import UserPageRepReps from "./reps/UserPageRepReps";
import UserPageRepHeader from "./header/UserPageRepHeader";
import { AuthContext } from "../../auth/Auth";
import { ProfileRatersTableType } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageRepActivityLog from "./UserPageRepActivityLog";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import UserPageRateWrapper, {
  UserPageRateWrapperType,
} from "../utils/rate/UserPageRateWrapper";

export default function UserPageRep({
  profile: initialProfile,
  initialActivityLogParams,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  const [rater, setRater] = useState<string | undefined>(undefined);
  useEffect(
    () =>
      setRater(connectedProfile?.profile?.handle.toLowerCase() ?? undefined),
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
      {repRates && (
        <>
          <UserPageRepHeader repRates={repRates} />
          <UserPageRateWrapper
            profile={profile}
            type={UserPageRateWrapperType.REP}
          >
            <UserPageRepNewRep profile={profile} repRates={repRates} />
          </UserPageRateWrapper>
          <UserPageRepReps repRates={repRates} profile={profile} />
        </>
      )}

      <div className="tw-mt-6 lg:tw-mt-10 tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-y-8 lg:tw-gap-y-10 tw-gap-x-8 lg:tw-gap-x-10">
        <div>
          <UserPageRepRaters type={ProfileRatersTableType.REP_RECEIVED} />
        </div>
        <div>
          <UserPageRepRaters type={ProfileRatersTableType.REP_GIVEN} />
        </div>
      </div>

      <div className="tw-mt-8 lg:tw-mt-10">
        <UserPageRepActivityLog
          initialActivityLogParams={initialActivityLogParams}
        />
      </div>
    </div>
  );
}
