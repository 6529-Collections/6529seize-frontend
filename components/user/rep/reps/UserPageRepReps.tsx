import { useContext, useEffect, useState } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import UserPageRepRepsTop from "./UserPageRepRepsTop";
import UserPageRepRepsTable from "./table/UserPageRepRepsTable";
import { AuthContext } from "../../../auth/Auth";
import { ApiProfileProxyActionType } from "../../../../generated/models/ApiProfileProxyActionType";

const TOP_REPS_COUNT = 5;

export default function UserPageRepReps({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
  readonly profile: IProfileAndConsolidations;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const sortReps = (items: RatingStats[]) =>
    [...items].sort((a, d) => {
      if (a.rating === d.rating) {
        return d.contributor_count - a.contributor_count;
      }
      return d.rating - a.rating;
    });

  const [reps, setReps] = useState<RatingStats[]>(
    sortReps(repRates?.rating_stats ?? [])
  );

  const getTopReps = (items: RatingStats[]) => {
    return items.slice(0, TOP_REPS_COUNT);
  };

  const [topReps, setTopReps] = useState<RatingStats[]>(getTopReps(reps));
  useEffect(
    () => setReps(sortReps(repRates?.rating_stats ?? [])),
    [repRates?.rating_stats]
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
    if (activeProfileProxy) {
      if (profile.profile?.handle === activeProfileProxy.created_by.handle) {
        return false;
      }
      return activeProfileProxy.actions.some(
        (action) => action.action_type === ApiProfileProxyActionType.AllocateRep
      );
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
          <div className="tw-mt-6 lg:tw-mt-8">
            <h3 className="tw-float-none tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
              Top Rep
            </h3>
          </div>
          <UserPageRepRepsTop
            reps={topReps}
            profile={profile}
            canEditRep={canEditRep}
          />
          <div className="tw-mt-6 lg:tw-mt-8">
            <h3 className="tw-float-none tw-block tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
              Total Rep
            </h3>
          </div>
          <UserPageRepRepsTable
            reps={reps}
            profile={profile}
            giverAvailableRep={repRates?.rep_rates_left_for_rater ?? 0}
            canEditRep={canEditRep}
          />
        </>
      )}
    </div>
  );
}
