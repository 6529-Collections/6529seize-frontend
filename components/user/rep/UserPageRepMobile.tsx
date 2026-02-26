"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type {
  ApiProfileRepRatesState,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { amIUser, formatNumberWithCommas } from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { ProfileRatersParamsOrderBy, RateMatter } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useMemo, useState } from "react";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageIdentityStatementsAddButton from "../identity/statements/add/UserPageIdentityStatementsAddButton";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";
import UserCICStatus from "../utils/user-cic-status/UserCICStatus";
import UserCICTypeIcon from "../utils/user-cic-type/UserCICTypeIcon";
import TopRaterAvatars from "./header/TopRaterAvatars";
import UserPageRepModifyModal from "./modify-rep/UserPageRepModifyModal";
import GrantRepDialog from "./new-rep/GrantRepDialog";
import RepCategoryPill from "./RepCategoryPill";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import {
  getCanEditRep,
  sortRepsByRatingAndContributors,
} from "./UserPageRep.helpers";

type MobileTab = "rep" | "identity";

export default function UserPageRepMobile({
  profile,
  repRates,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly repRates: ApiProfileRepRatesState | null;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { address } = useSeizeConnectContext();
  const profileHandle = profile.handle ?? "";

  const [activeTab, setActiveTab] = useState<MobileTab>("rep");
  const [isGrantRepOpen, setIsGrantRepOpen] = useState(false);
  const [isNicRateOpen, setIsNicRateOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [editCategory, setEditCategory] = useState<string | null>(null);

  const { data: nicRatings } = useQuery<Page<RatingWithProfileInfoAndLevel>>({
    queryKey: [
      QueryKey.PROFILE_RATERS,
      {
        handleOrWallet: profileHandle,
        matter: RateMatter.NIC,
        page: 1,
        pageSize: 1,
        order: SortDirection.DESC,
        orderBy: ProfileRatersParamsOrderBy.RATING,
        given: false,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
        endpoint: `profiles/${profileHandle}/cic/ratings/by-rater`,
        params: {
          page: `${1}`,
          page_size: `${1}`,
          order: SortDirection.DESC.toLowerCase(),
          order_by: ProfileRatersParamsOrderBy.RATING.toLowerCase(),
          given: "false",
        },
      }),
    enabled: !!profileHandle,
  });

  // Close modals when viewport reaches lg breakpoint
  useEffect(() => {
    const mq = globalThis.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsGrantRepOpen(false);
        setIsNicRateOpen(false);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setVisibleCount(5);
  }, [repRates?.rating_stats]);

  // --- derived: sorted reps, can-edit flags ---
  const reps = useMemo(
    () => sortRepsByRatingAndContributors(repRates?.rating_stats ?? []),
    [repRates?.rating_stats]
  );

  const canEditRep = useMemo(
    () =>
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
      }),
    [connectedProfile, profile, activeProfileProxy]
  );

  const canEditNic = useMemo((): boolean => {
    if (!connectedProfile?.handle) return false;
    if (activeProfileProxy) {
      if (profile.handle === activeProfileProxy.created_by.handle) return false;
      return activeProfileProxy.actions.some(
        (action) => action.action_type === ApiProfileProxyActionType.AllocateCic
      );
    }
    if (amIUser({ profile, address })) return false;
    return true;
  }, [connectedProfile, profile, activeProfileProxy, address]);

  const canEditStatements =
    !activeProfileProxy &&
    !!profile?.handle &&
    (profile.wallets ?? []).some(
      (w) => w.wallet.toLowerCase() === address?.toLowerCase()
    );

  // --- render ---

  return (
    <div className="lg:tw-hidden">
      {/* Score Cards (tappable navigation) */}
      <div className="tw-grid tw-grid-cols-2 tw-gap-3">
        {/* Rep Score */}
        <button
          type="button"
          onClick={() => setActiveTab("rep")}
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
              {repRates
                ? formatNumberWithCommas(repRates.total_rep_rating)
                : "\u2014"}
            </div>
            {repRates && (
              <div className="tw-mt-2.5 tw-flex tw-items-center">
                <span className="tw-text-xs tw-font-normal tw-text-iron-400">
                  {formatNumberWithCommas(repRates.number_of_raters)}{" "}
                  {repRates.number_of_raters === 1 ? "rater" : "raters"}
                </span>
              </div>
            )}
          </div>
        </button>

        {/* NIC Score */}
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
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
              {formatNumberWithCommas(profile.cic)}
            </div>
            <div className="tw-mt-2.5 tw-flex tw-items-center tw-gap-1.5">
              <span className="tw-h-4 tw-w-4 tw-flex-shrink-0">
                <UserCICTypeIcon cic={profile.cic} />
              </span>
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-emerald-400">
                <UserCICStatus cic={profile.cic} />
              </span>
            </div>
            <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
              <div className="tw-pointer-events-none desktop-hover:tw-pointer-events-auto">
                <TopRaterAvatars
                  handleOrWallet={profile.handle ?? ""}
                  matter={RateMatter.NIC}
                  count={3}
                  size="sm"
                  withLinks={false}
                />
              </div>
              <span className="tw-text-xs tw-font-normal tw-text-iron-400">
                {formatNumberWithCommas(nicRatings?.count ?? 0)}{" "}
                {(nicRatings?.count ?? 0) === 1 ? "rater" : "raters"}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "rep" ? (
          <motion.div
            key="rep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            {/* Rep Categories */}
            {reps.length > 0 && (
              <div className="tw-mt-4">
                <div className="tw-mb-3 tw-whitespace-nowrap tw-text-xs tw-uppercase tw-tracking-wider tw-text-iron-100 tw-font-semibold">
                  Rep Categories
                </div>
                <div className="tw-flex tw-flex-wrap tw-gap-2">
                  {reps.slice(0, visibleCount).map((rep) => (
                    <RepCategoryPill
                      key={rep.category}
                      rep={rep}
                      profileHandle={profile.handle ?? ""}
                      canEdit={canEditRep}
                      onEdit={setEditCategory}
                      compact
                    />
                  ))}
                  {reps.length > visibleCount && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/60 tw-bg-iron-900/60 tw-px-4 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-iron-400 tw-transition-colors hover:tw-border-iron-600/60 hover:tw-bg-iron-800/60 hover:tw-text-iron-300"
                    >
                      +{reps.length - visibleCount} more
                    </button>
                  )}
                </div>
              </div>
            )}

            {canEditRep && (
              <div className="tw-mt-4">
                <UserPageRateWrapper
                  profile={profile}
                  type={RateMatter.REP}
                  hideOwnProfileMessage
                >
                  <div className="tw-flex tw-items-center tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-blue-500/20 tw-bg-blue-400/5 tw-px-5 tw-py-3">
                    <span className="tw-text-xs tw-font-medium tw-text-blue-300/70">
                      Add rep to this identity
                    </span>
                    <button
                      onClick={() => setIsGrantRepOpen(true)}
                      className="tw-flex tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-shadow-lg tw-shadow-blue-500/20 tw-transition tw-duration-300 tw-ease-out hover:tw-border-primary-600 hover:tw-bg-primary-600 md:tw-py-3"
                    >
                      <svg
                        className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0"
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
                    </button>
                  </div>
                </UserPageRateWrapper>
              </div>
            )}

            <div className="tw-mt-6">
              <UserPageCombinedActivityLog
                initialActivityLogParams={initialActivityLogParams}
                matter={RateMatter.REP}
                withMatterFilter={false}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="identity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            {/* Rate NIC CTA */}
            {canEditNic && (
              <div className="tw-mt-4">
                <UserPageRateWrapper
                  profile={profile}
                  type={RateMatter.NIC}
                  hideOwnProfileMessage
                >
                  <div className="tw-flex tw-items-center tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-emerald-500/10 tw-bg-emerald-500/5 tw-px-5 tw-py-3">
                    <span className="tw-text-xs tw-font-medium tw-text-emerald-200/70">
                      Verify this identity
                    </span>
                    <button
                      onClick={() => setIsNicRateOpen(true)}
                      className="tw-flex tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500 tw-bg-emerald-500 tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-shadow-lg tw-shadow-emerald-500/20 tw-transition tw-duration-300 tw-ease-out hover:tw-border-emerald-400 hover:tw-bg-emerald-400 sm:tw-py-3"
                    >
                      Rate NIC
                    </button>
                  </div>
                </UserPageRateWrapper>
              </div>
            )}

            {/* Identity Statements */}
            <div className="tw-mt-6 tw-flex tw-items-center tw-justify-between">
              <h3 className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-100">
                ID Statements
              </h3>
              {canEditStatements && (
                <UserPageIdentityStatementsAddButton profile={profile} />
              )}
            </div>
            <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0f1014]">
              <UserPageIdentityStatements profile={profile} />
            </div>

            <div className="tw-mt-6">
              <UserPageCombinedActivityLog
                initialActivityLogParams={initialActivityLogParams}
                matter={RateMatter.NIC}
                withMatterFilter={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grant Rep Bottom Sheet */}
      <GrantRepDialog
        profile={profile}
        repRates={repRates}
        isOpen={isGrantRepOpen}
        onClose={() => setIsGrantRepOpen(false)}
      />

      {/* Rate NIC Bottom Sheet */}
      <MobileWrapperDialog
        title="Rate NIC"
        isOpen={isNicRateOpen}
        onClose={() => setIsNicRateOpen(false)}
        tabletModal
      >
        <div className="tw-px-4 sm:tw-px-6">
          <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
            <UserPageIdentityHeaderCICRate
              profile={profile}
              isTooltip={false}
              onSuccess={() => setIsNicRateOpen(false)}
            />
          </UserPageRateWrapper>
          <div className="tw-mt-3">
            <button
              onClick={() => setIsNicRateOpen(false)}
              type="button"
              className="tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </MobileWrapperDialog>

      {canEditRep && editCategory && (
        <UserPageRepModifyModal
          profile={profile}
          category={editCategory}
          onClose={() => setEditCategory(null)}
        />
      )}
    </div>
  );
}
