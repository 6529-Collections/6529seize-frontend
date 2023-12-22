import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  ProfileActivityLogRatingEdit,
  RatingWithProfileInfoAndLevel,
} from "../../../entities/IProfile";
import UserPageRepRaters from "./UserPageRepRaters";
import UserPageRepActivityLog from "./UserPageRepActivityLog";
import UserPageRepNewRep from "./new-rep/UserPageRepNewRep";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import UserPageRepReps from "./reps/UserPageRepReps";
import UserPageRepHeader from "./header/UserPageRepHeader";
import { Page } from "../../../helpers/Types";

export default function UserPageRep({
  profile: initialProfile,
  repLogs,
  repGivenToUsers,
  repReceivedFromUsers,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly repLogs: Page<ProfileActivityLogRatingEdit>;
  readonly repGivenToUsers: Page<RatingWithProfileInfoAndLevel>;
  readonly repReceivedFromUsers: Page<RatingWithProfileInfoAndLevel>;
}) {
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

  const { address } = useAccount();
  const { data: connectedProfile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, address?.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${address}`,
      }),
    enabled: !!address,
  });

  const [rater, setRater] = useState<string | undefined>(undefined);
  useEffect(
    () =>
      setRater(connectedProfile?.profile?.handle.toLowerCase() ?? undefined),
    [connectedProfile]
  );

  const { data: repRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [QueryKey.PROFILE_REP_RATINGS, { rater: rater }],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${user.toLowerCase()}/rep/ratings/received`,
        params: rater ? { rater: rater } : {},
      }),
    enabled: !!user,
  });

  return (
    <div className="tailwind-scope">
      {repRates && (
        <>
          <UserPageRepHeader repRates={repRates} />
          <UserPageRepNewRep profile={profile} repRates={repRates} />
          <UserPageRepReps repRates={repRates} profile={profile} />
        </>
      )}

      <div className="tw-mt-10 tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-y-10 tw-gap-x-10">
        <div>
          <UserPageRepRaters reps={repReceivedFromUsers.data} />
        </div>
        <div>
          <UserPageRepRaters reps={repGivenToUsers.data} />
        </div>
      </div>

      <div className="tw-mt-10">
        {/* <UserPageRepActivityLog
          repLogs={repLogs}
          profile={profile}
          user={user}
        /> */}
      </div>
    </div>
  );
}
