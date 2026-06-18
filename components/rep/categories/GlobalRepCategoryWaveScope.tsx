"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiGlobalRepCategoryWave } from "@/generated/models/ApiGlobalRepCategoryWave";
import type { ApiGlobalRepCategoryWaveContributor } from "@/generated/models/ApiGlobalRepCategoryWaveContributor";
import type { ApiGlobalRepCategoryWaveOverview } from "@/generated/models/ApiGlobalRepCategoryWaveOverview";
import type { ApiGlobalRepCategoryWaveRef } from "@/generated/models/ApiGlobalRepCategoryWaveRef";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchGlobalRepCategoryWaveContributorsPage,
  fetchGlobalRepCategoryWaveOverview,
  fetchGlobalRepCategoryWavesPage,
  getGlobalRepCategoryWaveContributorsPageQueryKey,
  getGlobalRepCategoryWaveOverviewQueryKey,
  getGlobalRepCategoryWavesPageQueryKey,
} from "./globalRepCategory.api";
import {
  GLOBAL_REP_CATEGORY_PAGE_SIZE,
  formatRepCategoryDate,
  getProfileDisplay,
  getProfileHref,
  type GlobalRepCategorySort,
} from "./globalRepCategory.helpers";

type WaveRepTab = "waves" | "contributors";

type WaveRowWithRank = {
  readonly item: ApiGlobalRepCategoryWave;
  readonly rank: number;
};

type ContributorRowWithRank = {
  readonly item: ApiGlobalRepCategoryWaveContributor;
  readonly rank: number;
};

const WAVE_REP_TABS: ReadonlyArray<{
  readonly id: WaveRepTab;
  readonly label: string;
}> = [
  { id: "waves", label: "Waves" },
  { id: "contributors", label: "Contributors" },
];

const WAVE_REP_SORTS: ReadonlyArray<{
  readonly id: GlobalRepCategorySort;
  readonly label: string;
}> = [
  { id: "rep_desc", label: "REP impact high" },
  { id: "rep_asc", label: "REP impact low" },
  { id: "recent", label: "Recent" },
];

function WaveMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-px-4 tw-py-3">
      <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </p>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-primary-300">
        {formatNumberWithCommas(value)}
      </p>
    </div>
  );
}

function StateBlock({
  title,
  message,
  onRetry,
}: {
  readonly title: string;
  readonly message: string;
  readonly onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-5">
      <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
        {title}
      </p>
      <p className="tw-mb-0 tw-text-sm tw-text-iron-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function LoadMoreSentinel({
  canLoadMore,
  isLoading,
  onLoadMore,
}: {
  readonly canLoadMore: boolean;
  readonly isLoading: boolean;
  readonly onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [canLoadMore, isLoading, onLoadMore]);

  if (!canLoadMore) {
    return null;
  }

  return (
    <div ref={sentinelRef} aria-hidden="true" className="tw-h-1 tw-w-full" />
  );
}

function WaveLink({ wave }: { readonly wave: ApiGlobalRepCategoryWaveRef }) {
  return (
    <Link
      href={getWaveRoute({
        waveId: wave.id,
        isDirectMessage: wave.is_direct_message,
        isApp: false,
      })}
      className="tw-text-primary-200 hover:tw-text-primary-100 tw-break-words tw-font-semibold tw-no-underline"
    >
      {wave.name}
    </Link>
  );
}

function ContributorLink({
  contributor,
}: {
  readonly contributor: ApiGlobalRepCategoryWaveContributor;
}) {
  return (
    <Link
      href={getProfileHref(contributor.profile)}
      className="hover:tw-text-primary-200 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline"
    >
      {getProfileDisplay(contributor.profile)}
    </Link>
  );
}

function TopContributors({
  contributors,
}: {
  readonly contributors: ApiGlobalRepCategoryWaveContributor[];
}) {
  if (contributors.length === 0) {
    return <span className="tw-text-sm tw-text-iron-500">None yet</span>;
  }

  return (
    <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
      {contributors.map((contributor) => (
        <li
          key={`${contributor.wave.id}-${contributor.profile.id}-${contributor.contribution}`}
          className="tw-rounded-full tw-bg-white/[0.04] tw-px-2.5 tw-py-1 tw-text-xs tw-text-iron-200"
        >
          <ContributorLink contributor={contributor} />{" "}
          <span className="tw-text-iron-400">
            {formatNumberWithCommas(contributor.contribution)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function WaveRow({
  item,
  rank,
}: {
  readonly item: ApiGlobalRepCategoryWave;
  readonly rank: number;
}) {
  return (
    <tr className="tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/5 last:tw-border-b-0">
      <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-iron-500">{rank}</td>
      <td className="tw-px-4 tw-py-3">
        <WaveLink wave={item.wave} />
      </td>
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-semibold tw-text-iron-100">
        {formatNumberWithCommas(item.total_rep)}
      </td>
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-300">
        {formatNumberWithCommas(item.contributor_count)}
      </td>
      <td className="tw-px-4 tw-py-3">
        <TopContributors contributors={item.top_contributors} />
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-text-iron-400">
        {formatRepCategoryDate(item.last_modified)}
      </td>
    </tr>
  );
}

function ContributorRow({
  item,
  rank,
}: {
  readonly item: ApiGlobalRepCategoryWaveContributor;
  readonly rank: number;
}) {
  return (
    <tr className="tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/5 last:tw-border-b-0">
      <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-iron-500">{rank}</td>
      <td className="tw-px-4 tw-py-3">
        <ContributorLink contributor={item} />
      </td>
      <td className="tw-px-4 tw-py-3">
        <WaveLink wave={item.wave} />
      </td>
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-semibold tw-text-iron-100">
        {formatNumberWithCommas(item.contribution)}
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-text-iron-400">
        {formatRepCategoryDate(item.last_modified)}
      </td>
    </tr>
  );
}

function WavesTable({
  category,
  rows,
}: {
  readonly category: string;
  readonly rows: WaveRowWithRank[];
}) {
  return (
    <div className="tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
      <table className="tw-w-full tw-min-w-[54rem] tw-border-collapse tw-bg-white/[0.02] tw-text-left">
        <caption className="tw-sr-only">
          Waves using REP category {category}
        </caption>
        <thead className="tw-bg-white/[0.04] tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          <tr>
            <th scope="col" className="tw-w-16 tw-px-4 tw-py-3">
              Rank
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              Wave
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              REP
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              Contributors
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              Leading contributors
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              Last modified
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <WaveRow
              key={`${row.rank}-${row.item.wave.id}`}
              item={row.item}
              rank={row.rank}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContributorsTable({
  category,
  rows,
}: {
  readonly category: string;
  readonly rows: ContributorRowWithRank[];
}) {
  return (
    <div className="tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
      <table className="tw-w-full tw-min-w-[44rem] tw-border-collapse tw-bg-white/[0.02] tw-text-left">
        <caption className="tw-sr-only">
          Wave REP contributors for category {category}
        </caption>
        <thead className="tw-bg-white/[0.04] tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          <tr>
            <th scope="col" className="tw-w-16 tw-px-4 tw-py-3">
              Rank
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              Contributor
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              Wave
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              REP
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              Last modified
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ContributorRow
              key={`${row.rank}-${row.item.wave.id}-${row.item.profile.id}`}
              item={row.item}
              rank={row.rank}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortControls({
  sort,
  onSortChange,
}: {
  readonly sort: GlobalRepCategorySort;
  readonly onSortChange: (sort: GlobalRepCategorySort) => void;
}) {
  return (
    <div
      className="tw-inline-flex tw-flex-wrap tw-gap-2"
      aria-label="Sort Wave REP rows"
    >
      {WAVE_REP_SORTS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={sort === option.id}
          onClick={() => onSortChange(option.id)}
          className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-transition-colors ${
            sort === option.id
              ? "tw-text-primary-200 tw-border-primary-400/50 tw-bg-primary-500/15"
              : "tw-border-white/10 tw-bg-white/[0.03] tw-text-iron-400 hover:tw-border-white/20 hover:tw-text-iron-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function WaveRepRowsContent({
  activeTab,
  category,
  contributorRows,
  error,
  isError,
  isPending,
  onRetry,
  waveRows,
}: {
  readonly activeTab: WaveRepTab;
  readonly category: string;
  readonly contributorRows: ContributorRowWithRank[];
  readonly error: unknown;
  readonly isError: boolean;
  readonly isPending: boolean;
  readonly onRetry: () => void;
  readonly waveRows: WaveRowWithRank[];
}) {
  if (isPending) {
    return (
      <output
        aria-label={`Loading Wave REP ${activeTab}`}
        className="tw-flex tw-justify-center tw-py-8"
      >
        <CircleLoader size={CircleLoaderSize.LARGE} />
      </output>
    );
  }

  if (isError) {
    return (
      <StateBlock
        title="Could not load Wave REP rows"
        message={getErrorMessage(error, "Wave REP rows failed to load.")}
        onRetry={onRetry}
      />
    );
  }

  if (activeTab === "waves") {
    return <WavesTable category={category} rows={waveRows} />;
  }

  return <ContributorsTable category={category} rows={contributorRows} />;
}

function WaveRepLoadedContent({
  activeTab,
  category,
  contributorRows,
  loadMoreActiveRows,
  onSortChange,
  overview,
  rowsError,
  rowsIsError,
  rowsIsFetchingNextPage,
  rowsIsPending,
  rowsHasNextPage,
  rowsRetry,
  sort,
  setActiveTab,
  waveRows,
}: {
  readonly activeTab: WaveRepTab;
  readonly category: string;
  readonly contributorRows: ContributorRowWithRank[];
  readonly loadMoreActiveRows: () => void;
  readonly onSortChange: (sort: GlobalRepCategorySort) => void;
  readonly overview: ApiGlobalRepCategoryWaveOverview;
  readonly rowsError: unknown;
  readonly rowsIsError: boolean;
  readonly rowsIsFetchingNextPage: boolean;
  readonly rowsIsPending: boolean;
  readonly rowsHasNextPage: boolean;
  readonly rowsRetry: () => void;
  readonly sort: GlobalRepCategorySort;
  readonly setActiveTab: (tab: WaveRepTab) => void;
  readonly waveRows: WaveRowWithRank[];
}) {
  if (overview.wave_count === 0) {
    return (
      <StateBlock
        title="No Wave REP found"
        message="This category has not been used for Wave REP yet."
      />
    );
  }

  return (
    <>
      <div className="tw-grid tw-grid-cols-1 tw-gap-5 lg:tw-grid-cols-2">
        <section>
          <h3 className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
            Waves preview
          </h3>
          <div className="tw-flex tw-flex-col tw-gap-2">
            {overview.top_waves.map((wave) => (
              <div
                key={wave.wave.id}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5"
              >
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                  <WaveLink wave={wave.wave} />
                  <span className="tw-flex-shrink-0 tw-text-sm tw-font-semibold tw-text-iron-200">
                    {formatNumberWithCommas(wave.total_rep)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
            Contributors preview
          </h3>
          <div className="tw-flex tw-flex-col tw-gap-2">
            {overview.top_contributors.map((contributor) => (
              <div
                key={`${contributor.wave.id}-${contributor.profile.id}`}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5"
              >
                <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:tw-items-center">
                  <ContributorLink contributor={contributor} />
                  <WaveLink wave={contributor.wave} />
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                    {formatNumberWithCommas(contributor.contribution)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-2">
        <div
          role="tablist"
          aria-label="Wave REP category sections"
          className="tw-flex tw-gap-2"
        >
          {WAVE_REP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition-colors ${
                activeTab === tab.id
                  ? "tw-border-white/20 tw-bg-white/10 tw-text-white"
                  : "tw-border-transparent tw-bg-transparent tw-text-iron-400 hover:tw-bg-white/[0.05] hover:tw-text-iron-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <SortControls sort={sort} onSortChange={onSortChange} />
      </div>

      <WaveRepRowsContent
        activeTab={activeTab}
        category={category}
        contributorRows={contributorRows}
        error={rowsError}
        isError={rowsIsError}
        isPending={rowsIsPending}
        onRetry={rowsRetry}
        waveRows={waveRows}
      />

      {rowsHasNextPage && (
        <>
          <LoadMoreSentinel
            canLoadMore={rowsHasNextPage}
            isLoading={rowsIsFetchingNextPage}
            onLoadMore={loadMoreActiveRows}
          />
          <button
            type="button"
            disabled={rowsIsFetchingNextPage}
            onClick={loadMoreActiveRows}
            className="tw-self-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] disabled:tw-cursor-default disabled:tw-opacity-70"
          >
            {rowsIsFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </>
      )}
    </>
  );
}

export default function GlobalRepCategoryWaveScope({
  category,
}: {
  readonly category: string;
}) {
  const [activeTab, setActiveTab] = useState<WaveRepTab>("waves");
  const [sort, setSort] = useState<GlobalRepCategorySort>("rep_desc");

  const overviewQuery = useQuery({
    queryKey: getGlobalRepCategoryWaveOverviewQueryKey(category),
    queryFn: async () => await fetchGlobalRepCategoryWaveOverview(category),
  });

  const wavesQuery = useInfiniteQuery({
    queryKey: getGlobalRepCategoryWavesPageQueryKey({ category, sort }),
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchGlobalRepCategoryWavesPage({
        category,
        sort,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
  });

  const contributorsQuery = useInfiniteQuery({
    queryKey: getGlobalRepCategoryWaveContributorsPageQueryKey({
      category,
      sort,
    }),
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchGlobalRepCategoryWaveContributorsPage({
        category,
        sort,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
  });

  const waveRows = useMemo(
    () =>
      wavesQuery.data?.pages.flatMap((page) =>
        page.data.map((item, index) => ({
          item,
          rank: (page.page - 1) * GLOBAL_REP_CATEGORY_PAGE_SIZE + index + 1,
        }))
      ) ?? [],
    [wavesQuery.data?.pages]
  );

  const contributorRows = useMemo(
    () =>
      contributorsQuery.data?.pages.flatMap((page) =>
        page.data.map((item, index) => ({
          item,
          rank: (page.page - 1) * GLOBAL_REP_CATEGORY_PAGE_SIZE + index + 1,
        }))
      ) ?? [],
    [contributorsQuery.data?.pages]
  );

  const activeQuery = activeTab === "waves" ? wavesQuery : contributorsQuery;
  const loadMoreActiveRows = () => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage().catch(() => undefined);
    }
  };

  if (overviewQuery.isPending) {
    return (
      <output
        aria-label="Loading Wave REP category overview"
        className="tw-flex tw-justify-center tw-py-12"
      >
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </output>
    );
  }

  if (overviewQuery.isError) {
    return (
      <StateBlock
        title="Could not load Wave REP"
        message={getErrorMessage(
          overviewQuery.error,
          "Wave REP for this category failed to load."
        )}
        onRetry={() => {
          overviewQuery.refetch().catch(() => undefined);
        }}
      />
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="tw-flex tw-flex-col tw-gap-5">
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
        <WaveMetric label="Wave REP" value={overview.total_rep} />
        <WaveMetric label="Waves" value={overview.wave_count} />
        <WaveMetric label="Contributors" value={overview.contributor_count} />
      </div>
      <WaveRepLoadedContent
        activeTab={activeTab}
        category={category}
        contributorRows={contributorRows}
        loadMoreActiveRows={loadMoreActiveRows}
        onSortChange={setSort}
        overview={overview}
        rowsError={activeQuery.error}
        rowsIsError={activeQuery.isError}
        rowsIsFetchingNextPage={activeQuery.isFetchingNextPage}
        rowsIsPending={activeQuery.isPending}
        rowsHasNextPage={activeQuery.hasNextPage}
        rowsRetry={() => {
          activeQuery.refetch().catch(() => undefined);
        }}
        sort={sort}
        setActiveTab={setActiveTab}
        waveRows={waveRows}
      />
    </div>
  );
}
