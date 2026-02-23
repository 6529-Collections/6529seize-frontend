"use client";

import { useContext, useEffect, useState } from "react";
import type { ApiProfileRepRatesState, RatingStats } from "@/entities/IProfile";
import UserPageRepRepsTable from "./table/UserPageRepRepsTable";
import { AuthContext } from "@/components/auth/Auth";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageRateWrapper from "../../utils/rate/UserPageRateWrapper";
import UserPageRepNewRep from "../new-rep/UserPageRepNewRep";
import { RateMatter } from "@/types/enums";

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

  useEffect(
    () => setReps(sortReps(repRates?.rating_stats ?? [])),
    [repRates?.rating_stats]
  );

  const getCanEditRep = ({
    myProfile,
    targetProfile,
  }: {
    myProfile: ApiIdentity | null;
    targetProfile: ApiIdentity;
  }) => {
    if (!myProfile?.handle) {
      return false;
    }
    if (activeProfileProxy) {
      if (profile.handle === activeProfileProxy.created_by.handle) {
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
    <div className="tw-mt-6 lg:tw-mt-8">
      <div className="tw-relative">
        <div className="tw-mb-4">
          <h3 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
            Total Rep
          </h3>
        </div>

        <UserPageRateWrapper
          profile={profile}
          type={RateMatter.REP}
          hideOwnProfileMessage>
          <UserPageRepNewRep profile={profile} repRates={repRates} />
        </UserPageRateWrapper>

        {!!reps.length && (
          <div className="tw-mt-2">
            <UserPageRepRepsTable
              reps={reps}
              profile={profile}
              canEditRep={canEditRep}
            />
          </div>
        )}
      </div>
    </div>
  );
}
