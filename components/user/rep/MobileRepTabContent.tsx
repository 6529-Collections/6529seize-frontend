import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { RateMatter } from "@/types/enums";
import type { RepDirection } from "./UserPageRep.helpers";
import RepDirectionToggle from "./RepDirectionToggle";
import RepCategoryPill from "./RepCategoryPill";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";

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
  onGrantRep,
  onEditCategory,
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
  readonly onGrantRep: () => void;
  readonly onEditCategory: (category: string) => void;
}) {
  return (
    <>
      {canEditRep && repDirection === "received" && (
        <div className="tw-mt-4">
          <UserPageRateWrapper
            profile={profile}
            type={RateMatter.REP}
            hideOwnProfileMessage
          >
            <button
              type="button"
              onClick={onGrantRep}
              className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-blue-500/30 tw-bg-blue-400/5 tw-px-4 tw-py-2.5 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-blue-400/10"
            >
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
              ) : (
                <span className="tw-text-xs tw-font-medium tw-text-blue-300/70">
                  Add rep to this identity
                </span>
              )}
              <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-white">
                <svg
                  className="-tw-ml-1 tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
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
              </span>
            </button>
          </UserPageRateWrapper>
        </div>
      )}

      <div className="tw-mt-4">
        <div className="tw-mb-4 tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          Rep Categories
        </div>

        {/* Received / Given toggle */}
        <div className="tw-mb-3">
          <RepDirectionToggle
            repDirection={repDirection}
            onRepDirectionChange={onRepDirectionChange}
            compact
          />
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
                direction={repDirection}
                compact
              />
            ))}
            {categories.length > visibleCount && (
              <button
                type="button"
                onClick={onShowMore}
                className="tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/60 tw-bg-iron-900/60 tw-px-4 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-iron-400 tw-transition-colors hover:tw-border-iron-600/60 hover:tw-bg-iron-800/60 hover:tw-text-iron-300"
              >
                +{categories.length - visibleCount} more
              </button>
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
