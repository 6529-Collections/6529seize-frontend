"use client";

import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiGlobalRepCategoryWave } from "@/generated/models/ApiGlobalRepCategoryWave";
import type { ApiGlobalRepCategoryWaveContributor } from "@/generated/models/ApiGlobalRepCategoryWaveContributor";
import type { ApiGlobalRepCategoryWaveOverview } from "@/generated/models/ApiGlobalRepCategoryWaveOverview";
import type { ApiGlobalRepCategoryWaveRef } from "@/generated/models/ApiGlobalRepCategoryWaveRef";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  getProfileAvatarFallback,
  getProfileDisplay,
  getProfileHref,
  getProfileTooltipUser,
  type GlobalRepCategorySort,
} from "./globalRepCategory.helpers";
import {
  getErrorMessage,
  LoadMoreSentinel,
  MetricTile,
  StateBlock,
} from "./RepCategoryUi";

type WaveRepTab = "waves" | "contributors";
const REP_CATEGORY_LOCALE = DEFAULT_LOCALE;

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
  readonly labelKey: MessageKey;
}> = [
  { id: "waves", labelKey: "rep.categories.wave.tabs.waves" },
  {
    id: "contributors",
    labelKey: "rep.categories.wave.tabs.contributors",
  },
];

const WAVE_REP_SORTS: ReadonlyArray<{
  readonly id: GlobalRepCategorySort;
  readonly labelKey: MessageKey;
}> = [
  { id: "rep_desc", labelKey: "rep.categories.wave.sort.repDesc" },
  { id: "rep_asc", labelKey: "rep.categories.wave.sort.repAsc" },
  { id: "recent", labelKey: "rep.categories.wave.sort.recent" },
];

function WaveAvatar({ wave }: { readonly wave: ApiGlobalRepCategoryWaveRef }) {
  return (
    <span className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
      {wave.pfp ? (
        <Image
          unoptimized
          src={getScaledImageUri(wave.pfp, ImageScale.W_AUTO_H_50)}
          alt={`${wave.name} wave`}
          width={32}
          height={32}
          className="tw-h-full tw-w-full tw-object-cover"
        />
      ) : (
        <span className="tw-text-[0.6875rem] tw-font-semibold tw-text-iron-300">
          {wave.name.trim().charAt(0).toUpperCase() || "W"}
        </span>
      )}
    </span>
  );
}

function ContributorAvatar({
  contributor,
}: {
  readonly contributor: ApiGlobalRepCategoryWaveContributor;
}) {
  const display = getProfileDisplay(contributor.profile);

  return (
    <span className="tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
      {contributor.profile.pfp ? (
        <Image
          unoptimized
          src={getScaledImageUri(
            contributor.profile.pfp,
            ImageScale.W_AUTO_H_50
          )}
          alt={`${display} profile`}
          width={28}
          height={28}
          className="tw-h-full tw-w-full tw-object-cover"
        />
      ) : (
        <span className="tw-text-[0.625rem] tw-font-semibold tw-text-iron-300">
          {getProfileAvatarFallback(contributor.profile)}
        </span>
      )}
    </span>
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
      className="rep-category-wave-link tw-text-primary-200 hover:tw-text-primary-100 tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2 tw-break-words tw-font-semibold tw-no-underline"
    >
      <WaveAvatar wave={wave} />
      <span className="tw-min-w-0 tw-break-words">{wave.name}</span>
    </Link>
  );
}

function ContributorLink({
  contributor,
}: {
  readonly contributor: ApiGlobalRepCategoryWaveContributor;
}) {
  return (
    <UserProfileTooltipWrapper
      user={getProfileTooltipUser(contributor.profile)}
    >
      <Link
        href={getProfileHref(contributor.profile)}
        prefetch={false}
        className="rep-category-profile hover:tw-text-primary-200 tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline"
      >
        <ContributorAvatar contributor={contributor} />
        <span className="tw-min-w-0 tw-break-words">
          {getProfileDisplay(contributor.profile)}
        </span>
      </Link>
    </UserProfileTooltipWrapper>
  );
}

function TopContributors({
  contributors,
}: {
  readonly contributors: ApiGlobalRepCategoryWaveContributor[];
}) {
  if (contributors.length === 0) {
    return (
      <span className="tw-text-sm tw-text-iron-500">
        {t(REP_CATEGORY_LOCALE, "rep.categories.wave.empty.contributors")}
      </span>
    );
  }

  return (
    <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
      {contributors.map((contributor) => (
        <li
          key={`${contributor.wave.id}-${contributor.profile.id}-${contributor.contribution}`}
          className="tw-rounded-full tw-bg-white/[0.04] tw-px-2.5 tw-py-1 tw-text-xs tw-text-iron-200"
        >
          <ContributorLink contributor={contributor} />
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
    <tr className="rep-category-table-row tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/5 last:tw-border-b-0">
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-500">
        {rank}
      </td>
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
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-400">
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
    <tr className="rep-category-table-row tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/5 last:tw-border-b-0">
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-500">
        {rank}
      </td>
      <td className="tw-px-4 tw-py-3">
        <ContributorLink contributor={item} />
      </td>
      <td className="tw-px-4 tw-py-3">
        <WaveLink wave={item.wave} />
      </td>
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-semibold tw-text-iron-100">
        {formatNumberWithCommas(item.contribution)}
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-400">
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
    <div className="rep-category-table-frame tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
      <table className="rep-category-table tw-w-full tw-min-w-[54rem] tw-border-collapse tw-bg-white/[0.02] tw-text-left">
        <caption className="tw-sr-only">
          {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.wavesCaption", {
            category,
          })}
        </caption>
        <thead className="rep-category-table-head tw-bg-white/[0.04] tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          <tr>
            <th scope="col" className="tw-w-16 tw-px-4 tw-py-3 tw-text-right">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.rank")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.wave")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.rep")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.contributors")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              {t(
                REP_CATEGORY_LOCALE,
                "rep.categories.wave.table.leadingContributors"
              )}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.lastModified")}
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
    <div className="rep-category-table-frame tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
      <table className="rep-category-table tw-w-full tw-min-w-[44rem] tw-border-collapse tw-bg-white/[0.02] tw-text-left">
        <caption className="tw-sr-only">
          {t(
            REP_CATEGORY_LOCALE,
            "rep.categories.wave.table.contributorsCaption",
            { category }
          )}
        </caption>
        <thead className="rep-category-table-head tw-bg-white/[0.04] tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          <tr>
            <th scope="col" className="tw-w-16 tw-px-4 tw-py-3 tw-text-right">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.rank")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.contributor")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.wave")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.rep")}
            </th>
            <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
              {t(REP_CATEGORY_LOCALE, "rep.categories.wave.table.lastModified")}
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
      className="rep-category-sort tw-inline-flex tw-flex-wrap tw-gap-2"
      aria-label={t(REP_CATEGORY_LOCALE, "rep.categories.wave.sort.label")}
    >
      {WAVE_REP_SORTS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={sort === option.id}
          onClick={() => onSortChange(option.id)}
          className={`rep-category-sort-button tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-transition-colors ${
            sort === option.id
              ? "tw-text-primary-200 tw-border-primary-400/50 tw-bg-primary-500/15"
              : "tw-border-white/10 tw-bg-white/[0.03] tw-text-iron-400 hover:tw-border-white/20 hover:tw-text-iron-200"
          }`}
        >
          {t(REP_CATEGORY_LOCALE, option.labelKey)}
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
        aria-label={t(REP_CATEGORY_LOCALE, "rep.categories.wave.loading.rows", {
          tab: t(
            REP_CATEGORY_LOCALE,
            activeTab === "waves"
              ? "rep.categories.wave.tabs.waves"
              : "rep.categories.wave.tabs.contributors"
          ),
        })}
        className="tw-flex tw-justify-center tw-py-8"
      >
        <CircleLoader size={CircleLoaderSize.LARGE} />
      </output>
    );
  }

  if (isError) {
    return (
      <StateBlock
        title={t(REP_CATEGORY_LOCALE, "rep.categories.wave.error.rowsTitle")}
        message={getErrorMessage(
          error,
          t(REP_CATEGORY_LOCALE, "rep.categories.wave.error.rowsMessage")
        )}
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
        title={t(REP_CATEGORY_LOCALE, "rep.categories.wave.empty.title")}
        message={t(REP_CATEGORY_LOCALE, "rep.categories.wave.empty.message")}
      />
    );
  }

  return (
    <>
      <div className="rep-category-preview-grid tw-grid tw-grid-cols-1 tw-gap-5 lg:tw-grid-cols-2">
        <section className="rep-category-preview-section">
          <h3 className="rep-category-preview-title tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
            {t(REP_CATEGORY_LOCALE, "rep.categories.wave.preview.waves")}
          </h3>
          <div className="rep-category-preview-list tw-flex tw-flex-col tw-gap-2">
            {overview.top_waves.map((wave) => (
              <div
                key={wave.wave.id}
                className="rep-category-preview-row tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5"
              >
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                  <WaveLink wave={wave.wave} />
                  <span className="rep-category-preview-value tw-flex-shrink-0 tw-text-sm tw-font-semibold tw-text-iron-200">
                    {formatNumberWithCommas(wave.total_rep)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rep-category-preview-section">
          <h3 className="rep-category-preview-title tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
            {t(REP_CATEGORY_LOCALE, "rep.categories.wave.preview.contributors")}
          </h3>
          <div className="rep-category-preview-list tw-flex tw-flex-col tw-gap-2">
            {overview.top_contributors.map((contributor) => (
              <div
                key={`${contributor.wave.id}-${contributor.profile.id}`}
                className="rep-category-preview-row tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5"
              >
                <div className="tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:tw-items-center">
                  <ContributorLink contributor={contributor} />
                  <WaveLink wave={contributor.wave} />
                  <span className="rep-category-preview-value tw-text-sm tw-font-semibold tw-text-iron-200">
                    {formatNumberWithCommas(contributor.contribution)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="rep-category-wave-controls tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-2">
        <div
          aria-label={t(
            REP_CATEGORY_LOCALE,
            "rep.categories.wave.sections.label"
          )}
          className="rep-category-section-tabs tw-flex tw-gap-2"
        >
          {WAVE_REP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rep-category-section-tab tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition-colors ${
                activeTab === tab.id
                  ? "tw-border-white/20 tw-bg-white/10 tw-text-white"
                  : "tw-border-transparent tw-bg-transparent tw-text-iron-400 hover:tw-bg-white/[0.05] hover:tw-text-iron-200"
              }`}
            >
              {t(REP_CATEGORY_LOCALE, tab.labelKey)}
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
            className="rep-category-load-more tw-self-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] disabled:tw-cursor-default disabled:tw-opacity-70"
          >
            {rowsIsFetchingNextPage
              ? t(REP_CATEGORY_LOCALE, "rep.categories.wave.loadingMore")
              : t(REP_CATEGORY_LOCALE, "rep.categories.wave.loadMore")}
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
  const { activeProfileProxy, connectedProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<WaveRepTab>("waves");
  const [sort, setSort] = useState<GlobalRepCategorySort>("rep_desc");
  const visibilityScope = useMemo(
    () => ({
      viewerProfileId: connectedProfile?.id ?? null,
      proxyId: activeProfileProxy?.id ?? null,
      proxyCanReadWave:
        activeProfileProxy?.actions.some(
          (action) => action.action_type === ApiProfileProxyActionType.ReadWave
        ) ?? false,
    }),
    [activeProfileProxy, connectedProfile?.id]
  );

  const overviewQuery = useQuery({
    queryKey: getGlobalRepCategoryWaveOverviewQueryKey({
      category,
      visibilityScope,
    }),
    queryFn: async () => await fetchGlobalRepCategoryWaveOverview(category),
  });

  const wavesQuery = useInfiniteQuery({
    queryKey: getGlobalRepCategoryWavesPageQueryKey({
      category,
      sort,
      visibilityScope,
    }),
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
      visibilityScope,
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
        aria-label={t(
          REP_CATEGORY_LOCALE,
          "rep.categories.wave.loading.overview"
        )}
        className="tw-flex tw-justify-center tw-py-12"
      >
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </output>
    );
  }

  if (overviewQuery.isError) {
    return (
      <StateBlock
        title={t(
          REP_CATEGORY_LOCALE,
          "rep.categories.wave.error.overviewTitle"
        )}
        message={getErrorMessage(
          overviewQuery.error,
          t(REP_CATEGORY_LOCALE, "rep.categories.wave.error.overviewMessage")
        )}
        onRetry={() => {
          overviewQuery.refetch().catch(() => undefined);
        }}
      />
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="rep-category-wave-content tw-flex tw-flex-col tw-gap-5">
      <div className="rep-category-metrics rep-category-wave-metrics tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3">
        <MetricTile
          label={t(REP_CATEGORY_LOCALE, "rep.categories.wave.metrics.rep")}
          value={overview.total_rep}
        />
        <MetricTile
          label={t(REP_CATEGORY_LOCALE, "rep.categories.wave.metrics.waves")}
          value={overview.wave_count}
        />
        <MetricTile
          label={t(
            REP_CATEGORY_LOCALE,
            "rep.categories.wave.metrics.contributors"
          )}
          value={overview.contributor_count}
        />
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
