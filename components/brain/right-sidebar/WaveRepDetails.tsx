"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ProfileActivityLogRatingEdit } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveRepCategoriesPage } from "@/generated/models/ApiWaveRepCategoriesPage";
import type { ApiWaveRepCategory } from "@/generated/models/ApiWaveRepCategory";
import type { ApiWaveRepContributor } from "@/generated/models/ApiWaveRepContributor";
import type { ApiWaveRepContributorsPage } from "@/generated/models/ApiWaveRepContributorsPage";
import type { ApiWaveRepOverview } from "@/generated/models/ApiWaveRepOverview";
import type { CountlessPage } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { ProfileActivityLogType, RateMatter } from "@/types/enums";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CategorySearch,
  CategoryRow,
  ContributorRow,
  LogRow,
  SummaryStat,
  detailText,
  formatSignedRep,
  getContributorCountLabel,
  getRepTextClass,
} from "./WaveRepDetailsComponents";

const CONTRIBUTOR_PAGE_SIZE = 50;
const CATEGORY_PAGE_SIZE = 100;
const LOG_PAGE_SIZE = 20;
const STALE_TIME_MS = 60_000;
const RETRY_ACTION_MESSAGE_KEY = "waves.rep.details.actions.retry";

type RepDetailView = "contributors" | "activity";

interface WaveRepContributorPage {
  readonly data: ApiWaveRepContributor[];
  readonly page: number;
  readonly next: boolean;
  readonly overview?: ApiWaveRepOverview | undefined;
}

interface WaveRepDetailsProps {
  readonly wave: ApiWave;
}

function runQueryAction(action: () => Promise<unknown>): void {
  action().catch(() => undefined);
}

async function fetchContributorPage({
  waveId,
  category,
  pageParam,
}: {
  readonly waveId: string;
  readonly category: string | null;
  readonly pageParam: number;
}): Promise<WaveRepContributorPage> {
  if (category) {
    const contributors = await commonApiFetch<ApiWaveRepContributorsPage>({
      endpoint: `waves/${waveId}/rep/categories/${encodeURIComponent(
        category
      )}/contributors`,
      params: {
        page: pageParam.toString(),
        page_size: CONTRIBUTOR_PAGE_SIZE.toString(),
      },
    });

    return {
      data: contributors.data,
      page: contributors.page,
      next: contributors.next,
    };
  }

  const overview = await commonApiFetch<ApiWaveRepOverview>({
    endpoint: `waves/${waveId}/rep/overview`,
    params: {
      page: pageParam.toString(),
      page_size: CONTRIBUTOR_PAGE_SIZE.toString(),
    },
  });

  return {
    data: overview.contributors.data,
    page: overview.contributors.page,
    next: overview.contributors.next,
    overview,
  };
}

async function fetchCategoryPage({
  waveId,
  pageParam,
}: {
  readonly waveId: string;
  readonly pageParam: number;
}): Promise<ApiWaveRepCategoriesPage> {
  return await commonApiFetch<ApiWaveRepCategoriesPage>({
    endpoint: `waves/${waveId}/rep/categories`,
    params: {
      page: pageParam.toString(),
      page_size: CATEGORY_PAGE_SIZE.toString(),
    },
  });
}

async function fetchLogPage({
  waveId,
  pageParam,
}: {
  readonly waveId: string;
  readonly pageParam: number;
}): Promise<CountlessPage<ProfileActivityLogRatingEdit>> {
  return await commonApiFetch<CountlessPage<ProfileActivityLogRatingEdit>>({
    endpoint: "profile-logs",
    params: {
      page: pageParam.toString(),
      page_size: LOG_PAGE_SIZE.toString(),
      target: waveId,
      log_type: ProfileActivityLogType.RATING_EDIT,
      rating_matter: RateMatter.WAVE_REP,
    },
  });
}

export default function WaveRepDetails({ wave }: WaveRepDetailsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [activeView, setActiveView] = useState<RepDetailView>("contributors");

  const categoriesQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVE_REP_CATEGORIES, { waveId: wave.id }],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchCategoryPage({
        waveId: wave.id,
        pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ApiWaveRepCategoriesPage | undefined) =>
      lastPage?.next ? lastPage.page + 1 : undefined,
    staleTime: STALE_TIME_MS,
    ...getDefaultQueryRetry(),
  });

  const contributorsQuery = useInfiniteQuery({
    queryKey: [
      selectedCategory
        ? QueryKey.WAVE_REP_CATEGORY_CONTRIBUTORS
        : QueryKey.WAVE_REP_OVERVIEW,
      { waveId: wave.id, category: selectedCategory },
    ],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchContributorPage({
        waveId: wave.id,
        category: selectedCategory,
        pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: WaveRepContributorPage | undefined) =>
      lastPage?.next ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_MS,
    ...getDefaultQueryRetry(),
  });

  const logsQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVE_REP_LOGS, { waveId: wave.id }],
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchLogPage({
        waveId: wave.id,
        pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: CountlessPage<ProfileActivityLogRatingEdit> | undefined
    ) => (lastPage?.next ? lastPage.page + 1 : undefined),
    enabled: activeView === "activity",
    staleTime: STALE_TIME_MS,
    ...getDefaultQueryRetry(),
  });

  const categories = useMemo(
    () => categoriesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [categoriesQuery.data?.pages]
  );
  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const categoryLoadMoreMessageKey =
    normalizedCategorySearch.length > 0
      ? "waves.rep.details.categories.searchMore"
      : "waves.rep.details.categories.loadMore";
  const filteredCategories = useMemo(
    () =>
      normalizedCategorySearch.length === 0
        ? categories
        : categories.filter((category) =>
            category.category.toLowerCase().includes(normalizedCategorySearch)
          ),
    [categories, normalizedCategorySearch]
  );
  const contributors = useMemo(
    () => contributorsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [contributorsQuery.data?.pages]
  );
  const logs = useMemo(
    () => logsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [logsQuery.data?.pages]
  );

  const overview = contributorsQuery.data?.pages[0]?.overview;
  const summary = {
    totalRep: overview?.total_rep ?? wave.wave_rep?.total_rep ?? 0,
    positiveRep: overview?.positive_rep ?? wave.wave_rep?.positive_rep ?? 0,
    negativeRep: overview?.negative_rep ?? wave.wave_rep?.negative_rep ?? 0,
    contributorCount:
      overview?.contributor_count ?? wave.wave_rep?.contributor_count ?? 0,
    authenticatedUserContribution:
      overview?.authenticated_user_contribution ??
      wave.wave_rep?.authenticated_user_contribution ??
      null,
  };
  const retryContributors = () => {
    runQueryAction(() => contributorsQuery.refetch());
  };

  const fetchNextContributorsPage = () => {
    runQueryAction(() => contributorsQuery.fetchNextPage());
  };

  const fetchNextCategoriesPage = () => {
    runQueryAction(() => categoriesQuery.fetchNextPage());
  };

  const retryCategories = () => {
    runQueryAction(() => categoriesQuery.refetch());
  };

  const fetchNextLogsPage = () => {
    runQueryAction(() => logsQuery.fetchNextPage());
  };

  const retryLogs = () => {
    runQueryAction(() => logsQuery.refetch());
  };

  const clearSelectedCategory = () => {
    setSelectedCategory(null);
  };

  const selectCategory = (category: ApiWaveRepCategory) => {
    setSelectedCategory(category.category);
    setActiveView("contributors");
  };

  const showActivity = () => {
    clearSelectedCategory();
    setActiveView("activity");
  };

  const selectedCategoryDetails =
    categories.find((category) => category.category === selectedCategory) ??
    null;
  const contributorHeading = selectedCategory
    ? detailText("waves.rep.details.contributors.heading.category", {
        category: selectedCategory,
      })
    : detailText("waves.rep.details.contributors.heading.all");
  const contributorDescription = selectedCategoryDetails
    ? detailText("waves.rep.details.contributors.description.category", {
        contributors: getContributorCountLabel(
          selectedCategoryDetails.contributor_count
        ),
        rep: formatSignedRep(selectedCategoryDetails.total_rep),
      })
    : detailText("waves.rep.details.contributors.description.all", {
        contributors: getContributorCountLabel(summary.contributorCount),
      });
  const isShowingPreviousContributors = contributorsQuery.isPlaceholderData;

  return (
    <div className="tw-flex tw-min-h-full tw-flex-col tw-gap-4 tw-p-4 tw-@container/rep">
      <section aria-label={detailText("waves.rep.details.summary.title")}>
        <div className="tw-overflow-hidden tw-border-x-0 tw-border-y tw-border-solid tw-border-white/5">
          <div className="tw-flex tw-items-end tw-justify-between tw-gap-4 tw-px-2 tw-py-2.5">
            <div className="tw-min-w-0">
              <p className="tw-mb-1 tw-text-[0.625rem] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-iron-500 sm:tw-tracking-[0.1em]">
                {detailText("waves.rep.details.summary.total")}
              </p>
              <p
                className={`tw-mb-0 tw-text-xl tw-font-semibold tw-tabular-nums tw-leading-none ${getRepTextClass(
                  summary.totalRep
                )}`}
              >
                {formatSignedRep(summary.totalRep)}
              </p>
            </div>
            <span className="tw-max-w-32 tw-text-right tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500">
              {getContributorCountLabel(summary.contributorCount)}
            </span>
          </div>
          <div className="tw-grid tw-grid-cols-1 tw-gap-px tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-white/5 @[18rem]/rep:tw-grid-cols-3">
            <SummaryStat
              label={detailText("waves.rep.details.summary.yourRep")}
              value={
                summary.authenticatedUserContribution === null
                  ? "-"
                  : formatSignedRep(summary.authenticatedUserContribution)
              }
              toneClassName={getRepTextClass(
                summary.authenticatedUserContribution ?? 0
              )}
            />
            <SummaryStat
              label={detailText("waves.rep.details.summary.positive")}
              value={formatSignedRep(summary.positiveRep)}
              toneClassName={getRepTextClass(summary.positiveRep)}
            />
            <SummaryStat
              label={detailText("waves.rep.details.summary.negative")}
              value={formatSignedRep(summary.negativeRep)}
              toneClassName={getRepTextClass(summary.negativeRep)}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="wave-rep-categories-heading">
        <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <h2
            id="wave-rep-categories-heading"
            className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]"
          >
            {detailText("waves.rep.details.categories.title")}
          </h2>
          {categoriesQuery.isPending && (
            <span className="tw-text-xs tw-font-medium tw-text-iron-500">
              {detailText("waves.rep.details.categories.loading")}
            </span>
          )}
        </div>
        <CategorySearch value={categorySearch} onChange={setCategorySearch} />
        <div className="tw-mt-2 tw-divide-y tw-divide-solid tw-divide-white/5 tw-overflow-hidden tw-border-x-0 tw-border-y tw-border-solid tw-border-white/5">
          <CategoryRow
            label={detailText("waves.rep.details.categories.all")}
            totalRep={summary.totalRep}
            contributorCount={summary.contributorCount}
            selected={selectedCategory === null}
            ariaLabel={detailText("waves.rep.details.categories.allAriaLabel", {
              rep: formatSignedRep(summary.totalRep),
              contributors: getContributorCountLabel(summary.contributorCount),
            })}
            onClick={clearSelectedCategory}
          />
          {filteredCategories.map((category) => (
            <CategoryRow
              key={category.category}
              label={category.category}
              totalRep={category.total_rep}
              contributorCount={category.contributor_count}
              selected={selectedCategory === category.category}
              ariaLabel={detailText(
                "waves.rep.details.categories.categoryAriaLabel",
                {
                  category: category.category,
                  rep: formatSignedRep(category.total_rep),
                  contributors: getContributorCountLabel(
                    category.contributor_count
                  ),
                }
              )}
              onClick={() => selectCategory(category)}
            />
          ))}
          {normalizedCategorySearch.length > 0 &&
            filteredCategories.length === 0 &&
            categoriesQuery.status === "success" &&
            !categoriesQuery.hasNextPage &&
            !categoriesQuery.isFetchingNextPage && (
              <p className="tw-mb-0 tw-px-2.5 tw-py-3 tw-text-xs tw-font-medium tw-text-iron-500">
                {detailText("waves.rep.details.categories.noMatches")}
              </p>
            )}
        </div>

        {categoriesQuery.status === "success" && categories.length === 0 && (
          <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-text-iron-500">
            {detailText("waves.rep.details.categories.empty")}
          </p>
        )}

        {categoriesQuery.isLoadingError && (
          <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-rose-400/15 tw-bg-rose-400/[0.03] tw-px-3 tw-py-3">
            <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
              {detailText("waves.rep.details.categories.error")}
            </p>
            <button
              type="button"
              onClick={retryCategories}
              className="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-text-iron-300"
            >
              {detailText(RETRY_ACTION_MESSAGE_KEY)}
            </button>
          </div>
        )}

        {(categoriesQuery.hasNextPage ||
          categoriesQuery.isFetchingNextPage ||
          categoriesQuery.isFetchNextPageError) && (
          <div className="tw-mt-3">
            {categoriesQuery.isFetchNextPageError && (
              <p className="tw-mb-2 tw-text-xs tw-text-rose-300">
                {detailText("waves.rep.details.categories.loadMoreError")}
              </p>
            )}
            <button
              type="button"
              onClick={fetchNextCategoriesPage}
              disabled={categoriesQuery.isFetchingNextPage}
              className="tw-w-full tw-cursor-pointer tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-border-white/20 hover:tw-bg-white/[0.05] disabled:tw-cursor-wait disabled:tw-opacity-60"
            >
              {categoriesQuery.isFetchingNextPage
                ? detailText("waves.rep.details.categories.loadingMore")
                : detailText(categoryLoadMoreMessageKey)}
            </button>
          </div>
        )}
      </section>

      <div className="tw-sticky tw-top-0 tw-z-20 tw-flex tw-flex-col tw-bg-iron-950/95 tw-py-2 tw-backdrop-blur">
        <fieldset className="tw-m-0 tw-grid tw-min-w-0 tw-grid-cols-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-p-0">
          <legend className="tw-sr-only">
            {detailText("waves.rep.details.view.ariaLabel")}
          </legend>
          <button
            type="button"
            aria-pressed={activeView === "contributors"}
            onClick={() => setActiveView("contributors")}
            className={`tw-cursor-pointer tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-3 tw-py-2 !tw-text-sm tw-font-medium tw-transition ${
              activeView === "contributors"
                ? "tw-border-primary-300/60 tw-text-iron-100"
                : "tw-border-transparent tw-text-iron-500 hover:tw-text-iron-300"
            }`}
          >
            {detailText("waves.rep.details.view.contributors")}
          </button>
          <button
            type="button"
            aria-pressed={activeView === "activity"}
            onClick={showActivity}
            className={`tw-cursor-pointer tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-3 tw-py-2 !tw-text-sm tw-font-medium tw-transition ${
              activeView === "activity"
                ? "tw-border-primary-300/60 tw-text-iron-100"
                : "tw-border-transparent tw-text-iron-500 hover:tw-text-iron-300"
            }`}
          >
            {detailText("waves.rep.details.view.activity")}
          </button>
        </fieldset>
      </div>

      {activeView === "contributors" && (
        <section aria-labelledby="wave-rep-contributors-heading">
          <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
            <div className="tw-min-w-0">
              <h2
                id="wave-rep-contributors-heading"
                className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]"
              >
                {contributorHeading}
              </h2>
              <p className="tw-mb-0 tw-mt-0.5 tw-truncate tw-text-xs tw-text-iron-500">
                {contributorDescription}
              </p>
            </div>
            {contributorsQuery.isPending && !isShowingPreviousContributors && (
              <CircleLoader size={CircleLoaderSize.MEDIUM} />
            )}
          </div>

          {contributorsQuery.isLoadingError && (
            <div className="tw-rounded-lg tw-border tw-border-solid tw-border-rose-400/20 tw-bg-rose-400/5 tw-p-3">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                {detailText("waves.rep.details.contributors.error")}
              </p>
              <button
                type="button"
                onClick={retryContributors}
                className="tw-mt-3 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-border-white/15 hover:tw-bg-white/[0.06]"
              >
                {detailText(RETRY_ACTION_MESSAGE_KEY)}
              </button>
            </div>
          )}

          {isShowingPreviousContributors && (
            <div className="tw-flex tw-justify-center tw-py-6">
              <CircleLoader size={CircleLoaderSize.MEDIUM} />
            </div>
          )}

          {contributorsQuery.status === "success" &&
            !isShowingPreviousContributors &&
            contributors.length === 0 && (
              <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-p-4">
                <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                  {selectedCategory
                    ? detailText(
                        "waves.rep.details.contributors.empty.category",
                        { category: selectedCategory }
                      )
                    : detailText("waves.rep.details.contributors.empty.all")}
                </p>
              </div>
            )}

          {!isShowingPreviousContributors && contributors.length > 0 && (
            <div className="tw-flex tw-flex-col">
              {contributors.map((contributor) => (
                <ContributorRow
                  key={`${contributor.profile.id}-${selectedCategory ?? "all"}`}
                  contributor={contributor}
                />
              ))}

              {contributorsQuery.isFetchingNextPage && (
                <div className="tw-flex tw-justify-center tw-py-3">
                  <CircleLoader size={CircleLoaderSize.MEDIUM} />
                </div>
              )}

              {contributorsQuery.isFetchNextPageError && (
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-rose-400/15 tw-bg-rose-400/[0.03] tw-px-3 tw-py-3">
                  <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
                    {detailText("waves.rep.details.contributors.loadMoreError")}
                  </p>
                  <button
                    type="button"
                    onClick={fetchNextContributorsPage}
                    className="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-text-iron-300"
                  >
                    {detailText(RETRY_ACTION_MESSAGE_KEY)}
                  </button>
                </div>
              )}

              {(contributorsQuery.hasNextPage ||
                contributorsQuery.isFetchingNextPage) && (
                <button
                  type="button"
                  onClick={fetchNextContributorsPage}
                  disabled={contributorsQuery.isFetchingNextPage}
                  className="tw-w-full tw-cursor-pointer tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-border-white/20 hover:tw-bg-white/[0.05] disabled:tw-cursor-wait disabled:tw-opacity-60"
                >
                  {contributorsQuery.isFetchingNextPage
                    ? detailText("waves.rep.details.contributors.loadingMore")
                    : detailText("waves.rep.details.contributors.loadMore")}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {activeView === "activity" && (
        <section aria-labelledby="wave-rep-activity-heading">
          <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
            <div>
              <h2
                id="wave-rep-activity-heading"
                className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]"
              >
                {detailText("waves.rep.details.activity.title")}
              </h2>
              <p className="tw-mb-0 tw-mt-0.5 tw-text-xs tw-text-iron-500">
                {detailText("waves.rep.details.activity.description")}
              </p>
            </div>
            {logsQuery.isPending && (
              <CircleLoader size={CircleLoaderSize.MEDIUM} />
            )}
          </div>

          {logsQuery.isLoadingError && (
            <div className="tw-rounded-lg tw-border tw-border-solid tw-border-rose-400/20 tw-bg-rose-400/5 tw-p-3">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                {detailText("waves.rep.details.activity.error")}
              </p>
              <button
                type="button"
                onClick={retryLogs}
                className="tw-mt-3 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-border-white/15 hover:tw-bg-white/[0.06]"
              >
                {detailText(RETRY_ACTION_MESSAGE_KEY)}
              </button>
            </div>
          )}

          {logsQuery.status === "success" && logs.length === 0 && (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              {detailText("waves.rep.details.activity.empty")}
            </p>
          )}

          {logs.length > 0 && (
            <div className="tw-flex tw-flex-col">
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}

              {logsQuery.isFetchingNextPage && (
                <div className="tw-flex tw-justify-center tw-py-3">
                  <CircleLoader size={CircleLoaderSize.MEDIUM} />
                </div>
              )}

              {logsQuery.isFetchNextPageError && (
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-rose-400/15 tw-bg-rose-400/[0.03] tw-px-3 tw-py-3">
                  <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
                    {detailText("waves.rep.details.activity.loadMoreError")}
                  </p>
                  <button
                    type="button"
                    onClick={fetchNextLogsPage}
                    className="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-text-iron-300"
                  >
                    {detailText(RETRY_ACTION_MESSAGE_KEY)}
                  </button>
                </div>
              )}

              {(logsQuery.hasNextPage || logsQuery.isFetchingNextPage) && (
                <button
                  type="button"
                  onClick={fetchNextLogsPage}
                  disabled={logsQuery.isFetchingNextPage}
                  className="tw-w-full tw-cursor-pointer tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-border-white/20 hover:tw-bg-white/[0.05] disabled:tw-cursor-wait disabled:tw-opacity-60"
                >
                  {logsQuery.isFetchingNextPage
                    ? detailText("waves.rep.details.activity.loadingMore")
                    : detailText("waves.rep.details.activity.loadMore")}
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
