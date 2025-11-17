"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import {
  ApiProfileRepRatesState,
  RatingStats,
} from "@/entities/IProfile";
import UserPageRepRepsTop from "./UserPageRepRepsTop";
import UserPageRepRepsTable from "./table/UserPageRepRepsTable";
import { AuthContext } from "@/components/auth/Auth";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
const TOP_REPS_COUNT = 5;

type CanEditRepParams = {
  readonly myProfile: ApiIdentity | null;
  readonly targetProfile: ApiIdentity;
  readonly activeProfileProxy: ApiProfileProxy | null;
};

const getCanEditRep = ({
  myProfile,
  targetProfile,
  activeProfileProxy,
}: CanEditRepParams) => {
  if (!myProfile?.handle) {
    return false;
  }

  if (activeProfileProxy) {
    if (targetProfile.handle === activeProfileProxy.created_by.handle) {
      return false;
    }

    return activeProfileProxy.actions.some(
      (action) => action.action_type === ApiProfileProxyActionType.AllocateRep
    );
  }

  if (myProfile.handle === targetProfile.handle) {
    return false;
  }

  return true;
};

export default function UserPageRepReps({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
  readonly profile: ApiIdentity;
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
  const canEditRep = useMemo(
    () =>
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
      }),
    [connectedProfile, profile, activeProfileProxy]
  );

  return (
    <div>
      {!!reps.length && (
        <>
          <div className="tw-mt-6 lg:tw-mt-8">
            <h3 className="tw-float-none tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
              Top Rep
            </h3>
          </div>
          <UserPageRepRepsTop
            reps={topReps}
            profile={profile}
            canEditRep={canEditRep}
          />
          <div className="tw-mt-6 lg:tw-mt-8">
            <h3 className="tw-float-none tw-block tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100">
              Total Rep
            </h3>
          </div>
          <UserPageRepRepsTable
            reps={reps}
            profile={profile}
            canEditRep={canEditRep}
          />
        </>
      )}
    </div>
  );
}
