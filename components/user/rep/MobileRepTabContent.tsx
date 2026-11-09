import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import Button from "@/components/utils/button/Button";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatNumber } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { RateMatter } from "@/types/enums";
import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { canManageGivenRatings } from "./ratingsManagement";
import RatingContributorsControl from "./RatingContributorsControl";
import type { RepDirection } from "./UserPageRep.helpers";
import RepCategoryPill from "./RepCategoryPill";
import RepDirectionToggle from "./RepDirectionToggle";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";

function RepEmptyState({
  loading,
  repDirection,
}: {
  readonly loading: boolean;
  readonly repDirection: RepDirection;
}) {
  const locale = useBrowserLocale();
  if (loading) {
    return (
      <div className="tw-mt-4 tw-flex tw-justify-center tw-py-4">
        <div className="tw-h-5 tw-w-5 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-700 tw-border-t-iron-400" />
      </div>
    );
  }
  return (
    <p className="tw-mb-0 tw-mt-4 tw-text-meta/5 tw-font-normal tw-text-iron-500">
      {t(
        locale,
        repDirection === "given"
          ? "user.profile.rep.empty.given"
          : "user.profile.rep.empty.received"
      )}
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
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const canManage =
    repDirection === "given" &&
    canManageGivenRatings(profile, connectedProfile, activeProfileProxy);
  const hiddenLoadedCategoryCount = Math.max(
    categories.length - visibleCount,
    0
  );
  const hasMore = hiddenLoadedCategoryCount > 0 || hasNextPage;
  let loadMoreLabel = t(locale, "user.profile.rep.categories.loadMore");
  if (hiddenLoadedCategoryCount > 0) {
    loadMoreLabel = t(locale, "user.profile.rep.categories.more", {
      count: formatInteger(locale, hiddenLoadedCategoryCount),
    });
  } else if (isFetchingNextPage) {
    loadMoreLabel = t(locale, "user.profile.rep.categories.loadingMore");
  }
  const isLoadMoreDisabled =
    isFetchingNextPage && hiddenLoadedCategoryCount === 0;

  return (
    <>
      <div className="tw-mt-6">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-1">
          <h2 className="tw-m-0 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400">
            {t(locale, "user.profile.identity.mobileTabs.totalRep")}
          </h2>
          <RepDirectionToggle
            repDirection={repDirection}
            onRepDirectionChange={onRepDirectionChange}
          />
        </div>
        <div className="tw-text-3xl tw-font-semibold tw-tabular-nums tw-leading-none tw-tracking-tight tw-text-primary-400">
          {overview ? formatInteger(locale, overview.total_rep) : "—"}
        </div>
      </div>
      {repDirection === "given" &&
        overview !== null &&
        overview.authenticated_user_contribution !== null &&
        overview.authenticated_user_contribution !== 0 && (
          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-border tw-border-solid tw-border-blue-500/20 tw-bg-blue-400/5 tw-px-4 tw-py-2.5">
            <span className="tw-text-xs tw-font-medium tw-text-iron-500">
              {tRich(locale, "user.profile.rep.rep.assignedToYou", {
                value: (
                  <span className="tw-text-xs tw-font-semibold tw-text-iron-300">
                    {formatNumber(
                      locale,
                      overview.authenticated_user_contribution,
                      {
                        maximumFractionDigits: 0,
                        signDisplay: "exceptZero",
                      }
                    )}
                  </span>
                ),
              })}
            </span>
          </div>
        )}

      <div className="tw-mt-4">
        <div className="tw-mb-4">
          <div className="tw-flex tw-min-h-9 tw-items-center tw-gap-3">
            <div
              className={
                canManage ? "tw-min-w-0 tw-flex-1" : "tw-flex-shrink-0"
              }
            >
              <RatingContributorsControl
                overview={overview}
                direction={repDirection}
                matter="REP"
                compact
                onClick={onOpenOverviewContributors}
                canManage={canManage}
              />
            </div>
            {canEditRep && repDirection === "received" && (
              <div className="tw-ml-auto tw-flex tw-min-w-0 tw-items-center">
                <UserPageRateWrapper
                  profile={profile}
                  type={RateMatter.REP}
                  hideOwnProfileMessage
                >
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-start tw-gap-2 sm:tw-flex-nowrap sm:tw-justify-end sm:tw-gap-3">
                    {overview !== null &&
                    overview.authenticated_user_contribution !== null &&
                    overview.authenticated_user_contribution !== 0 ? (
                      <span className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-500">
                        {tRich(locale, "user.profile.rep.rep.youAssigned", {
                          value: (
                            <span className="tw-font-semibold tw-text-iron-300">
                              {formatNumber(
                                locale,
                                overview.authenticated_user_contribution,
                                {
                                  maximumFractionDigits: 0,
                                  signDisplay: "exceptZero",
                                }
                              )}
                            </span>
                          ),
                        })}
                      </span>
                    ) : null}
                    <Button variant="action" size="sm" onClick={onGrantRep}>
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
                      {t(locale, "user.profile.rep.rep.grantAction")}
                    </Button>
                  </div>
                </UserPageRateWrapper>
              </div>
            )}
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
          layout="mobile"
          initialActivityLogParams={initialActivityLogParams}
          matter={RateMatter.REP}
          withMatterFilter={false}
        />
      </div>
    </>
  );
}
