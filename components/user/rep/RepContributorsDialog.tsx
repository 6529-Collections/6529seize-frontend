"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import type { ApiRepContributor } from "@/generated/models/ApiRepContributor";
import type { ApiRepContributorsPage } from "@/generated/models/ApiRepContributorsPage";
import type { ApiRatingWithProfileInfoAndLevel } from "@/generated/models/ApiRatingWithProfileInfoAndLevel";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { formatAddress, formatNumberWithCommas } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { getContributorLabel, type RepDirection } from "./UserPageRep.helpers";

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

function getAvatarFallback(display: string) {
  const firstChar = display.trim().charAt(0).toUpperCase();

  return (
    <span className="tw-text-[0.6875rem] tw-font-semibold tw-text-iron-300">
      {firstChar || "?"}
    </span>
  );
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
  showAvatar,
}: {
  readonly contributor: RepContributorListItem;
  readonly showAvatar: boolean;
}) {
  return (
    <Link
      href={contributor.href}
      className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5 tw-no-underline tw-transition-colors hover:tw-border-white/15 hover:tw-bg-white/[0.04]"
    >
      <div
        className={`tw-flex tw-min-w-0 tw-items-center ${
          showAvatar ? "tw-gap-3" : "tw-gap-0"
        }`}
      >
        {showAvatar && (
          <div className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
            {contributor.pfpUrl ? (
              // Profile avatars can come from arbitrary remote hosts, so this stays unoptimized.
              <img
                src={getScaledImageUri(
                  contributor.pfpUrl,
                  ImageScale.W_AUTO_H_50
                )}
                alt={`${contributor.display} profile`}
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              getAvatarFallback(contributor.display)
            )}
          </div>
        )}
        <p className="tw-mb-0 tw-whitespace-nowrap tw-text-left tw-text-sm tw-font-medium tw-text-white">
          {contributor.display}
        </p>
      </div>

      <span className="tw-text-sm tw-font-medium tw-text-iron-300 tw-transition-colors">
        {formatNumberWithCommas(contributor.contribution)}
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
}: {
  readonly identity: string;
  readonly scope: RepContributorScope;
  readonly direction: RepDirection;
  readonly category: string | null;
  readonly pageParam: number;
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
          order_by: "rating",
        },
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
  const trimmedCategory = category?.trim();
  let normalizedCategory = trimmedCategory ?? null;
  if (normalizedCategory === "") {
    normalizedCategory = null;
  }
  const contributorsQuery = useInfiniteQuery({
    queryKey: [
      REP_CONTRIBUTORS_QUERY_KEY,
      { identity, scope, direction, category: normalizedCategory },
    ],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchRepContributorPage({
        identity,
        scope,
        direction,
        category: normalizedCategory,
        pageParam,
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
      tall
      fixedHeight
      tabletModal
      maxWidthClass="md:tw-max-w-xl md:[&_h2]:tw-mt-2"
      showScrollbar
    >
      <div className="tw-px-4 sm:tw-px-6">
        <div className="tw-mb-4 tw-mt-2 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
            {formatNumberWithCommas(contributorCount)} {contributorLabel}
          </p>
        </div>

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
            <button
              type="button"
              onClick={refetchContributors}
              className="tw-mt-3 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/15 hover:tw-bg-white/[0.06]"
            >
              Retry
            </button>
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
          <div className="tw-flex tw-flex-col tw-gap-3">
            {items.map((contributor) => (
              <RepContributorRow
                key={contributor.key}
                contributor={contributor}
                showAvatar={scope === "category"}
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
