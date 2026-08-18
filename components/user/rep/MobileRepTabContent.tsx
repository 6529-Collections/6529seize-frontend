import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import Button from "@/components/utils/button/Button";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { RateMatter } from "@/types/enums";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { useMemo } from "react";
import { buildRepAvatarItems } from "./buildRepAvatarItems";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";
import RepCategoryPill from "./RepCategoryPill";
import RepDirectionToggle from "./RepDirectionToggle";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";

function RepContributorControl({
  overview,
  repDirection,
  onOpenOverviewContributors,
}: {
  readonly overview: ApiRepOverview | null;
  readonly repDirection: RepDirection;
  readonly onOpenOverviewContributors: () => void;
}) {
  const repAvatarItems = useMemo(
    () =>
      buildRepAvatarItems(overview?.contributors.data ?? [], 3, {
        omitHref: true,
      }),
    [overview?.contributors.data]
  );

  if (!overview) {
    return null;
  }

  const contributorLabel = getContributorLabel(
    repDirection,
    overview.contributor_count
  );
  const contributorContent = (
    <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
      {repAvatarItems.length > 0 && (
        <span className="tw-flex-shrink-0">
          <OverlappingAvatars items={repAvatarItems} size="sm" maxCount={3} />
        </span>
      )}
      <span className="tw-truncate tw-text-xs tw-font-medium tw-text-iron-300">
        {formatNumberWithCommas(overview.contributor_count)} {contributorLabel}
      </span>
    </span>
  );

  if (overview.contributor_count <= 0) {
    return (
      <span className="tw-flex tw-min-h-9 tw-flex-shrink-0 tw-items-center tw-px-1">
        {contributorContent}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={`View ${formatNumberWithCommas(overview.contributor_count)} ${contributorLabel}`}
      onClick={onOpenOverviewContributors}
      className="tw-flex tw-min-h-9 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.14] tw-bg-white/[0.04] tw-px-2.5 tw-py-1 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/[0.2] desktop-hover:hover:tw-bg-white/[0.07] motion-reduce:tw-transition-none"
    >
      {contributorContent}
      <ChevronRightIcon
        aria-hidden="true"
        className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500"
      />
    </button>
  );
}

function RepEmptyState({
  loading,
  repDirection,
}: {
  readonly loading: boolean;
  readonly repDirection: RepDirection;
}) {
  if (loading) {
    return (
      <div className="tw-mt-4 tw-flex tw-justify-center tw-py-4">
        <div className="tw-h-5 tw-w-5 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-700 tw-border-t-iron-400" />
      </div>
    );
  }
  return (
    <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-font-normal tw-text-iron-500">
      {repDirection === "given" ? "No rep given yet." : "No rep received yet."}
    </p>
  );
}

export default function MobileRepTabContent({
  profile,
  overview,
  categories,
  repDirection,
  onRepDirectionChange,
  initialActivityLogParams,
  loading,
  canEditRep,
  visibleCount,
  onShowMore,
  hasNextPage,
  isFetchingNextPage,
  onGrantRep,
  onOpenOverviewContributors,
  onEditCategory,
  onOpenGlobalCategory,
  onOpenCategoryContributors,
}: {
  readonly profile: ApiIdentity;
  readonly overview: ApiRepOverview | null;
  readonly categories: ApiRepCategory[];
  readonly repDirection: RepDirection;
  readonly onRepDirectionChange: (direction: RepDirection) => void;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly loading: boolean;
  readonly canEditRep: boolean;
  readonly visibleCount: number;
  readonly onShowMore: () => void;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onGrantRep: () => void;
  readonly onOpenOverviewContributors: () => void;
  readonly onEditCategory: (category: string) => void;
  readonly onOpenGlobalCategory: (category: string) => void;
  readonly onOpenCategoryContributors: (category: ApiRepCategory) => void;
}) {
  const hiddenLoadedCategoryCount = Math.max(
    categories.length - visibleCount,
    0
  );
  const hasMore = hiddenLoadedCategoryCount > 0 || hasNextPage;
  let loadMoreLabel = "Load more";
  if (hiddenLoadedCategoryCount > 0) {
    loadMoreLabel = `+${hiddenLoadedCategoryCount} more`;
  } else if (isFetchingNextPage) {
    loadMoreLabel = "Loading...";
  }
  const isLoadMoreDisabled =
    isFetchingNextPage && hiddenLoadedCategoryCount === 0;

  return (
    <>
      {repDirection === "given" &&
        overview !== null &&
        overview.authenticated_user_contribution !== null &&
        overview.authenticated_user_contribution !== 0 && (
          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-border tw-border-solid tw-border-blue-500/20 tw-bg-blue-400/5 tw-px-4 tw-py-2.5">
            <span className="tw-text-xs tw-font-medium tw-text-iron-500">
              Assigned To You:
            </span>
            <span className="tw-text-xs tw-font-semibold tw-text-iron-300">
              {overview.authenticated_user_contribution > 0 && "+"}
              {formatNumberWithCommas(overview.authenticated_user_contribution)}
            </span>
          </div>
        )}

      <div className="tw-mt-4">
        <div className="tw-mb-4 sm:tw-grid sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-center sm:tw-gap-x-6">
          <div className="tw-flex tw-min-h-9 tw-items-center tw-justify-between tw-gap-3 sm:tw-justify-start sm:tw-gap-6">
            <div className="tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
              Rep Categories
            </div>
            <RepContributorControl
              overview={overview}
              repDirection={repDirection}
              onOpenOverviewContributors={onOpenOverviewContributors}
            />
          </div>
          {canEditRep && repDirection === "received" && (
            <div className="tw-mt-3 tw-w-full sm:tw-col-start-2 sm:tw-row-start-1 sm:tw-mt-0 sm:tw-w-auto">
              <UserPageRateWrapper
                profile={profile}
                type={RateMatter.REP}
                hideOwnProfileMessage
              >
                <div className="tw-flex tw-w-full tw-flex-col tw-items-stretch tw-gap-2 sm:tw-w-auto sm:tw-flex-row sm:tw-items-center sm:tw-gap-3">
                  {overview !== null &&
                  overview.authenticated_user_contribution !== null &&
                  overview.authenticated_user_contribution !== 0 ? (
                    <span className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-500">
                      You Assigned:{" "}
                      <span className="tw-font-semibold tw-text-iron-300">
                        {overview.authenticated_user_contribution > 0 && "+"}
                        {formatNumberWithCommas(
                          overview.authenticated_user_contribution
                        )}
                      </span>
                    </span>
                  ) : null}
                  <Button
                    variant="action"
                    size="sm"
                    fullWidth
                    onClick={onGrantRep}
                    className="sm:tw-w-auto"
                  >
                    <svg
                      className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0 sm:tw-h-5 sm:tw-w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Grant Rep
                  </Button>
                </div>
              </UserPageRateWrapper>
            </div>
          )}
          <div className="tw-mt-3 tw-w-full sm:tw-col-start-1 sm:tw-row-start-2 sm:tw-w-fit">
            <RepDirectionToggle
              repDirection={repDirection}
              onRepDirectionChange={onRepDirectionChange}
              variant="tabs"
              fill
            />
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {categories.slice(0, visibleCount).map((cat) => (
              <RepCategoryPill
                key={cat.category}
                category={cat}
                canEdit={canEditRep && repDirection === "received"}
                onEdit={onEditCategory}
                onOpenGlobalCategory={onOpenGlobalCategory}
                onOpenContributors={onOpenCategoryContributors}
                direction={repDirection}
                compact
              />
            ))}
            {hasMore && (
              <Button
                variant="secondary"
                onClick={onShowMore}
                disabled={isLoadMoreDisabled}
              >
                {loadMoreLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <RepEmptyState loading={loading} repDirection={repDirection} />
      )}

      <div className="tw-mt-6">
        <UserPageCombinedActivityLog
          initialActivityLogParams={initialActivityLogParams}
          matter={RateMatter.REP}
          withMatterFilter={false}
        />
      </div>
    </>
  );
}
