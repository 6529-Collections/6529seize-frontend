import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import Button from "@/components/utils/button/Button";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatNumber } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { RateMatter } from "@/types/enums";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { useMemo } from "react";
import { buildRepAvatarItems } from "./buildRepAvatarItems";
import type { RepDirection } from "./UserPageRep.helpers";
import RepCategoryPill from "./RepCategoryPill";
import RepDirectionToggle from "./RepDirectionToggle";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";

function getContributorMessageKey(
  repDirection: RepDirection,
  isOneContributor: boolean
) {
  if (repDirection === "given") {
    return isOneContributor
      ? "user.profile.rep.contributors.receivers.one"
      : "user.profile.rep.contributors.receivers.other";
  }
  return isOneContributor
    ? "user.profile.rep.contributors.raters.one"
    : "user.profile.rep.contributors.raters.other";
}

function getViewContributorsMessageKey(
  repDirection: RepDirection,
  isOneContributor: boolean
) {
  if (repDirection === "given") {
    return isOneContributor
      ? "user.profile.rep.contributors.viewReceivers.one"
      : "user.profile.rep.contributors.viewReceivers.other";
  }
  return isOneContributor
    ? "user.profile.rep.contributors.viewRaters.one"
    : "user.profile.rep.contributors.viewRaters.other";
}

function RepContributorControl({
  overview,
  repDirection,
  onOpenOverviewContributors,
}: {
  readonly overview: ApiRepOverview | null;
  readonly repDirection: RepDirection;
  readonly onOpenOverviewContributors: () => void;
}) {
  const locale = useBrowserLocale();
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

  const pluralCategory = new Intl.PluralRules(locale).select(
    overview.contributor_count
  );
  const isOneContributor = pluralCategory === "one";
  const contributorMessageKey = getContributorMessageKey(
    repDirection,
    isOneContributor
  );
  const viewContributorsMessageKey = getViewContributorsMessageKey(
    repDirection,
    isOneContributor
  );
  const contributorCount = formatInteger(locale, overview.contributor_count);
  const contributorContent = (
    <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
      {repAvatarItems.length > 0 && (
        <span className="tw-flex-shrink-0">
          <OverlappingAvatars items={repAvatarItems} size="sm" maxCount={3} />
        </span>
      )}
      <span className="tw-truncate tw-text-xs tw-font-medium tw-text-iron-300">
        {t(locale, contributorMessageKey, { count: contributorCount })}
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
      aria-label={t(locale, viewContributorsMessageKey, {
        count: contributorCount,
      })}
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
  const locale = useBrowserLocale();
  if (loading) {
    return (
      <div className="tw-mt-4 tw-flex tw-justify-center tw-py-4">
        <div className="tw-h-5 tw-w-5 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-700 tw-border-t-iron-400" />
      </div>
    );
  }
  return (
    <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-font-normal tw-text-iron-500">
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
            <div className="tw-flex-shrink-0">
              <RepContributorControl
                overview={overview}
                repDirection={repDirection}
                onOpenOverviewContributors={onOpenOverviewContributors}
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
          <div className="tw-mt-3 tw-w-full sm:tw-w-fit">
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
