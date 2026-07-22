"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiGlobalRepCategoryGiver } from "@/generated/models/ApiGlobalRepCategoryGiver";
import type { ApiGlobalRepCategoryRating } from "@/generated/models/ApiGlobalRepCategoryRating";
import type { ApiGlobalRepCategoryRecipient } from "@/generated/models/ApiGlobalRepCategoryRecipient";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  fetchGlobalRepCategoryOverview,
  fetchGlobalRepCategoryPage,
  getGlobalRepCategoryOverviewQueryKey,
  getGlobalRepCategoryPageQueryKey,
} from "./globalRepCategory.api";
import GlobalRepCategoryWaveScope from "./GlobalRepCategoryWaveScope";
import {
  GLOBAL_REP_CATEGORY_PAGE_SIZE,
  formatRepCategoryDate,
  getProfileAvatarFallback,
  getProfileDisplay,
  getProfileHref,
  getProfileTooltipUser,
  getRepCategoryPath,
  type GlobalRepCategorySort,
  type GlobalRepCategoryTab,
} from "./globalRepCategory.helpers";
import { LoadMoreSentinel, MetricTile, StateBlock } from "./RepCategoryUi";

const TABS: ReadonlyArray<{
  readonly id: GlobalRepCategoryTab;
  readonly label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "recipients", label: "Recipients" },
  { id: "givers", label: "Givers" },
  { id: "pairings", label: "Pairings" },
  { id: "recent", label: "Recent" },
];

type RepCategoryScope = "profile" | "wave";

const REP_CATEGORY_LOCALE = DEFAULT_LOCALE;

const CATEGORY_ACTION_LINK_CLASSNAME =
  "tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-iron-700 hover:tw-bg-iron-900 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60";

const SCOPES: ReadonlyArray<CommonSelectItem<RepCategoryScope>> = [
  { key: "profile", label: "Profile REP", value: "profile" },
  { key: "wave", label: "Wave REP", value: "wave" },
];

const SORTS: ReadonlyArray<CommonSelectItem<GlobalRepCategorySort>> = [
  { key: "rep_desc", label: "REP impact high", value: "rep_desc" },
  { key: "rep_asc", label: "REP impact low", value: "rep_asc" },
  { key: "recent", label: "Recent", value: "recent" },
];

const PRESENTATION_CLASSNAME = `
  [&_.rep-category-eyebrow]:!tw-mb-1 [&_.rep-category-eyebrow]:!tw-mt-0 [&_.rep-category-eyebrow]:!tw-text-xs [&_.rep-category-eyebrow]:!tw-font-semibold [&_.rep-category-eyebrow]:!tw-uppercase [&_.rep-category-eyebrow]:!tw-tracking-wider [&_.rep-category-eyebrow]:!tw-text-iron-500
  [&_.rep-category-header-actions]:tw-items-center [&_.rep-category-layout]:!tw-gap-5 sm:[&_.rep-category-layout]:!tw-gap-6
  [&_.rep-category-load-more]:!tw-rounded-lg [&_.rep-category-load-more]:!tw-border-iron-800 [&_.rep-category-load-more]:!tw-bg-iron-950 [&_.rep-category-load-more]:!tw-px-5 hover:[&_.rep-category-load-more]:!tw-bg-iron-900
  [&_.rep-category-metric-label]:!tw-mb-1 [&_.rep-category-metric-label]:!tw-mt-0 [&_.rep-category-metric-label]:!tw-whitespace-nowrap [&_.rep-category-metric-label]:!tw-text-xs [&_.rep-category-metric-label]:!tw-font-semibold [&_.rep-category-metric-label]:!tw-uppercase [&_.rep-category-metric-label]:!tw-tracking-wider [&_.rep-category-metric-label]:!tw-text-iron-500
  [&_.rep-category-metric-value]:!tw-mt-0 [&_.rep-category-metric-value]:!tw-whitespace-nowrap [&_.rep-category-metric-value]:!tw-text-sm [&_.rep-category-metric-value]:!tw-font-normal [&_.rep-category-metric-value]:!tw-leading-tight [&_.rep-category-metric-value]:!tw-tracking-tight [&_.rep-category-metric-value]:!tw-text-iron-200 sm:[&_.rep-category-metric-value]:!tw-text-lg lg:[&_.rep-category-metric-value]:!tw-text-2xl
  [&_.rep-category-metric:first-child_.rep-category-metric-value]:!tw-font-semibold [&_.rep-category-metric:first-child_.rep-category-metric-value]:!tw-text-primary-300
  [&_.rep-category-metric]:!tw-min-w-0 [&_.rep-category-metric]:!tw-rounded-lg [&_.rep-category-metric]:!tw-border-0 [&_.rep-category-metric]:!tw-bg-transparent [&_.rep-category-metric]:!tw-px-0 [&_.rep-category-metric]:!tw-py-0 sm:[&_.rep-category-metric]:!tw-px-1 lg:[&_.rep-category-metric]:!tw-px-2
  [&_.rep-category-metrics]:!tw-grid-cols-2 [&_.rep-category-metrics]:!tw-gap-x-2 [&_.rep-category-metrics]:!tw-gap-y-4 sm:[&_.rep-category-metrics]:!tw-grid-cols-4 sm:[&_.rep-category-metrics]:!tw-gap-x-4 lg:[&_.rep-category-metrics]:!tw-gap-x-6 [&_.rep-category-overview]:!tw-gap-6
  [&_.rep-category-wave-metrics]:!tw-grid-cols-2 sm:[&_.rep-category-wave-metrics]:!tw-grid-cols-3
  [&_.rep-category-preview-grid]:!tw-grid-cols-1 [&_.rep-category-preview-grid]:!tw-gap-x-4 [&_.rep-category-preview-grid]:!tw-gap-y-8 sm:[&_.rep-category-preview-grid]:!tw-grid-cols-2 sm:[&_.rep-category-preview-grid]:!tw-gap-x-8 [&_.rep-category-preview-grid]:tw-border-b-0 [&_.rep-category-preview-grid]:tw-border-l-0 [&_.rep-category-preview-grid]:tw-border-r-0 [&_.rep-category-preview-grid]:tw-border-t [&_.rep-category-preview-grid]:tw-border-solid [&_.rep-category-preview-grid]:tw-border-iron-900 [&_.rep-category-preview-grid]:tw-pt-6
  [&_.rep-category-preview-list]:!tw-gap-1.5 [&_.rep-category-preview-row]:!tw-gap-2 [&_.rep-category-preview-row]:!tw-rounded-lg [&_.rep-category-preview-row]:!tw-border [&_.rep-category-preview-row]:!tw-border-solid [&_.rep-category-preview-row]:!tw-border-iron-800/60 [&_.rep-category-preview-row]:!tw-bg-iron-900/40 [&_.rep-category-preview-row]:tw-transition-colors hover:[&_.rep-category-preview-row]:!tw-border-iron-800/80 hover:[&_.rep-category-preview-row]:!tw-bg-iron-900/50
  [&_.rep-category-activity-row]:!tw-py-3
  [&_.rep-category-preview-section]:tw-px-0 sm:[&_.rep-category-preview-section]:tw-px-1 lg:[&_.rep-category-preview-section]:tw-px-2 [&_.rep-category-preview-title]:!tw-mb-3 [&_.rep-category-preview-title]:!tw-mt-0 [&_.rep-category-preview-title]:!tw-text-xs [&_.rep-category-preview-title]:!tw-font-semibold [&_.rep-category-preview-title]:!tw-uppercase [&_.rep-category-preview-title]:!tw-tracking-wider [&_.rep-category-preview-title]:!tw-text-iron-500
  [&_.rep-category-preview-value]:!tw-font-normal [&_.rep-category-preview-value]:!tw-tracking-tight [&_.rep-category-preview-value]:!tw-text-iron-400 [&_.rep-category-profile-avatar]:!tw-h-7 [&_.rep-category-profile-avatar]:!tw-w-7 sm:[&_.rep-category-profile-avatar]:!tw-h-8 sm:[&_.rep-category-profile-avatar]:!tw-w-8 [&_.rep-category-profile-name]:!tw-text-iron-200
  md:[&_.rep-category-activity-grid]:!tw-gap-4
  [&_.rep-category-scope]:tw-w-fit [&_.rep-category-scope]:tw-max-w-full
  [&_.rep-category-section-tab]:!tw-rounded-none [&_.rep-category-section-tab]:!tw-border-x-0 [&_.rep-category-section-tab]:!tw-border-b-2 [&_.rep-category-section-tab]:!tw-border-t-0 [&_.rep-category-section-tab]:!tw-border-solid [&_.rep-category-section-tab]:!tw-border-transparent [&_.rep-category-section-tab]:!tw-bg-transparent [&_.rep-category-section-tab]:!tw-px-3 [&_.rep-category-section-tab]:!tw-py-3 [&_.rep-category-section-tab]:!tw-text-sm [&_.rep-category-section-tab]:!tw-font-medium [&_.rep-category-section-tab]:!tw-text-iron-500
  [&_.rep-category-section-tab[aria-pressed=true]]:!tw-border-primary-300 [&_.rep-category-section-tab[aria-pressed=true]]:!tw-bg-transparent [&_.rep-category-section-tab[aria-pressed=true]]:!tw-text-white [&_.rep-category-section-tab[aria-pressed=true]]:!tw-shadow-none
  [&_.rep-category-section-tab[aria-selected=true]]:!tw-border-primary-300 [&_.rep-category-section-tab[aria-selected=true]]:!tw-bg-transparent [&_.rep-category-section-tab[aria-selected=true]]:!tw-text-white [&_.rep-category-section-tab[aria-selected=true]]:!tw-shadow-none hover:[&_.rep-category-section-tab]:!tw-text-iron-200
  [&_.rep-category-section-tabs]:!tw-gap-x-1 [&_.rep-category-section-tabs]:!tw-border-b [&_.rep-category-section-tabs]:!tw-border-iron-800 [&_.rep-category-section-tabs]:!tw-bg-transparent [&_.rep-category-section-tabs]:!tw-px-0 [&_.rep-category-section-tabs]:!tw-pb-0
  [&_.rep-category-sort-row]:!tw-justify-start
  [&_.rep-category-state]:!tw-rounded-xl [&_.rep-category-state]:!tw-border-iron-800/50 [&_.rep-category-state]:!tw-bg-iron-900/20
  [&_.rep-category-table-frame]:!tw-rounded-xl [&_.rep-category-table-frame]:!tw-border-0 [&_.rep-category-table-frame]:!tw-bg-iron-950 [&_.rep-category-table-frame]:tw-ring-1 [&_.rep-category-table-frame]:tw-ring-inset [&_.rep-category-table-frame]:tw-ring-iron-900
  [&_.rep-category-table-head]:!tw-bg-iron-900 [&_.rep-category-table-head]:!tw-text-[0.6875rem] [&_.rep-category-table-head]:!tw-font-medium [&_.rep-category-table-head]:!tw-tracking-wide [&_.rep-category-table-row]:tw-transition-colors hover:[&_.rep-category-table-row]:tw-bg-iron-900 [&_.rep-category-table]:!tw-bg-transparent
  [&_.rep-category-title]:!tw-mt-0 [&_.rep-category-title]:!tw-text-xl [&_.rep-category-title]:!tw-font-medium [&_.rep-category-title]:!tw-leading-tight [&_.rep-category-title]:!tw-tracking-tight [&_.rep-category-title]:!tw-text-iron-50 sm:[&_.rep-category-title]:!tw-text-2xl
  [&_.rep-category-wave-content]:!tw-gap-6 [&_.rep-category-wave-controls]:!tw-border-0 [&_.rep-category-wave-link]:!tw-text-iron-200
`;

function ProfileCell({
  profile,
  compact = false,
}: {
  readonly profile: ApiProfileMin;
  readonly compact?: boolean;
}) {
  const display = getProfileDisplay(profile);

  return (
    <UserProfileTooltipWrapper user={getProfileTooltipUser(profile)}>
      <Link
        href={getProfileHref(profile)}
        prefetch={false}
        className={`rep-category-profile tw-flex tw-min-w-0 tw-items-center tw-text-left tw-no-underline tw-decoration-iron-400/80 tw-underline-offset-2 hover:tw-underline focus-visible:tw-underline ${
          compact ? "tw-gap-2" : "tw-gap-3"
        }`}
      >
        <span className="rep-category-profile-avatar tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
          {profile.pfp ? (
            <Image
              unoptimized
              src={getScaledImageUri(profile.pfp, ImageScale.W_AUTO_H_50)}
              alt={`${display} profile`}
              width={32}
              height={32}
              className="tw-h-full tw-w-full tw-object-cover"
            />
          ) : (
            <span className="tw-text-[0.6875rem] tw-font-semibold tw-text-iron-300">
              {getProfileAvatarFallback(profile)}
            </span>
          )}
        </span>
        <span className="rep-category-profile-name tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
          {display}
        </span>
      </Link>
    </UserProfileTooltipWrapper>
  );
}

function MiniList({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="rep-category-preview-section tw-min-w-0">
      <h3 className="rep-category-preview-title tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        {title}
      </h3>
      <div className="rep-category-preview-list tw-flex tw-flex-col tw-gap-2">
        {children}
      </div>
    </section>
  );
}

function RepTotalMiniRow({
  profile,
  totalRep,
}: {
  readonly profile: ApiProfileMin;
  readonly totalRep: number;
}) {
  return (
    <div className="rep-category-preview-row tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5">
      <ProfileCell profile={profile} />
      <span className="rep-category-preview-value tw-flex-shrink-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        {formatNumberWithCommas(totalRep)}
      </span>
    </div>
  );
}

function RatingMiniRow({
  item,
}: {
  readonly item: ApiGlobalRepCategoryRating;
}) {
  return (
    <div className="rep-category-preview-row rep-category-activity-row tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.02] tw-px-3 tw-py-2.5">
      <div className="rep-category-activity-grid tw-grid tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem] tw-items-center tw-gap-2 md:tw-gap-4">
        <div className="rep-category-activity-giver tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2">
          <ProfileCell profile={item.giver} compact />
          <span className="tw-sr-only">
            {t(REP_CATEGORY_LOCALE, "rep.categories.activity.direction")}
          </span>
          <ArrowRightIcon
            aria-hidden="true"
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-500"
          />
        </div>
        <div className="rep-category-activity-recipient tw-min-w-0">
          <ProfileCell profile={item.recipient} compact />
        </div>
        <span className="rep-category-preview-value tw-whitespace-nowrap tw-text-right tw-text-sm tw-font-semibold tw-text-iron-200">
          {t(REP_CATEGORY_LOCALE, "rep.categories.activity.value", {
            value: formatNumberWithCommas(item.rep),
          })}
        </span>
      </div>
    </div>
  );
}

function OverviewContent({ category }: { readonly category: string }) {
  const overviewQuery = useQuery({
    queryKey: getGlobalRepCategoryOverviewQueryKey(category),
    queryFn: async () => await fetchGlobalRepCategoryOverview(category),
  });

  if (overviewQuery.isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading category overview"
        className="tw-flex tw-justify-center tw-py-12"
      >
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  }

  if (overviewQuery.isError) {
    return (
      <StateBlock
        title="Could not load category overview"
        message={
          overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : "The category overview failed to load."
        }
        onRetry={() => {
          overviewQuery.refetch().catch(() => undefined);
        }}
      />
    );
  }

  const overview = overviewQuery.data;

  return (
    <div className="rep-category-overview tw-flex tw-flex-col tw-gap-6">
      <div className="rep-category-metrics tw-grid tw-w-full tw-max-w-3xl tw-grid-cols-2 tw-gap-3 lg:tw-grid-cols-4">
        <MetricTile label="Total REP" value={overview.total_rep} />
        <MetricTile label="Givers" value={overview.giver_count} />
        <MetricTile label="Recipients" value={overview.recipient_count} />
        <MetricTile label="Pairings" value={overview.pair_count} />
      </div>

      <div className="rep-category-preview-grid tw-grid tw-grid-cols-1 tw-gap-5 lg:tw-grid-cols-2">
        <MiniList title="Recipients preview">
          {overview.top_recipients.length > 0 ? (
            overview.top_recipients.map((item) => (
              <RepTotalMiniRow
                key={item.profile.id}
                profile={item.profile}
                totalRep={item.total_rep}
              />
            ))
          ) : (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              No recipients found.
            </p>
          )}
        </MiniList>

        <MiniList title="Givers preview">
          {overview.top_givers.length > 0 ? (
            overview.top_givers.map((item) => (
              <RepTotalMiniRow
                key={item.profile.id}
                profile={item.profile}
                totalRep={item.total_rep}
              />
            ))
          ) : (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              No givers found.
            </p>
          )}
        </MiniList>
      </div>

      <div className="tw-pt-6">
        <MiniList title="Recent activity">
          {overview.recently_updated.length > 0 ? (
            overview.recently_updated.map((item) => (
              <RatingMiniRow
                key={`${item.giver.id}-${item.recipient.id}-${item.last_modified}`}
                item={item}
              />
            ))
          ) : (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              No recent activity found.
            </p>
          )}
        </MiniList>
      </div>
    </div>
  );
}

function TableHeader({ tab }: { readonly tab: GlobalRepCategoryTab }) {
  if (tab === "recipients") {
    return (
      <tr>
        <th scope="col" className="tw-w-16 tw-px-4 tw-py-3 tw-text-right">
          Rank
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-left">
          Recipient
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
          REP
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
          Raters
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
          Last modified
        </th>
      </tr>
    );
  }

  if (tab === "givers") {
    return (
      <tr>
        <th scope="col" className="tw-w-16 tw-px-4 tw-py-3 tw-text-right">
          Rank
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-left">
          Giver
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
          REP
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
          Recipients
        </th>
        <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
          Last modified
        </th>
      </tr>
    );
  }

  return (
    <tr>
      <th scope="col" className="tw-w-16 tw-px-4 tw-py-3 tw-text-right">
        Rank
      </th>
      <th scope="col" className="tw-px-4 tw-py-3 tw-text-left">
        Giver
      </th>
      <th scope="col" className="tw-px-4 tw-py-3 tw-text-left">
        Recipient
      </th>
      <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
        REP
      </th>
      <th scope="col" className="tw-px-4 tw-py-3 tw-text-right">
        Last modified
      </th>
    </tr>
  );
}

function TableRow({
  item,
  rank,
}: {
  readonly item:
    | ApiGlobalRepCategoryRecipient
    | ApiGlobalRepCategoryGiver
    | ApiGlobalRepCategoryRating;
  readonly rank: number;
}) {
  if ("recipient" in item) {
    return (
      <tr className="rep-category-table-row tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/5 last:tw-border-b-0">
        <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-500">
          {rank}
        </td>
        <td className="tw-px-4 tw-py-3">
          <ProfileCell profile={item.giver} />
        </td>
        <td className="tw-px-4 tw-py-3">
          <ProfileCell profile={item.recipient} />
        </td>
        <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-semibold tw-text-iron-100">
          {formatNumberWithCommas(item.rep)}
        </td>
        <td className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-400">
          {formatRepCategoryDate(item.last_modified)}
        </td>
      </tr>
    );
  }

  return (
    <tr className="rep-category-table-row tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/5 last:tw-border-b-0">
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-500">
        {rank}
      </td>
      <td className="tw-px-4 tw-py-3">
        <ProfileCell profile={item.profile} />
      </td>
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-semibold tw-text-iron-100">
        {formatNumberWithCommas(item.total_rep)}
      </td>
      <td className="tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-300">
        {"rater_count" in item
          ? formatNumberWithCommas(item.rater_count)
          : formatNumberWithCommas(item.recipient_count)}
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-text-iron-400">
        {formatRepCategoryDate(item.last_modified)}
      </td>
    </tr>
  );
}

function PaginatedTable({
  category,
  tab,
  sort,
  onSortChange,
}: {
  readonly category: string;
  readonly tab: Exclude<GlobalRepCategoryTab, "overview">;
  readonly sort: GlobalRepCategorySort;
  readonly onSortChange: (sort: GlobalRepCategorySort) => void;
}) {
  const effectiveSort = tab === "recent" ? "recent" : sort;
  const pageQuery = useInfiniteQuery({
    queryKey: getGlobalRepCategoryPageQueryKey({
      category,
      tab,
      sort: effectiveSort,
    }),
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchGlobalRepCategoryPage({
        category,
        tab,
        sort: effectiveSort,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
  });

  const rows = useMemo(
    () =>
      pageQuery.data?.pages.flatMap((page) =>
        page.data.map((item, index) => ({
          item,
          rank: (page.page - 1) * GLOBAL_REP_CATEGORY_PAGE_SIZE + index + 1,
        }))
      ) ?? [],
    [pageQuery.data?.pages]
  );
  const loadNextPage = () => {
    if (pageQuery.hasNextPage && !pageQuery.isFetchingNextPage) {
      pageQuery.fetchNextPage().catch(() => undefined);
    }
  };
  if (pageQuery.isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Loading ${tab}`}
        className="tw-flex tw-justify-center tw-py-12"
      >
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  }

  if (pageQuery.isError) {
    return (
      <StateBlock
        title="Could not load category data"
        message={
          pageQuery.error instanceof Error
            ? pageQuery.error.message
            : "The category data failed to load."
        }
        onRetry={() => {
          pageQuery.refetch().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <div className="rep-category-table-content tw-flex tw-flex-col tw-gap-4">
      <div className="rep-category-sort-row tw-flex tw-flex-wrap tw-justify-end tw-gap-3">
        <div className="rep-category-sort tw-min-w-0 tw-max-w-full">
          <CommonTabs<GlobalRepCategorySort>
            items={SORTS}
            activeItem={effectiveSort}
            filterLabel="Sort category rows"
            setSelected={onSortChange}
            isItemDisabled={(option) =>
              tab === "recent" && option.value !== "recent"
            }
            size="sm"
            fill={false}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <StateBlock
          title="No rows found"
          message="No global REP rows were found for this category."
        />
      ) : (
        <div className="rep-category-table-frame tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
          <table className="rep-category-table tw-w-full tw-min-w-[44rem] tw-border-collapse tw-bg-white/[0.02] tw-text-left">
            <caption className="tw-sr-only">
              Global REP category {tab} for {category}
            </caption>
            <thead className="rep-category-table-head tw-bg-white/[0.04] tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
              <TableHeader tab={tab} />
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowIdentity =
                  "profile" in row.item
                    ? row.item.profile.id
                    : [row.item.giver.id, row.item.recipient.id].join("-");

                return (
                  <TableRow
                    key={`${row.rank}-${rowIdentity}`}
                    item={row.item}
                    rank={row.rank}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageQuery.hasNextPage && (
        <>
          <LoadMoreSentinel
            canLoadMore={pageQuery.hasNextPage}
            isLoading={pageQuery.isFetchingNextPage}
            onLoadMore={loadNextPage}
          />
          <button
            type="button"
            disabled={pageQuery.isFetchingNextPage}
            onClick={loadNextPage}
            className="rep-category-load-more tw-self-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] disabled:tw-cursor-default disabled:tw-opacity-70"
          >
            {pageQuery.isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </>
      )}
    </div>
  );
}

export default function GlobalRepCategoryDetail({
  category,
  mode = "page",
  showFullPageLink = false,
  showSearchLink = false,
  className = "",
}: {
  readonly category: string;
  readonly mode?: "page" | "dialog";
  readonly showFullPageLink?: boolean;
  readonly showSearchLink?: boolean;
  readonly className?: string;
}) {
  const [activeTab, setActiveTab] = useState<GlobalRepCategoryTab>("overview");
  const [sort, setSort] = useState<GlobalRepCategorySort>("rep_desc");
  const [activeScope, setActiveScope] = useState<RepCategoryScope>("profile");

  return (
    <div
      className={`rep-category-dialog-content tailwind-scope tw-text-iron-100 ${PRESENTATION_CLASSNAME} ${
        mode === "page" ? "tw-py-8" : ""
      } ${className}`}
    >
      <div className="rep-category-layout tw-flex tw-flex-col tw-gap-5">
        <div className="rep-category-header tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
          <div className="tw-min-w-0">
            <p className="rep-category-eyebrow tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-primary-300">
              REP Category
            </p>
            <h1
              className={`rep-category-title tw-mb-0 tw-break-words tw-font-semibold tw-text-white ${
                mode === "page" ? "tw-text-3xl" : "tw-text-2xl"
              }`}
            >
              {category}
            </h1>
          </div>
          {showSearchLink && (
            <div className="rep-category-header-actions tw-flex tw-flex-wrap tw-gap-2">
              <Link
                href="/rep/categories"
                className={CATEGORY_ACTION_LINK_CLASSNAME}
              >
                <ArrowLeftIcon
                  aria-hidden="true"
                  className="tw-size-3.5 tw-flex-shrink-0"
                />
                Back to category search
              </Link>
            </div>
          )}
        </div>

        <div className="rep-category-scope-row tw-flex tw-items-center tw-justify-between tw-gap-3">
          <div className="rep-category-scope tw-min-w-0 tw-max-w-full">
            <CommonTabs<RepCategoryScope>
              items={SCOPES}
              activeItem={activeScope}
              filterLabel="REP category scope"
              setSelected={setActiveScope}
              size="sm"
              fill={false}
            />
          </div>
          {showFullPageLink && (
            <Link
              href={getRepCategoryPath(category)}
              className={CATEGORY_ACTION_LINK_CLASSNAME}
            >
              Open full page
              <ArrowUpRightIcon
                aria-hidden="true"
                className="tw-size-3.5 tw-flex-shrink-0"
              />
            </Link>
          )}
        </div>

        {activeScope === "profile" ? (
          <>
            <div
              role="tablist"
              aria-label="Global REP category sections"
              className="rep-category-section-tabs tw-flex tw-gap-2 tw-overflow-x-auto tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-2"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`global-rep-category-${tab.id}`}
                  id={`global-rep-category-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rep-category-section-tab tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition-colors ${
                    activeTab === tab.id
                      ? "tw-border-white/20 tw-bg-white/10 tw-text-white"
                      : "tw-border-transparent tw-bg-transparent tw-text-iron-400 hover:tw-bg-white/[0.05] hover:tw-text-iron-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`global-rep-category-${activeTab}`}
              aria-labelledby={`global-rep-category-tab-${activeTab}`}
              className="rep-category-panel"
            >
              {activeTab === "overview" ? (
                <OverviewContent category={category} />
              ) : (
                <PaginatedTable
                  category={category}
                  tab={activeTab}
                  sort={sort}
                  onSortChange={setSort}
                />
              )}
            </div>
          </>
        ) : (
          <GlobalRepCategoryWaveScope category={category} />
        )}
      </div>
    </div>
  );
}
