"use client";

import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { ApiRepCategoriesPage } from "@/generated/models/ApiRepCategoriesPage";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import { commonApiFetch } from "@/services/api/common-api";
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
import RepContributorsDialog from "./RepContributorsDialog";
import UserPageRepMobile from "./UserPageRepMobile";

const INITIAL_VISIBLE_CATEGORY_COUNT = 5;
const VISIBLE_CATEGORY_LOAD_STEP = 10;
const REP_CATEGORIES_PAGE_SIZE = 25;
const TOP_CONTRIBUTORS_LIMIT = 5;
const FIRST_REP_CATEGORIES_PAGE = 1;

const getDefaultVisibleCounts = (): Record<RepDirection, number> => ({
  received: INITIAL_VISIBLE_CATEGORY_COUNT,
  given: INITIAL_VISIBLE_CATEGORY_COUNT,
});

const getDefaultFetchStates = (): Record<RepDirection, boolean> => ({
  received: false,
  given: false,
});

type RepContributorsDialogState =
  | {
      readonly scope: "overview";
      readonly direction: RepDirection;
      readonly contributorCount: number;
    }
  | {
      readonly scope: "category";
      readonly direction: RepDirection;
      readonly category: string;
      readonly contributorCount: number;
    };

type RepDialogState =
  | ({
      readonly type: "contributors";
    } & RepContributorsDialogState)
  | {
      readonly type: "globalCategory";
      readonly category: string;
    };

function useRepCategories({
  user,
  queryDirection,
  apiDirection,
  enabled,
}: {
  readonly user: string;
  readonly queryDirection: "incoming" | "outgoing";
  readonly apiDirection?: "outgoing";
  readonly enabled: boolean;
}) {
  return useInfiniteQuery({
    queryKey: [
      QueryKey.REP_CATEGORIES,
      { handleOrWallet: user, direction: queryDirection },
    ],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await commonApiFetch<ApiRepCategoriesPage>({
        endpoint: `profiles/${user}/rep/categories`,
        params: {
          ...(apiDirection ? { direction: apiDirection } : {}),
          page: pageParam.toString(),
          page_size: REP_CATEGORIES_PAGE_SIZE.toString(),
          top_contributors_limit: TOP_CONTRIBUTORS_LIMIT.toString(),
        },
      }),
    initialPageParam: FIRST_REP_CATEGORIES_PAGE,
    getNextPageParam: (lastPage: ApiRepCategoriesPage | undefined) =>
      lastPage?.next ? lastPage.page + 1 : undefined,
    enabled,
  });
}

export default function UserPageRep({
  profile,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
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

  // --- Incoming (received) rep ---
  const { data: repOverview, isFetching: isFetchingOverview } =
    useQuery<ApiRepOverview>({
      queryKey: [
        QueryKey.REP_OVERVIEW,
        { handleOrWallet: user, direction: "incoming" },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiRepOverview>({
          endpoint: `profiles/${user}/rep/overview`,
        }),
      enabled: !!user,
    });

  const repCategoriesQuery = useRepCategories({
    user,
    queryDirection: "incoming",
    enabled: !!user,
  });

  // --- Outgoing (given) rep --- only fetch when active
  const { data: repOverviewGiven, isFetching: isFetchingOverviewGiven } =
    useQuery<ApiRepOverview>({
      queryKey: [
        QueryKey.REP_OVERVIEW,
        { handleOrWallet: user, direction: "outgoing" },
      ],
      queryFn: async () =>
        await commonApiFetch<ApiRepOverview>({
          endpoint: `profiles/${user}/rep/overview`,
          params: { direction: "outgoing" },
        }),
      enabled: !!user && repDirection === "given",
    });

  const repCategoriesGivenQuery = useRepCategories({
    user,
    queryDirection: "outgoing",
    apiDirection: "outgoing",
    enabled: !!user && repDirection === "given",
  });

  // --- CIC overview ---
  const { data: cicOverview } = useQuery<ApiCicOverview>({
    queryKey: [QueryKey.CIC_OVERVIEW, { handleOrWallet: user }],
    queryFn: async () =>
      await commonApiFetch<ApiCicOverview>({
        endpoint: `profiles/${user}/cic/overview`,
      }),
    enabled: !!user,
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
    repDirection === "received"
      ? isFetchingOverview || repCategoriesQuery.isFetching
      : isFetchingOverviewGiven || repCategoriesGivenQuery.isFetching;

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

  const handleOpenCategoryContributors = (category: ApiRepCategory) => {
    if (category.contributor_count <= 0) {
      return;
    }

    setRepDialog({
      type: "contributors",
      scope: "category",
      direction: repDirection,
      category: category.category,
      contributorCount: category.contributor_count,
    });
  };

  return (
    <div className="tailwind-scope">
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
          onOpenCategoryContributors={handleOpenCategoryContributors}
        />
      </div>
      <div className="tw-hidden lg:tw-block">
        <IdentityGettingStartedCard
          profile={profile}
          className="tw-mb-6 lg:tw-mb-8"
        />
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 lg:tw-grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] xl:tw-gap-x-10">
          <div className="tw-min-w-0">
            <UserPageRepHeader
              overview={activeOverview}
              categories={activeCategories}
              profile={profile}
              repDirection={repDirection}
              onOpenOverviewContributors={handleOpenOverviewContributors}
              onOpenGlobalCategory={(category) =>
                setRepDialog({ type: "globalCategory", category })
              }
              onOpenCategoryContributors={handleOpenCategoryContributors}
              onRepDirectionChange={setRepDirection}
              loading={activeLoading}
              visibleCount={activeVisibleCount}
              onShowMore={handleShowMore}
              hasNextPage={activeHasNextPage}
              isFetchingNextPage={activeIsFetchingNextPage}
            />
            <div className="tw-mt-6 lg:tw-mt-8">
              <UserPageCombinedActivityLog
                initialActivityLogParams={initialActivityLogParams}
              />
            </div>
          </div>

          <div className="tw-min-w-0 tw-self-start">
            <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#08090b]">
              <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-emerald-500/[0.05] tw-via-transparent tw-to-transparent" />
              <div className="tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/25 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-emerald-400/40 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
              <div className="tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-emerald-400/20 tw-to-transparent" />
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

      <RepContributorsDialog
        identity={user}
        isOpen={repDialog?.type === "contributors"}
        scope={
          repDialog?.type === "contributors" ? repDialog.scope : "overview"
        }
        direction={
          repDialog?.type === "contributors"
            ? repDialog.direction
            : repDirection
        }
        category={
          repDialog?.type === "contributors" && repDialog.scope === "category"
            ? repDialog.category
            : null
        }
        contributorCount={
          repDialog?.type === "contributors" ? repDialog.contributorCount : 0
        }
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
        tabletModal
        maxWidthClass="md:tw-max-w-md"
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
    </div>
  );
}
