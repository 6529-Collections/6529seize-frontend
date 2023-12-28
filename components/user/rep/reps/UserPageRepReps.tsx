import { useContext, useEffect, useState } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import UserPageRepRepsTop from "./UserPageRepRepsTop";
import UserPageRepRepsTable from "./UserPageRepRepsTable";
import { AuthContext } from "../../../auth/Auth";

const TOP_REPS_COUNT = 5;

export default function UserPageRepReps({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState;
  readonly profile: IProfileAndConsolidations;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const sortReps = (items: RatingStats[]) =>
    [...items].sort((a, d) => {
      if (a.rating === d.rating) {
        return d.contributor_count - a.contributor_count;
      }
      return d.rating - a.rating;
    });

  const [reps, setReps] = useState<RatingStats[]>(
    sortReps(repRates.rating_stats)
  );

  const getTopReps = (items: RatingStats[]) => {
    return items.slice(0, TOP_REPS_COUNT);
  };

  const [topReps, setTopReps] = useState<RatingStats[]>(getTopReps(reps));
  useEffect(
    () => setReps(sortReps(repRates.rating_stats)),
    [repRates.rating_stats]
  );

  useEffect(() => setTopReps(getTopReps(reps)), [reps]);

  const getCanEditRep = ({
    myProfile,
    targetProfile,
  }: {
    myProfile: IProfileAndConsolidations | null;
    targetProfile: IProfileAndConsolidations;
  }) => {
    if (!myProfile?.profile?.handle) {
      return false;
    }
    if (myProfile.profile.handle === targetProfile.profile?.handle) {
      return false;
    }
    return true;
  };

  const [canEditRep, setCanEditRep] = useState<boolean>(
    getCanEditRep({
      myProfile: connectedProfile,
      targetProfile: profile,
    })
  );

  useEffect(() => {
    setCanEditRep(
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
      })
    );
  }, [connectedProfile, profile]);

  return (
    <div>
      {!!reps.length && (
        <>
          <UserPageRepRepsTop
            reps={topReps}
            profile={profile}
            giverAvailableRep={repRates.rep_rates_left_for_rater ?? 0}
            canEditRep={canEditRep}
          />
          <UserPageRepRepsTable
            reps={reps}
            profile={profile}
            giverAvailableRep={repRates.rep_rates_left_for_rater ?? 0}
            canEditRep={canEditRep}
          />
        </>
      )}
    </div>
  );
}
