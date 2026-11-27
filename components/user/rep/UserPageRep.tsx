"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  PENDING_PROFILE_QUERY_VIEWER,
  useProfileQueryViewer,
} from "@/hooks/useProfileQueryViewer";
import {
  nicOverviewQueryOptions,
  repCategoriesQueryOptions,
  repOverviewQueryOptions,
} from "@/services/api/profile-page-queries";
import { t } from "@/i18n/messages";

import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import GlobalRepCategoryDialog from "@/components/rep/categories/GlobalRepCategoryDialog";
import { RateMatter } from "@/types/enums";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import IdentityGettingStartedCard from "../identity/getting-started/IdentityGettingStartedCard";
import UserPageIdentityHeader from "../identity/header/UserPageIdentityHeader";
import UserPageIdentityHeaderCICRate from "../identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";

import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";
import type { RepDirection } from "./UserPageRep.helpers";
import { getCanEditNic } from "./UserPageRep.helpers";
import UserPageRepHeader from "./header/UserPageRepHeader";
import ProfileRepContributorsDialog from "./ProfileRepContributorsDialog";
import type { RepDialogState } from "./repDialogs.types";
import UserPageRepMobile from "./UserPageRepMobile";

const INITIAL_VISIBLE_CATEGORY_COUNT = 5;
const VISIBLE_CATEGORY_LOAD_STEP = 10;

const getDefaultVisibleCounts = (): Record<RepDirection, number> => ({
  received: INITIAL_VISIBLE_CATEGORY_COUNT,
  given: INITIAL_VISIBLE_CATEGORY_COUNT,
});

const getDefaultFetchStates = (): Record<RepDirection, boolean> => ({
  received: false,
  given: false,
});

export default function UserPageRep({
  profile,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const locale = useBrowserLocale();
  const params = useParams();
  const user = (params["user"] as string).toLowerCase();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { address } = useSeizeConnectContext();

  const [repDirection, setRepDirection] = useState<RepDirection>("received");
  const [isNicRateOpen, setIsNicRateOpen] = useState(false);
  const [repDialog, setRepDialog] = useState<RepDialogState | null>(null);
  const [visibleCounts, setVisibleCounts] = useState(getDefaultVisibleCounts);
  const visibleCountsRef = useRef(visibleCounts);
  const isFetchingNextPageRef = useRef(getDefaultFetchStates());

  useEffect(() => {
    visibleCountsRef.current = visibleCounts;
  }, [visibleCounts]);

  const canEditNic = useMemo(
    () =>
      getCanEditNic({
        connectedProfile,
        targetProfile: profile,
        activeProfileProxy,
        address,
      }),
    [connectedProfile, profile, activeProfileProxy, address]
  );

  const viewer = useProfileQueryViewer();
  const canLoadRatings =
    !!profile.id && !!user && viewer !== PENDING_PROFILE_QUERY_VIEWER;
  const canLoadGivenRep = canLoadRatings && repDirection === "given";

  const { data: repOverview, isFetching: isFetchingOverview } = useQuery({
    ...repOverviewQueryOptions(user, "incoming", viewer),
    enabled: canLoadRatings,
  });
  const repCategoriesQuery = useInfiniteQuery({
    ...repCategoriesQueryOptions(user, "incoming", viewer),
    enabled: canLoadRatings,
  });

  const { data: repOverviewGiven, isFetching: isFetchingOverviewGiven } =
    useQuery({
      ...repOverviewQueryOptions(user, "outgoing", viewer),
      enabled: canLoadGivenRep,
    });
  const repCategoriesGivenQuery = useInfiniteQuery({
    ...repCategoriesQueryOptions(user, "outgoing", viewer),
    enabled: canLoadGivenRep,
  });

  const { data: cicOverview } = useQuery({
    ...nicOverviewQueryOptions(user, "incoming", viewer),
    enabled: canLoadRatings,
  });

  const repCategories = useMemo(
    () => repCategoriesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [repCategoriesQuery.data]
  );
  const repCategoriesGiven = useMemo(
    () =>
      repCategoriesGivenQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [repCategoriesGivenQuery.data]
  );

  // Pick active direction's data
  const activeOverview =
    repDirection === "received"
      ? (repOverview ?? null)
      : (repOverviewGiven ?? null);
  const activeCategories =
    repDirection === "received" ? repCategories : repCategoriesGiven;
  const activeHasNextPage =
    repDirection === "received"
      ? Boolean(repCategoriesQuery.hasNextPage)
      : Boolean(repCategoriesGivenQuery.hasNextPage);
  const activeIsFetchingNextPage =
    repDirection === "received"
      ? repCategoriesQuery.isFetchingNextPage
      : repCategoriesGivenQuery.isFetchingNextPage;
  const activeVisibleCount = visibleCounts[repDirection];
  const activeLoading =
    viewer === PENDING_PROFILE_QUERY_VIEWER ||
    (repDirection === "received"
      ? isFetchingOverview || repCategoriesQuery.isFetching
      : isFetchingOverviewGiven || repCategoriesGivenQuery.isFetching);

  const handleShowMore = useCallback(() => {
    const nextVisibleCounts = {
      ...visibleCountsRef.current,
      [repDirection]:
        visibleCountsRef.current[repDirection] + VISIBLE_CATEGORY_LOAD_STEP,
    };
    visibleCountsRef.current = nextVisibleCounts;
    setVisibleCounts(nextVisibleCounts);

    const loadedCount =
      repDirection === "received"
        ? repCategories.length
        : repCategoriesGiven.length;
    const hasNextPage =
      repDirection === "received"
        ? Boolean(repCategoriesQuery.hasNextPage)
        : Boolean(repCategoriesGivenQuery.hasNextPage);
    const isFetchingNextPage =
      repDirection === "received"
        ? repCategoriesQuery.isFetchingNextPage
        : repCategoriesGivenQuery.isFetchingNextPage;
    const fetchNextPage =
      repDirection === "received"
        ? repCategoriesQuery.fetchNextPage
        : repCategoriesGivenQuery.fetchNextPage;

    if (
      nextVisibleCounts[repDirection] > loadedCount &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchingNextPageRef.current[repDirection]
    ) {
      isFetchingNextPageRef.current[repDirection] = true;
      fetchNextPage()
        .catch(() => {
          // Errors are surfaced via query state rendered in the UI.
        })
        .finally(() => {
          isFetchingNextPageRef.current[repDirection] = false;
        });
    }
  }, [
    repCategories.length,
    repCategoriesGiven.length,
    repCategoriesQuery.fetchNextPage,
    repCategoriesQuery.hasNextPage,
    repCategoriesQuery.isFetchingNextPage,
    repCategoriesGivenQuery.fetchNextPage,
    repCategoriesGivenQuery.hasNextPage,
    repCategoriesGivenQuery.isFetchingNextPage,
    repDirection,
  ]);

  const handleOpenOverviewContributors = () => {
    if (!activeOverview || activeOverview.contributor_count <= 0) {
      return;
    }

    setRepDialog({
      type: "contributors",
      scope: "overview",
      direction: repDirection,
      contributorCount: activeOverview.contributor_count,
    });
  };

  return (
    <div className="tailwind-scope">
      <IdentityGettingStartedCard
        profile={profile}
        className="tw-mb-4 lg:tw-mb-8"
      />
      <div className="lg:tw-hidden">
        <UserPageRepMobile
          profile={profile}
          overview={activeOverview}
          categories={activeCategories}
          cicOverview={cicOverview ?? null}
          repDirection={repDirection}
          onRepDirectionChange={setRepDirection}
          initialActivityLogParams={initialActivityLogParams}
          loading={activeLoading}
          visibleCount={activeVisibleCount}
          onShowMore={handleShowMore}
          hasNextPage={activeHasNextPage}
          isFetchingNextPage={activeIsFetchingNextPage}
          onOpenOverviewContributors={handleOpenOverviewContributors}
          onOpenGlobalCategory={(category) =>
            setRepDialog({ type: "globalCategory", category })
          }
        />
      </div>
      <div className="tw-hidden lg:tw-block">
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 lg:tw-grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] xl:tw-gap-x-10">
          <div className="tw-min-w-0">
            <section aria-label={t(locale, "user.rate.repRegion")}>
              <UserPageRepHeader
                overview={activeOverview}
                categories={activeCategories}
                profile={profile}
                repDirection={repDirection}
                onOpenOverviewContributors={handleOpenOverviewContributors}
                onOpenGlobalCategory={(category) =>
                  setRepDialog({ type: "globalCategory", category })
                }
                onRepDirectionChange={setRepDirection}
                loading={activeLoading}
                visibleCount={activeVisibleCount}
                onShowMore={handleShowMore}
                hasNextPage={activeHasNextPage}
                isFetchingNextPage={activeIsFetchingNextPage}
              />
            </section>
            <div className="tw-mt-6 lg:tw-mt-8">
              <UserPageCombinedActivityLog
                initialActivityLogParams={initialActivityLogParams}
              />
            </div>
          </div>

          <div className="tw-min-w-0 tw-self-start">
            <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-[#08090b]">
              <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(120%_70%_at_0%_0%,rgba(16,185,129,0.05),transparent_60%)]" />
              <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/40 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/10 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/10 tw-to-transparent" />
              <div className="tw-relative tw-z-10">
                <UserPageIdentityHeader
                  profile={profile}
                  cicOverview={cicOverview ?? null}
                  {...(canEditNic
                    ? { onRateClick: () => setIsNicRateOpen(true) }
                    : {})}
                />
                <UserPageIdentityStatements profile={profile} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileRepContributorsDialog
        profile={profile}
        dialog={repDialog}
        overview={activeOverview}
        onClose={() => setRepDialog(null)}
      />

      <GlobalRepCategoryDialog
        category={
          repDialog?.type === "globalCategory" ? repDialog.category : null
        }
        isOpen={repDialog?.type === "globalCategory"}
        onClose={() => setRepDialog(null)}
      />

      <MobileWrapperDialog
        title="Rate NIC"
        isOpen={isNicRateOpen}
        onClose={() => setIsNicRateOpen(false)}
        noPadding
        tabletModal
        desktopAlign="top"
        maxWidthClass="md:tw-max-w-md"
        headerClassName="tw-pb-5 tw-pt-4"
        headerVariant="minimal"
      >
        <div className="tw-px-4 tw-pb-6 sm:tw-px-6">
          <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
            <UserPageIdentityHeaderCICRate
              profile={profile}
              isTooltip={false}
              onSuccess={() => setIsNicRateOpen(false)}
              onCancel={() => setIsNicRateOpen(false)}
            />
          </UserPageRateWrapper>
        </div>
      </MobileWrapperDialog>
    </div>
  );
}
