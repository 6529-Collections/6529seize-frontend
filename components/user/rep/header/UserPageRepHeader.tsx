"use client";

import { AuthContext } from "@/components/auth/Auth";
import type {
    ApiProfileRepRatesState,
    RatingStats,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { formatNumberCompact, formatNumberWithCommas } from "@/helpers/Helpers";
import { useContext, useEffect, useState } from "react";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import TopRaterAvatars from "./TopRaterAvatars";

const TOP_REPS_COUNT = 4;

export default function UserPageRepHeader({
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

  const [topReps, setTopReps] = useState<RatingStats[]>(
    sortReps(repRates?.rating_stats ?? []).slice(0, TOP_REPS_COUNT)
  );

  useEffect(() => {
    setTopReps(
      sortReps(repRates?.rating_stats ?? []).slice(0, TOP_REPS_COUNT)
    );
  }, [repRates?.rating_stats]);

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
        (action) =>
          action.action_type === ApiProfileProxyActionType.AllocateRep
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
  }, [connectedProfile, profile, activeProfileProxy]);

  const [editCategory, setEditCategory] = useState<string | null>(null);

  return (
    <>
      <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-gradient-to-br tw-from-[#0f1014] tw-via-[#0A0A0C] tw-to-[#08090b] tw-shadow-2xl">
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-blue-500/[0.05] tw-via-transparent tw-to-transparent tw-opacity-100 tw-pointer-events-none" />
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-[1px] tw-bg-gradient-to-r tw-from-transparent tw-via-blue-400/40 tw-to-transparent" />
        <div className="tw-absolute tw-left-0 tw-top-0 tw-bottom-0 tw-w-[1px] tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/20 tw-to-transparent" />
        <div className="tw-absolute tw-right-0 tw-top-0 tw-bottom-0 tw-w-[1px] tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/20 tw-to-transparent" />

        <div className="tw-relative tw-p-6">
          <div>
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-100">
              Rep
            </h2>
            <p className="tw-mb-0 tw-text-iron-500 tw-text-sm tw-font-normal tw-leading-relaxed">
              What others recognize this profile for.
            </p>
          </div>

          <div className="tw-mt-4 tw-flex tw-items-end tw-justify-between tw-gap-6">
            <div>
              <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1">
                Total Rep
              </div>
              <div className="tw-text-3xl tw-font-semibold tw-text-primary-400 tw-tracking-tight tw-leading-none">
                {repRates
                  ? formatNumberWithCommas(repRates.total_rep_rating)
                  : ""}
              </div>
            </div>
            {repRates && (
              <div className="tw-shrink-0 tw-flex tw-flex-col tw-items-end tw-gap-2.5">
                <TopRaterAvatars handleOrWallet={profile.handle ?? ""} count={5} size="md" />
                <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                  {formatNumberWithCommas(repRates.number_of_raters)}{" "}
                  {repRates.number_of_raters === 1 ? "rater" : "raters"}
                </span>
              </div>
            )}
          </div>


          {topReps.length > 0 && (
            <div className="tw-mt-6 tw-pt-6 tw-border-t tw-border-solid tw-border-white/10 tw-border-l-0 tw-border-r-0 tw-border-b-0">
              <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-4">
               Top Rep
              </div>
              <div className="tw-flex tw-flex-wrap tw-gap-3">
                {topReps.map((rep) => (
                  <button
                    key={rep.category}
                    onClick={() => setEditCategory(rep.category)}
                    disabled={!canEditRep}
                    className={`tw-inline-flex tw-items-center tw-gap-2.5 tw-px-4 tw-py-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/60 tw-bg-iron-900/60 tw-transition-colors ${
                      canEditRep
                        ? "tw-cursor-pointer hover:tw-bg-iron-800/60 hover:tw-border-iron-600/60"
                        : "tw-cursor-default"
                    }`}
                  >
                    <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                      {rep.category}
                    </span>
                    <span className="tw-text-sm tw-font-semibold tw-text-primary-400">
                      {formatNumberCompact(rep.rating)}
                    </span>
                    <span className="tw-text-iron-600 tw-text-xs">·</span>
                    <TopRaterAvatars
                      handleOrWallet={profile.handle ?? ""}
                      category={rep.category}
                      count={3}
                    />
                    <span className="tw-text-xs tw-font-normal tw-text-iron-400 tw-whitespace-nowrap">
                      {formatNumberWithCommas(rep.contributor_count)}{" "}
                      {rep.contributor_count === 1 ? "rater" : "raters"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {canEditRep && editCategory && (
        <UserPageRepModifyModal
          profile={profile}
          category={editCategory}
          onClose={() => setEditCategory(null)}
        />
      )}
    </>
  );
}
