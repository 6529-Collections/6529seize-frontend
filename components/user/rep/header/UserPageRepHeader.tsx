"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "@heroicons/react/24/solid";
import { useContext, useEffect, useMemo, useState } from "react";
import RepCategoryPill from "../RepCategoryPill";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import GrantRepDialog from "../new-rep/GrantRepDialog";
import { getCanEditRep } from "../UserPageRep.helpers";

export type RepDirection = "received" | "given";

export default function UserPageRepHeader({
  overview,
  categories,
  profile,
  repDirection,
  onRepDirectionChange,
}: {
  readonly overview: ApiRepOverview | null;
  readonly categories: ApiRepCategory[];
  readonly profile: ApiIdentity;
  readonly repDirection: RepDirection;
  readonly onRepDirectionChange: (direction: RepDirection) => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    setVisibleCount(5);
  }, [categories]);

  const visibleCategories = categories.slice(0, visibleCount);
  const hasMore = categories.length > visibleCount;

  const canEditRep = useMemo(
    () =>
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
      }),
    [connectedProfile, profile, activeProfileProxy]
  );

  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [isGrantRepOpen, setIsGrantRepOpen] = useState(false);

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
                {repDirection === "received"
                  ? "What others recognize this identity for."
                  : "What this identity recognizes others for."}
              </p>
            </div>

            {overview ? (
              <div className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-end tw-text-right">
                <div className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                  Total Rep
                </div>
                <div className="tw-text-3xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-primary-400">
                  {formatNumberWithCommas(overview.total_rep)}
                </div>
                <span className="tw-mt-1 tw-text-sm tw-font-normal tw-text-iron-400">
                  {formatNumberWithCommas(overview.contributor_count)}{" "}
                  {repDirection === "given"
                    ? overview.contributor_count === 1 ? "receiver" : "receivers"
                    : overview.contributor_count === 1 ? "rater" : "raters"}
                </span>
              </div>
            ) : (
              <div className="tw-flex tw-flex-shrink-0 tw-flex-col tw-items-end tw-text-right">
                <div className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                  Total Rep
                </div>
                <div className="tw-text-3xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-primary-400">
                  —
                </div>
              </div>
            )}
          </div>

          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-4">
            <button
              type="button"
              onClick={() => onRepDirectionChange("received")}
              className={`tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-medium tw-transition-colors tw-duration-200 ${
                repDirection === "received"
                  ? "tw-text-iron-100"
                  : "tw-text-iron-500 hover:tw-text-iron-300"
              }`}
            >
              <ArrowDownLeftIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0" aria-hidden="true" />
              Received
            </button>
            <button
              type="button"
              onClick={() => onRepDirectionChange("given")}
              className={`tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-medium tw-transition-colors tw-duration-200 ${
                repDirection === "given"
                  ? "tw-text-iron-100"
                  : "tw-text-iron-500 hover:tw-text-iron-300"
              }`}
            >
              <ArrowUpRightIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0" aria-hidden="true" />
              Given
            </button>
          </div>

          {(visibleCategories.length > 0 || (canEditRep && repDirection === "received")) && (
            <div className="tw-mt-6 tw-border-b-0 tw-border-l-0 tw-border-r-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-6">
              <div className="tw-mb-4 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                Rep Categories
              </div>
              <div className="tw-flex tw-flex-wrap tw-gap-3">
                {canEditRep && repDirection === "received" && (
                  <button
                    type="button"
                    onClick={() => setIsGrantRepOpen(true)}
                    className="tw-group tw-inline-flex tw-h-11 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-dashed tw-border-white/15 tw-bg-white/[0.03] tw-px-4 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-all tw-duration-300 tw-ease-out hover:tw-border-white/20 hover:tw-bg-white/[0.05] hover:tw-text-iron-300"
                  >
                    <svg
                      className="-tw-ml-1 tw-h-4 tw-w-4 tw-text-iron-400 tw-transition-colors group-hover:tw-text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Add new</span>
                  </button>
                )}
                {visibleCategories.map((cat) => (
                  <RepCategoryPill
                    key={cat.category}
                    category={cat}
                    canEdit={canEditRep && repDirection === "received"}
                    onEdit={setEditCategory}
                    direction={repDirection}
                  />
                ))}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="tw-inline-flex tw-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-4 tw-text-sm tw-font-medium tw-text-iron-400 tw-backdrop-blur-md tw-transition-all tw-duration-300 tw-ease-out hover:tw-border-white/20 hover:tw-bg-white/10 hover:tw-text-white"
                  >
                    +{categories.length - visibleCount} more
                  </button>
                )}
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

      <GrantRepDialog
        profile={profile}
        overview={overview}
        isOpen={isGrantRepOpen}
        onClose={() => setIsGrantRepOpen(false)}
      />

    </>
  );
}
