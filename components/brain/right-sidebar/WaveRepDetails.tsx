"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ProfileActivityLogRatingEdit } from "@/entities/IProfile";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveRepCategoriesPage } from "@/generated/models/ApiWaveRepCategoriesPage";
import type { ApiWaveRepCategory } from "@/generated/models/ApiWaveRepCategory";
import type { ApiWaveRepContributor } from "@/generated/models/ApiWaveRepContributor";
import type { ApiWaveRepContributorsPage } from "@/generated/models/ApiWaveRepContributorsPage";
import type { ApiWaveRepOverview } from "@/generated/models/ApiWaveRepOverview";
import { formatAddress, getTimeAgo } from "@/helpers/Helpers";
import type { CountlessPage } from "@/helpers/Types";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { ProfileActivityLogType, RateMatter } from "@/types/enums";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

const CONTRIBUTOR_PAGE_SIZE = 50;
const CATEGORY_PAGE_SIZE = 100;
const LOG_PAGE_SIZE = 20;
const STALE_TIME_MS = 60_000;
const WAVE_REP_DETAILS_LOCALE = DEFAULT_LOCALE;
const CHANGE_REASON_MESSAGE_KEYS: Record<string, MessageKey> = {
  LOST_TDH: "waves.rep.details.activity.reason.lostTdh",
};

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

function detailText(
  key: MessageKey,
  params: Record<string, string | number> = {}
): string {
  return t(WAVE_REP_DETAILS_LOCALE, key, params);
}

function formatRepNumber(value: number): string {
  return formatInteger(WAVE_REP_DETAILS_LOCALE, value);
}

function formatSignedRep(value: number): string {
  const formatted = formatRepNumber(value);
  return value > 0
    ? detailText("waves.rep.details.rep.positive", { value: formatted })
    : formatted;
}

function getContributorCountLabel(count: number): string {
  return detailText(
    count === 1
      ? "waves.rep.details.summary.contributors.one"
      : "waves.rep.details.summary.contributors.other",
    { count: formatInteger(WAVE_REP_DETAILS_LOCALE, count) }
  );
}

function getRepTextClass(value: number): string {
  if (value > 0) {
    return "tw-text-emerald-300";
  }
  if (value < 0) {
    return "tw-text-rose-300";
  }
  return "tw-text-iron-300";
}

function getProfileDisplay(profile: ApiProfileMin): string {
  const handle = profile.handle?.trim() ?? "";
  if (handle.length > 0) {
    return handle;
  }
  return formatAddress(profile.primary_address);
}

function getProfileHref(profile: ApiProfileMin): string {
  const handle = profile.handle?.trim() ?? "";
  const routeValue = handle.length > 0 ? handle : profile.primary_address;
  return `/${encodeURIComponent(routeValue.toLowerCase())}`;
}

function getFallbackInitial(display: string): string {
  return display.trim().charAt(0).toUpperCase() || "?";
}

function getVisibleReason(reason: string | null | undefined): string | null {
  const normalizedReason = reason?.trim();
  if (!normalizedReason) {
    return null;
  }
  const machineReason = normalizedReason.toUpperCase().replace(/\s+/g, "_");
  if (machineReason === "USER_EDIT") {
    return null;
  }
  const reasonMessageKey = CHANGE_REASON_MESSAGE_KEYS[machineReason];
  if (reasonMessageKey) {
    return detailText(reasonMessageKey);
  }
  return detailText("waves.rep.details.activity.reason.unknown", {
    reason: normalizedReason,
  });
}

function getCreatedAtLabel(createdAt: Date): string {
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }
  return getTimeAgo(timestamp);
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

function SummaryStat({
  label,
  value,
  toneClassName = "tw-text-white",
}: {
  readonly label: string;
  readonly value: string;
  readonly toneClassName?: string | undefined;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2">
      <p className="tw-mb-1 tw-text-[0.6875rem] tw-font-medium tw-uppercase tw-text-iron-500">
        {label}
      </p>
      <p className={`tw-mb-0 tw-text-sm tw-font-semibold ${toneClassName}`}>
        {value}
      </p>
    </div>
  );
}

function CategoryRow({
  label,
  totalRep,
  contributorCount,
  selected,
  ariaLabel,
  onClick,
}: {
  readonly label: string;
  readonly totalRep: number;
  readonly contributorCount: number;
  readonly selected: boolean;
  readonly ariaLabel: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      title={label}
      onClick={onClick}
      className={`tw-grid tw-min-h-[3.25rem] tw-w-full tw-cursor-pointer tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-3 tw-rounded-md tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-left tw-transition ${
        selected
          ? "tw-border-primary-400 tw-bg-primary-400/10"
          : "tw-border-white/10 tw-bg-white/[0.02] hover:tw-border-white/20 hover:tw-bg-white/[0.05]"
      }`}
    >
      <span className="tw-min-w-0">
        <span className="tw-block tw-break-words tw-text-xs tw-font-semibold tw-leading-snug tw-text-white">
          {label}
        </span>
        <span className="tw-mt-0.5 tw-block tw-text-[0.6875rem] tw-font-medium tw-text-iron-500">
          {getContributorCountLabel(contributorCount)}
        </span>
      </span>
      <span
        className={`tw-whitespace-nowrap tw-text-xs tw-font-semibold ${getRepTextClass(
          totalRep
        )}`}
      >
        {formatSignedRep(totalRep)}
      </span>
    </button>
  );
}

function ContributorRow({
  contributor,
}: {
  readonly contributor: ApiWaveRepContributor;
}) {
  const display = getProfileDisplay(contributor.profile);
  const contributionClass = getRepTextClass(contributor.contribution);

  return (
    <Link
      href={getProfileHref(contributor.profile)}
      className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5 tw-no-underline tw-transition hover:tw-border-white/15 hover:tw-bg-white/[0.04]"
    >
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
        <ProfileAvatar
          pfpUrl={contributor.profile.pfp}
          size={ProfileBadgeSize.COMPACT}
          alt={detailText("waves.rep.details.profileAvatarAlt", {
            profile: display,
          })}
          fallbackContent={
            <span className="tw-text-[0.6875rem] tw-font-semibold tw-text-iron-300">
              {getFallbackInitial(display)}
            </span>
          }
        />
        <p className="tw-mb-0 tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-white">
          {display}
        </p>
      </div>
      <span
        className={`tw-flex-shrink-0 tw-text-sm tw-font-semibold ${contributionClass}`}
      >
        {formatSignedRep(contributor.contribution)}
      </span>
    </Link>
  );
}

function LogRow({ log }: { readonly log: ProfileActivityLogRatingEdit }) {
  const change = log.contents.new_rating - log.contents.old_rating;
  const changeClass = getRepTextClass(change);
  const oldRatingClass = getRepTextClass(log.contents.old_rating);
  const newRatingClass = getRepTextClass(log.contents.new_rating);
  const raterHandle = log.profile_handle?.trim();
  const rater =
    raterHandle || detailText("waves.rep.details.activity.unknownRater");
  const raterHref = raterHandle
    ? `/${encodeURIComponent(raterHandle.toLowerCase())}`
    : null;
  const createdAtLabel = getCreatedAtLabel(log.created_at);
  const visibleReason = getVisibleReason(log.contents.change_reason);

  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          {raterHref ? (
            <Link
              href={raterHref}
              className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-text-iron-300"
            >
              {rater}
            </Link>
          ) : (
            <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-iron-400">
              {rater}
            </span>
          )}
          <p className="tw-mb-0 tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-text-iron-400">
            <span className={oldRatingClass}>
              {formatSignedRep(log.contents.old_rating)}
            </span>
            <span aria-hidden="true">-&gt;</span>
            <span className={newRatingClass}>
              {formatSignedRep(log.contents.new_rating)}
            </span>
            <span className={changeClass}>({formatSignedRep(change)})</span>
            {log.contents.rating_category && (
              <span>{log.contents.rating_category}</span>
            )}
          </p>
        </div>
        {createdAtLabel && (
          <span className="tw-flex-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-500">
            {createdAtLabel}
          </span>
        )}
      </div>
      {visibleReason && (
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-500">
          {visibleReason}
        </p>
      )}
    </div>
  );
}

export default function WaveRepDetails({ wave }: WaveRepDetailsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  const selectedCategoryDetails =
    categories.find((category) => category.category === selectedCategory) ??
    null;

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

  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-gap-5 tw-p-4">
      <section aria-labelledby="wave-rep-summary-heading">
        <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <h3
            id="wave-rep-summary-heading"
            className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-white"
          >
            {detailText("waves.rep.details.summary.title")}
          </h3>
          <span className="tw-text-xs tw-font-medium tw-text-iron-500">
            {getContributorCountLabel(summary.contributorCount)}
          </span>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          <SummaryStat
            label={detailText("waves.rep.details.summary.total")}
            value={formatSignedRep(summary.totalRep)}
            toneClassName={getRepTextClass(summary.totalRep)}
          />
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
      </section>

      <section aria-labelledby="wave-rep-categories-heading">
        <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <h3
            id="wave-rep-categories-heading"
            className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-white"
          >
            {detailText("waves.rep.details.categories.title")}
          </h3>
          {categoriesQuery.isPending && (
            <span className="tw-text-xs tw-font-medium tw-text-iron-500">
              {detailText("waves.rep.details.categories.loading")}
            </span>
          )}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <CategoryRow
            label={detailText("waves.rep.details.categories.all")}
            totalRep={summary.totalRep}
            contributorCount={summary.contributorCount}
            selected={selectedCategory === null}
            ariaLabel={detailText(
              "waves.rep.details.categories.allAriaLabel",
              {
                rep: formatSignedRep(summary.totalRep),
                contributors: getContributorCountLabel(
                  summary.contributorCount
                ),
              }
            )}
            onClick={clearSelectedCategory}
          />
          {categories.map((category) => (
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
              {detailText("waves.rep.details.actions.retry")}
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
                : detailText("waves.rep.details.categories.loadMore")}
            </button>
          </div>
        )}
      </section>

      <div
        role="tablist"
        aria-label={detailText("waves.rep.details.view.ariaLabel")}
        className="tw-grid tw-grid-cols-2 tw-gap-1 tw-rounded-md tw-bg-white/[0.04] tw-p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "contributors"}
          onClick={() => setActiveView("contributors")}
          className={`tw-cursor-pointer tw-rounded tw-border-none tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-transition ${
            activeView === "contributors"
              ? "tw-bg-white/10 tw-text-white"
              : "tw-bg-transparent tw-text-iron-400 hover:tw-text-white"
          }`}
        >
          {detailText("waves.rep.details.view.contributors")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "activity"}
          onClick={() => setActiveView("activity")}
          className={`tw-cursor-pointer tw-rounded tw-border-none tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-transition ${
            activeView === "activity"
              ? "tw-bg-white/10 tw-text-white"
              : "tw-bg-transparent tw-text-iron-400 hover:tw-text-white"
          }`}
        >
          {detailText("waves.rep.details.view.activity")}
        </button>
      </div>

      {activeView === "contributors" && (
        <section aria-labelledby="wave-rep-contributors-heading">
          <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
            <div className="tw-min-w-0">
              <h3
                id="wave-rep-contributors-heading"
                className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-white"
              >
                {contributorHeading}
              </h3>
              <p className="tw-mb-0 tw-mt-0.5 tw-truncate tw-text-xs tw-text-iron-500">
                {contributorDescription}
              </p>
            </div>
            {contributorsQuery.isPending && (
              <CircleLoader size={CircleLoaderSize.MEDIUM} />
            )}
          </div>

          {selectedCategory && (
            <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/10 tw-px-3 tw-py-2">
              <p
                title={selectedCategory}
                className="tw-text-primary-100 tw-mb-0 tw-min-w-0 tw-truncate tw-text-xs tw-font-medium"
              >
                {detailText("waves.rep.details.contributors.categoryFilter", {
                  category: selectedCategory,
                })}
              </p>
              <button
                type="button"
                onClick={clearSelectedCategory}
                className="tw-flex-shrink-0 tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-text-iron-300"
              >
                {detailText("waves.rep.details.contributors.categoryFilterAll")}
              </button>
            </div>
          )}

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
                {detailText("waves.rep.details.actions.retry")}
              </button>
            </div>
          )}

          {contributorsQuery.status === "success" &&
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

          {contributors.length > 0 && (
            <div className="tw-flex tw-flex-col tw-gap-2">
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
                    {detailText(
                      "waves.rep.details.contributors.loadMoreError"
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={fetchNextContributorsPage}
                    className="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-white tw-transition hover:tw-text-iron-300"
                  >
                    {detailText("waves.rep.details.actions.retry")}
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
              <h3
                id="wave-rep-activity-heading"
                className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-white"
              >
                {detailText("waves.rep.details.activity.title")}
              </h3>
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
                {detailText("waves.rep.details.actions.retry")}
              </button>
            </div>
          )}

          {logsQuery.status === "success" && logs.length === 0 && (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              {detailText("waves.rep.details.activity.empty")}
            </p>
          )}

          {logs.length > 0 && (
            <div className="tw-flex tw-flex-col tw-gap-2">
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
                    {detailText("waves.rep.details.actions.retry")}
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
