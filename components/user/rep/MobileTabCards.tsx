import { useMemo, type ComponentProps } from "react";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import UserCICStatus from "../utils/user-cic-status/UserCICStatus";
import UserCICTypeIcon from "../utils/user-cic-type/UserCICTypeIcon";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";

type MobileTab = "rep" | "identity";

export default function MobileTabCards({
  activeTab,
  onTabChange,
  overview,
  cicOverview,
  profile,
  repDirection,
  cicAvatarItems,
}: {
  readonly activeTab: MobileTab;
  readonly onTabChange: (tab: MobileTab) => void;
  readonly overview: ApiRepOverview | null;
  readonly cicOverview: ApiCicOverview | null;
  readonly profile: ApiIdentity;
  readonly repDirection: RepDirection;
  readonly cicAvatarItems: ComponentProps<typeof OverlappingAvatars>["items"];
}) {
  const repAvatarItems = useMemo(
    () =>
      (overview?.contributors.data ?? []).slice(0, 3).map((c) => ({
        key: c.profile.handle ?? c.profile.primary_address,
        pfpUrl: c.profile.pfp ?? null,
        href: `/${c.profile.handle ?? c.profile.primary_address}`,
        ariaLabel: c.profile.handle ?? c.profile.primary_address,
        fallback: c.profile.handle
          ? c.profile.handle.charAt(0).toUpperCase()
          : "?",
        title: c.profile.handle ?? c.profile.primary_address,
        tooltipContent: (
          <span>
            {c.profile.handle ?? c.profile.primary_address} &middot;{" "}
            {formatNumberWithCommas(c.contribution)}
          </span>
        ),
      })),
    [overview?.contributors.data]
  );

  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
      <button
        type="button"
        aria-pressed={activeTab === "rep"}
        onClick={() => onTabChange("rep")}
        className={`tw-relative tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-p-4 tw-text-left tw-transition-all tw-duration-300 tw-ease-out ${
          activeTab === "rep" ? "tw-bg-[#0f1014]" : "tw-bg-white/[0.02]"
        }`}
      >
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3 tw-z-10"
        >
          <span
            className={`tw-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-all tw-duration-300 ${
              activeTab === "rep"
                ? "tw-border-primary-300/90 tw-bg-transparent tw-ring-2 tw-ring-primary-500/25"
                : "tw-border-iron-400/45 tw-bg-black/10 tw-ring-1 tw-ring-black/20"
            }`}
          >
            {activeTab === "rep" && (
              <span className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-primary-300 tw-transition-all tw-duration-300" />
            )}
          </span>
        </div>
        {activeTab === "rep" && (
          <>
            <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-blue-500/[0.05] tw-via-transparent tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-iron-300/25 tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-blue-400/40 tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/20 tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-blue-400/20 tw-to-transparent" />
          </>
        )}
        <div
          className={`tw-relative tw-transition-opacity tw-duration-300 ${activeTab === "rep" ? "" : "tw-opacity-40"}`}
        >
          <div className="tw-mb-1.5 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500">
            Total Rep
          </div>
          <div className="tw-text-2xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-primary-400">
            {overview ? formatNumberWithCommas(overview.total_rep) : "\u2014"}
          </div>
          {overview && (
            <div className="tw-mt-2.5 tw-flex tw-items-center tw-gap-2">
              {repAvatarItems.length > 0 && (
                <div className={activeTab === "rep" ? "tw-pointer-events-none desktop-hover:tw-pointer-events-auto" : "tw-pointer-events-none"}>
                  <OverlappingAvatars
                    items={repAvatarItems}
                    size="sm"
                    maxCount={3}
                  />
                </div>
              )}
              <span className="tw-text-xs tw-font-normal tw-text-iron-400">
                {formatNumberWithCommas(overview.contributor_count)}{" "}
                {getContributorLabel(repDirection, overview.contributor_count)}
              </span>
            </div>
          )}
        </div>
      </button>

      <button
        type="button"
        aria-pressed={activeTab === "identity"}
        onClick={() => onTabChange("identity")}
        className={`tw-relative tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-p-4 tw-text-left tw-transition-all tw-duration-300 tw-ease-out ${
          activeTab === "identity" ? "tw-bg-[#0f1014]" : "tw-bg-white/[0.02]"
        }`}
      >
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3 tw-z-10"
        >
          <span
            className={`tw-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition-all tw-duration-300 ${
              activeTab === "identity"
                ? "tw-border-emerald-300/90 tw-bg-transparent tw-ring-2 tw-ring-emerald-500/25"
                : "tw-border-iron-400/45 tw-bg-black/10 tw-ring-1 tw-ring-black/20"
            }`}
          >
            {activeTab === "identity" && (
              <span className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-emerald-300 tw-transition-all tw-duration-300" />
            )}
          </span>
        </div>
        {activeTab === "identity" && (
          <>
            <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-emerald-500/[0.05] tw-via-transparent tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-iron-300/25 tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/40 tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
            <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
          </>
        )}
        <div
          className={`tw-relative tw-transition-opacity tw-duration-300 ${activeTab === "identity" ? "" : "tw-opacity-40"}`}
        >
          <div className="tw-mb-1.5 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500">
            NIC
          </div>
          <div className="tw-text-2xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-white">
            {formatNumberWithCommas(cicOverview?.total_cic ?? profile.cic)}
          </div>
          <div className="tw-mt-2.5 tw-flex tw-items-center tw-gap-1.5">
            <span className="tw-h-4 tw-w-4 tw-flex-shrink-0">
              <UserCICTypeIcon cic={cicOverview?.total_cic ?? profile.cic} />
            </span>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-emerald-400">
              <UserCICStatus cic={cicOverview?.total_cic ?? profile.cic} />
            </span>
          </div>
          <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
            {cicAvatarItems.length > 0 && (
              <div className={activeTab === "identity" ? "tw-pointer-events-none desktop-hover:tw-pointer-events-auto" : "tw-pointer-events-none"}>
                <OverlappingAvatars
                  items={cicAvatarItems}
                  size="sm"
                  maxCount={3}
                />
              </div>
            )}
            <span className="tw-text-xs tw-font-normal tw-text-iron-400">
              {formatNumberWithCommas(cicOverview?.contributor_count ?? 0)}{" "}
              {(cicOverview?.contributor_count ?? 0) === 1 ? "rater" : "raters"}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
