"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiProfileRepRatesState, RatingStats } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useContext, useEffect, useState } from "react";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import TopRaterAvatars from "./TopRaterAvatars";
import {
  getCanEditRep,
  sortRepsByRatingAndContributors,
} from "../UserPageRep.helpers";

const TOP_REPS_COUNT = 5;

export default function UserPageRepHeader({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
  readonly profile: ApiIdentity;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const [topReps, setTopReps] = useState<RatingStats[]>(
    sortRepsByRatingAndContributors(repRates?.rating_stats ?? []).slice(
      0,
      TOP_REPS_COUNT
    )
  );

  useEffect(() => {
    setTopReps(
      sortRepsByRatingAndContributors(repRates?.rating_stats ?? []).slice(
        0,
        TOP_REPS_COUNT
      )
    );
  }, [repRates?.rating_stats]);

  const [canEditRep, setCanEditRep] = useState<boolean>(
    getCanEditRep({
      myProfile: connectedProfile,
      targetProfile: profile,
      activeProfileProxy,
    })
  );

  useEffect(() => {
    setCanEditRep(
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
      })
    );
  }, [connectedProfile, profile, activeProfileProxy]);

  const [editCategory, setEditCategory] = useState<string | null>(null);

  const openEditCategory = (category: string) => {
    if (!canEditRep) {
      return;
    }
    setEditCategory(category);
  };

  return (
    <>
      <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-gradient-to-br tw-from-[#0f1014] tw-via-[#0A0A0C] tw-to-[#08090b] tw-shadow-2xl">
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-blue-500/[0.05] tw-via-transparent tw-to-transparent tw-opacity-100" />
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-[1px] tw-bg-gradient-to-r tw-from-transparent tw-via-blue-400/40 tw-to-transparent" />
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-[1px] tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/20 tw-to-transparent" />
        <div className="tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-[1px] tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/20 tw-to-transparent" />

        <div className="tw-relative tw-p-6">
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-6">
            <div className="tw-min-w-0">
              <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-100">
                Rep
              </h2>
              <p className="tw-mb-0 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500">
                What others recognize this identity for.
              </p>
            </div>

            <div className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-end tw-text-right">
              <div className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                Total Rep
              </div>
              <div className="tw-text-3xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-primary-400">
                {repRates
                  ? formatNumberWithCommas(repRates.total_rep_rating)
                  : ""}
              </div>
              {repRates && (
                <span className="tw-mt-1 tw-text-sm tw-font-normal tw-text-iron-400">
                  {formatNumberWithCommas(repRates.number_of_raters)}{" "}
                  {repRates.number_of_raters === 1 ? "rater" : "raters"}
                </span>
              )}
            </div>
          </div>

          {topReps.length > 0 && (
            <div className="tw-mt-6 tw-border-b-0 tw-border-l-0 tw-border-r-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-6">
              <div className="tw-mb-4 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                Top Rep
              </div>
              <div className="tw-flex tw-flex-wrap tw-gap-3">
                {topReps.map((rep) => (
                  <div
                    key={rep.category}
                    className={`group tw-inline-flex tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/60 tw-bg-iron-900/60 tw-px-4 tw-py-2.5 tw-transition-colors ${
                      canEditRep
                        ? "tw-cursor-pointer hover:tw-border-iron-600/60 hover:tw-bg-iron-800/60"
                        : "tw-cursor-default"
                    }`}
                  >
                    {canEditRep ? (
                      <button
                        type="button"
                        onClick={() => openEditCategory(rep.category)}
                        className="tw-inline-flex tw-items-center tw-gap-2.5 tw-appearance-none tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-inherit tw-cursor-pointer focus:tw-outline-none"
                      >
                        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                          {rep.category}
                        </span>
                        <span className="tw-text-sm tw-font-semibold tw-text-iron-300 group-hover:tw-text-iron-200">
                          {formatNumberWithCommas(rep.rating)}
                        </span>
                      </button>
                    ) : (
                      <div className="tw-inline-flex tw-items-center tw-gap-2.5">
                        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                          {rep.category}
                        </span>
                        <span className="tw-text-sm tw-font-semibold tw-text-iron-300 group-hover:tw-text-iron-200">
                          {formatNumberWithCommas(rep.rating)}
                        </span>
                      </div>
                    )}
                    <span className="tw-text-xs tw-text-iron-600">·</span>
                    <TopRaterAvatars
                      handleOrWallet={profile.handle ?? ""}
                      category={rep.category}
                      count={5}
                    />
                    <span className="tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-400">
                      {formatNumberWithCommas(rep.contributor_count)}{" "}
                      {rep.contributor_count === 1 ? "rater" : "raters"}
                    </span>
                  </div>
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
