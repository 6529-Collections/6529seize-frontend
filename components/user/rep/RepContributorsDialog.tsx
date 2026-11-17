"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import Button from "@/components/utils/button/Button";
import type { ApiRepContributor } from "@/generated/models/ApiRepContributor";
import type { ApiRepContributorsPage } from "@/generated/models/ApiRepContributorsPage";
import type { ApiRatingWithProfileInfoAndLevel } from "@/generated/models/ApiRatingWithProfileInfoAndLevel";
import { formatAddress } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import {
  RATING_CONTRIBUTOR_ROW_CLASS,
  RATING_CONTRIBUTOR_IDENTITY_CLASS,
  RATING_CONTRIBUTOR_NAME_CLASS,
  RATING_CONTRIBUTOR_AMOUNT_CLASS,
} from "./ratingContributorStyles";
import { commonApiFetch } from "@/services/api/common-api";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";
import RatingSortSelect, { type RatingListOrder } from "./RatingSortSelect";

const REP_CONTRIBUTORS_QUERY_KEY = "REP_CONTRIBUTORS";
const REP_CONTRIBUTORS_PAGE_SIZE = 100;
const REP_CONTRIBUTORS_STALE_TIME_MS = 5 * 60 * 1000;

type RepContributorScope = "overview" | "category";

interface RepContributorsDialogProps {
  readonly identity: string;
  readonly isOpen: boolean;
  readonly scope: RepContributorScope;
  readonly direction: RepDirection;
  readonly category?: string | null | undefined;
  readonly contributorCount: number;
  readonly onClose: () => void;
}

interface RepContributorListItem {
  readonly key: string;
  readonly href: string;
  readonly display: string;
  readonly pfpUrl: string | null;
  readonly contribution: number;
}

interface RepContributorPage {
  readonly data: RepContributorListItem[];
  readonly page: number;
  readonly next: boolean;
}

type ApiRatingWithProfileInfoAndLevelWithPfp =
  ApiRatingWithProfileInfoAndLevel & {
    readonly pfp?: string | null;
  };

type ApiRatingWithProfileInfoAndLevelPageWithPfp = Pick<
  ApiRepContributorsPage,
  "page" | "next"
> & {
  readonly data: ApiRatingWithProfileInfoAndLevelWithPfp[];
};

function getRouteHref(handleOrWallet: string): string {
  return `/${encodeURIComponent(handleOrWallet.toLowerCase())}`;
}

function getDialogTitle({
  scope,
  category,
  contributorLabel,
}: {
  readonly scope: RepContributorScope;
  readonly category?: string | null | undefined;
  readonly contributorLabel: string;
}) {
  if (scope === "category" && category) {
    return `${category} ${contributorLabel}`;
  }

  return `All ${contributorLabel}`;
}

function mapOverviewContributor(
  contributor: ApiRatingWithProfileInfoAndLevelWithPfp
): RepContributorListItem {
  const handle = contributor.handle.trim();
  const firstWallet = contributor.wallets[0]?.trim();
  const fallbackWallet =
    firstWallet !== undefined && firstWallet.length > 0
      ? firstWallet
      : contributor.handle;
  const display = handle.length > 0 ? handle : formatAddress(fallbackWallet);
  const routeValue = handle.length > 0 ? handle : fallbackWallet;

  return {
    key: contributor.profile_id,
    href: getRouteHref(routeValue),
    display,
    pfpUrl: contributor.pfp ?? null,
    contribution: contributor.rating,
  };
}

function mapCategoryContributor(
  contributor: ApiRepContributor
): RepContributorListItem {
  const fallbackWallet = contributor.profile.primary_address;
  const handle = contributor.profile.handle?.trim() ?? "";
  const routeValue = handle.length > 0 ? handle : fallbackWallet;
  const display = handle.length > 0 ? handle : formatAddress(fallbackWallet);

  return {
    key: contributor.profile.id,
    href: getRouteHref(routeValue),
    display,
    pfpUrl: contributor.profile.pfp ?? null,
    contribution: contributor.contribution,
  };
}

function RepContributorRow({
  contributor,
}: {
  readonly contributor: RepContributorListItem;
}) {
  const locale = useBrowserLocale();
  return (
    <Link
      href={contributor.href}
      className={`${RATING_CONTRIBUTOR_ROW_CLASS} tw-group/rating-contributor tw-no-underline`}
    >
      <div className={RATING_CONTRIBUTOR_IDENTITY_CLASS}>
        <span aria-hidden="true">
          <ProfileAvatar
            pfpUrl={contributor.pfpUrl}
            size={ProfileBadgeSize.SMALL}
            shape="circle"
            alt=""
            fallbackContent={contributor.display.charAt(0).toUpperCase()}
          />
        </span>
        <span className={RATING_CONTRIBUTOR_NAME_CLASS}>
          {contributor.display}
        </span>
      </div>
      <span
        className={`${RATING_CONTRIBUTOR_AMOUNT_CLASS} ${contributor.contribution < 0 ? "tw-text-rose-400" : "tw-text-iron-300"}`}
      >
        {formatInteger(locale, contributor.contribution)}
      </span>
    </Link>
  );
}

async function fetchRepContributorPage({
  identity,
  scope,
  direction,
  category,
  pageParam,
  orderBy,
  signal,
}: {
  readonly identity: string;
  readonly scope: RepContributorScope;
  readonly direction: RepDirection;
  readonly category: string | null;
  readonly pageParam: number;
  readonly orderBy: RatingListOrder;
  readonly signal: AbortSignal;
}): Promise<RepContributorPage> {
  if (scope === "overview") {
    const page =
      await commonApiFetch<ApiRatingWithProfileInfoAndLevelPageWithPfp>({
        endpoint: `profiles/${identity}/rep/ratings/by-rater`,
        params: {
          given: direction === "given" ? "true" : "false",
          page: pageParam.toString(),
          page_size: REP_CONTRIBUTORS_PAGE_SIZE.toString(),
          order: "DESC",
          order_by: orderBy,
        },
        signal,
      });

    return {
      data: page.data.map(mapOverviewContributor),
      page: page.page,
      next: page.next,
    };
  }

  if (!category) {
    throw new Error("Missing rep category.");
  }

  const page = await commonApiFetch<ApiRepContributorsPage>({
    endpoint: `profiles/${identity}/rep/categories/${encodeURIComponent(
      category
    )}/contributors`,
    params: {
      ...(direction === "given" ? { direction: "outgoing" } : {}),
      page: pageParam.toString(),
      page_size: REP_CONTRIBUTORS_PAGE_SIZE.toString(),
    },
    signal,
  });

  return {
    data: page.data.map(mapCategoryContributor),
    page: page.page,
    next: page.next,
  };
}

export default function RepContributorsDialog({
  identity,
  isOpen,
  scope,
  direction,
  category,
  contributorCount,
  onClose,
}: RepContributorsDialogProps) {
  const queryClient = useQueryClient();
  const viewRef = useRef<HTMLDivElement>(null);
  const [orderBy, setOrderBy] = useState<RatingListOrder>("rating");
  const trimmedCategory = category?.trim();
  let normalizedCategory = trimmedCategory ?? null;
  if (normalizedCategory === "") {
    normalizedCategory = null;
  }
  const getQueryKey = (order: RatingListOrder) =>
    [
      REP_CONTRIBUTORS_QUERY_KEY,
      {
        identity,
        scope,
        direction,
        category: normalizedCategory,
        orderBy: order,
      },
    ] as const;
  const changeOrder = (next: RatingListOrder) => {
    if (next === orderBy) return;
    const key = getQueryKey(next);
    const cached =
      queryClient.getQueryState<InfiniteData<RepContributorPage, number>>(key);
    if (cached?.data && cached.data.pages.length > 1) {
      queryClient.setQueryData(
        key,
        {
          ...cached.data,
          pages: cached.data.pages.slice(0, 1),
          pageParams: cached.data.pageParams.slice(0, 1),
        },
        { updatedAt: cached.dataUpdatedAt }
      );
    }
    setOrderBy(next);
    viewRef.current?.parentElement?.scrollTo({ top: 0 });
  };
  const contributorsQuery = useInfiniteQuery({
    queryKey: getQueryKey(orderBy),
    queryFn: async ({ pageParam, signal }) =>
      await fetchRepContributorPage({
        identity,
        scope,
        direction,
        category: normalizedCategory,
        pageParam,
        orderBy,
        signal,
      }),
    enabled: isOpen && (scope === "overview" || normalizedCategory !== null),
    initialPageParam: 1,
    staleTime: REP_CONTRIBUTORS_STALE_TIME_MS,
    getNextPageParam: (lastPage: RepContributorPage | undefined) =>
      lastPage?.next ? lastPage.page + 1 : undefined,
  });

  const contributorLabel = getContributorLabel(direction, contributorCount);
  const title = getDialogTitle({
    scope,
    category: normalizedCategory,
    contributorLabel,
  });
  const items = useMemo(
    () => contributorsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [contributorsQuery.data?.pages]
  );

  const showErrorState = contributorsQuery.isLoadingError;
  const showLoadMoreError = contributorsQuery.isFetchNextPageError;
  const errorMessage =
    contributorsQuery.error instanceof Error
      ? contributorsQuery.error.message
      : "Failed to load contributors.";

  const fetchNextPage = () => {
    contributorsQuery.fetchNextPage().catch(() => undefined);
  };

  const refetchContributors = () => {
    contributorsQuery.refetch().catch(() => undefined);
  };

  const onBottomIntersection = (state: boolean) => {
    if (!state) return;
    if (contributorsQuery.isPending || contributorsQuery.isFetching) return;
    if (contributorsQuery.isFetchNextPageError) return;
    if (!contributorsQuery.hasNextPage) return;

    fetchNextPage();
  };

  return (
    <MobileWrapperDialog
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      desktopAlign="top"
      noPadding
      fitVisualViewport
      maxWidthClass="md:tw-max-w-xl"
      showScrollbar
      showHeaderCloseButton
      headerClassName="tw-pb-2 tw-pt-4"
    >
      <div ref={viewRef} className="tw-px-4 tw-pb-6 sm:tw-px-6">
        {scope === "overview" && (
          <div className="tw-my-2">
            <RatingSortSelect
              matter="REP"
              direction={direction}
              value={orderBy}
              onChange={changeOrder}
            />
          </div>
        )}
        {contributorsQuery.isPending && (
          <div className="tw-flex tw-justify-center tw-py-12">
            <CircleLoader size={CircleLoaderSize.XXLARGE} />
          </div>
        )}

        {showErrorState && (
          <div className="tw-border-red-500/20 tw-bg-red-500/5 tw-rounded-xl tw-border tw-border-solid tw-p-4">
            <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
              {errorMessage}
            </p>
            <Button
              variant="tertiary"
              size="sm"
              onClick={refetchContributors}
              className="tw-mt-3"
            >
              Retry
            </Button>
          </div>
        )}

        {contributorsQuery.status === "success" && items.length === 0 && (
          <div className="tw-border-white/8 tw-rounded-xl tw-border tw-border-solid tw-bg-white/[0.02] tw-p-4">
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              No {contributorLabel} found.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="tw-flex tw-flex-col tw-gap-2">
            {items.map((contributor) => (
              <RepContributorRow
                key={contributor.key}
                contributor={contributor}
              />
            ))}

            {contributorsQuery.isFetchingNextPage && (
              <div className="tw-flex tw-justify-center tw-py-4">
                <CircleLoader size={CircleLoaderSize.MEDIUM} />
              </div>
            )}

            {showLoadMoreError && (
              <div className="tw-border-red-500/15 tw-bg-red-500/[0.03] tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-3">
                <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
                  Could not load more {contributorLabel}.
                </p>
                <button
                  type="button"
                  onClick={fetchNextPage}
                  className="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-white tw-transition-colors hover:tw-text-iron-300"
                >
                  Retry
                </button>
              </div>
            )}

            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          </div>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
