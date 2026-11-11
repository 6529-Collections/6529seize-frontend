"use client";

import { AuthContext } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useContext, useMemo, useState } from "react";
import { canManageGivenRatings } from "../ratingsManagement";
import RepCategoryList from "../RepCategoryList";
import RepDirectionToggle from "../RepDirectionToggle";
import RatingContributorsControl from "../RatingContributorsControl";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import GrantRepDialog from "../new-rep/GrantRepDialog";
import { getCanEditRep, type RepDirection } from "../UserPageRep.helpers";

export default function UserPageRepHeader({
  overview,
  categories,
  profile,
  repDirection,
  onOpenOverviewContributors,
  onOpenGlobalCategory,
  onRepDirectionChange,
  loading,
  visibleCount,
  onShowMore,
  hasNextPage,
  isFetchingNextPage,
}: {
  readonly overview: ApiRepOverview | null;
  readonly categories: ApiRepCategory[];
  readonly profile: ApiIdentity;
  readonly repDirection: RepDirection;
  readonly onOpenOverviewContributors: () => void;
  readonly onOpenGlobalCategory: (category: string) => void;
  readonly onRepDirectionChange: (direction: RepDirection) => void;
  readonly loading: boolean;
  readonly visibleCount: number;
  readonly onShowMore: () => void;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const canManage =
    repDirection === "given" &&
    canManageGivenRatings(profile, connectedProfile, activeProfileProxy);

  const visibleCategories = categories.slice(0, visibleCount);
  const canEditRep = useMemo(
    () =>
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
      }),
    [connectedProfile, profile, activeProfileProxy]
  );

  const locale = useBrowserLocale();
  const [isGrantRepOpen, setIsGrantRepOpen] = useState(false);

  return (
    <>
      <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-gradient-to-br tw-from-[#0f1014] tw-via-[#0A0A0C] tw-to-[#08090b] tw-shadow-2xl">
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(120%_90%_at_0%_0%,rgba(59,130,246,0.06),transparent_60%)]" />
        <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-blue-400/40 tw-to-transparent" />
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-blue-400/20 tw-to-transparent" />
        <div className="tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/10 tw-to-transparent" />
        <div className="tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/10 tw-to-transparent" />

        <div className="tw-relative tw-p-6">
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-6">
            <div className="tw-min-w-0">
              <h2 className="tw-mb-1 tw-mt-0 tw-text-xl tw-font-semibold tw-text-iron-100">
                Rep
              </h2>
              <p className="tw-m-0 tw-text-[15px] tw-font-normal tw-leading-[22.75px] tw-text-iron-300">
                {repDirection === "received"
                  ? "What others recognize this identity for."
                  : "What this identity recognizes others for."}
              </p>
              <div className="tw-mt-4">
                <RepDirectionToggle
                  repDirection={repDirection}
                  onRepDirectionChange={onRepDirectionChange}
                />
              </div>
            </div>

            <div className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-end tw-text-right">
              <div className="tw-mb-1 tw-text-[11px]/4 tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
                Total Rep
              </div>
              <div className="tw-text-3xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-primary-400">
                {overview ? formatNumberWithCommas(overview.total_rep) : "—"}
              </div>
              <div className="tw-mt-3">
                <RatingContributorsControl
                  overview={overview}
                  direction={repDirection}
                  matter="REP"
                  canManage={canManage}
                  onClick={onOpenOverviewContributors}
                />
              </div>
            </div>
          </div>

          {(visibleCategories.length > 0 ||
            (canEditRep && repDirection === "received")) && (
            <div className="tw-mt-5 tw-border-b-0 tw-border-l-0 tw-border-r-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5">
              <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between tw-gap-3">
                <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2">
                  <div className="tw-text-[11px]/4 tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
                    Rep Categories
                  </div>
                  {overview !== null &&
                    overview.authenticated_user_contribution !== null &&
                    overview.authenticated_user_contribution !== 0 && (
                      <div className="tw-inline-flex tw-items-center tw-gap-x-1.5">
                        <span className="tw-text-meta/4 tw-font-normal tw-text-iron-500">
                          {repDirection === "given"
                            ? "Assigned To You:"
                            : "You Assigned:"}
                        </span>
                        <span className="tw-text-meta/4 tw-font-medium tw-text-iron-300">
                          {overview.authenticated_user_contribution > 0 && "+"}
                          {formatNumberWithCommas(
                            overview.authenticated_user_contribution
                          )}
                        </span>
                      </div>
                    )}
                </div>
                {canEditRep && repDirection === "received" && (
                  <Button
                    variant="action"
                    size="sm"
                    onClick={() => setIsGrantRepOpen(true)}
                  >
                    <PlusIcon
                      aria-hidden="true"
                      className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0"
                    />
                    <span>{t(locale, "user.profile.rep.rep.grantAction")}</span>
                  </Button>
                )}
              </div>
              <RepCategoryList
                key={`${profile.id ?? profile.query ?? profile.display}:${repDirection}`}
                profile={profile}
                categories={categories}
                direction={repDirection}
                visibleCount={visibleCount}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onShowMore={onShowMore}
                onOpenGlobalCategory={onOpenGlobalCategory}
              />
            </div>
          )}

          {categories.length === 0 &&
            !loading &&
            !(canEditRep && repDirection === "received") && (
              <div className="tw-mt-4 tw-border-b-0 tw-border-l-0 tw-border-r-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
                <p className="tw-mb-0 tw-text-meta/5 tw-font-normal tw-text-iron-500">
                  {repDirection === "given"
                    ? "This identity hasn't given any rep yet."
                    : "This identity hasn't received any rep yet."}
                </p>
              </div>
            )}

          {categories.length === 0 &&
            loading &&
            !(canEditRep && repDirection === "received") && (
              <div className="tw-mt-4 tw-flex tw-justify-center tw-border-b-0 tw-border-l-0 tw-border-r-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-4">
                <div className="tw-h-6 tw-w-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-700 tw-border-t-iron-400" />
              </div>
            )}
        </div>
      </div>

      <GrantRepDialog
        profile={profile}
        overview={overview}
        isOpen={isGrantRepOpen}
        onClose={() => setIsGrantRepOpen(false)}
      />
    </>
  );
}
