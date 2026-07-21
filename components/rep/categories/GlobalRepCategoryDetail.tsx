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
import { ArrowRightIcon } from "@heroicons/react/24/outline";
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

const SCOPES: ReadonlyArray<CommonSelectItem<RepCategoryScope>> = [
  { key: "profile", label: "Profile REP", value: "profile" },
  { key: "wave", label: "Wave REP", value: "wave" },
];

const SORTS: ReadonlyArray<{
  readonly id: GlobalRepCategorySort;
  readonly label: string;
}> = [
  { id: "rep_desc", label: "REP impact high" },
  { id: "rep_asc", label: "REP impact low" },
  { id: "recent", label: "Recent" },
];

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
        className={`rep-category-profile tw-flex tw-min-w-0 tw-items-center tw-text-left tw-no-underline ${
          compact ? "tw-gap-2" : "tw-gap-3"
        }`}
      >
        <span className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
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
        <span className="rep-category-profile-name tw-min-w-0 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
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
        <div className="rep-category-activity-giver tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
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
      <div className="rep-category-metrics tw-grid tw-grid-cols-2 tw-gap-3 lg:tw-grid-cols-4">
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
      <div className="tw-flex tw-flex-wrap tw-justify-end tw-gap-3">
        <div
          className="rep-category-sort tw-inline-flex tw-flex-wrap tw-gap-2"
          aria-label="Sort category rows"
        >
          {SORTS.map((option) => {
            const selected = effectiveSort === option.id;
            const disabled = tab === "recent" && option.id !== "recent";
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => onSortChange(option.id)}
                className={`rep-category-sort-button tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-transition-colors ${
                  selected
                    ? "tw-text-primary-200 tw-border-primary-400/50 tw-bg-primary-500/15"
                    : "tw-border-white/10 tw-bg-white/[0.03] tw-text-iron-400 hover:tw-border-white/20 hover:tw-text-iron-200"
                } disabled:tw-cursor-not-allowed disabled:tw-opacity-40`}
              >
                {option.label}
              </button>
            );
          })}
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
}: {
  readonly category: string;
  readonly mode?: "page" | "dialog";
  readonly showFullPageLink?: boolean;
  readonly showSearchLink?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<GlobalRepCategoryTab>("overview");
  const [sort, setSort] = useState<GlobalRepCategorySort>("rep_desc");
  const [activeScope, setActiveScope] = useState<RepCategoryScope>("profile");

  return (
    <div
      className={`rep-category-dialog-content tailwind-scope tw-text-iron-100 ${
        mode === "page" ? "tw-py-8" : ""
      }`}
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
          <div className="rep-category-header-actions tw-flex tw-flex-wrap tw-gap-2">
            {showSearchLink && (
              <Link
                href="/rep/categories"
                className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] hover:tw-text-white"
              >
                Back to category search
              </Link>
            )}
            {showFullPageLink && (
              <Link
                href={getRepCategoryPath(category)}
                className="rep-category-full-page tw-text-primary-200 hover:tw-text-primary-100 tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors hover:tw-border-primary-300/60 hover:tw-bg-primary-500/15"
              >
                Open full page
              </Link>
            )}
          </div>
        </div>

        <div className="rep-category-scope tw-max-w-full">
          <CommonTabs<RepCategoryScope>
            items={SCOPES}
            activeItem={activeScope}
            filterLabel="REP category scope"
            setSelected={setActiveScope}
            size="sm"
            fill={false}
          />
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
