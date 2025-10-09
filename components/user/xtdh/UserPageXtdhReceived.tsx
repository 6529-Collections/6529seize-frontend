"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CommonSelect, {
  type CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import CollectionsAutocomplete from "@/components/utils/input/collections/CollectionsAutocomplete";
import CommonTablePagination from "@/components/utils/table/paginator/CommonTablePagination";
import { SortDirection } from "@/entities/ISort";
import { classNames, formatNumberWithCommas } from "@/helpers/Helpers";
import {
  useReceivedCollections,
  useReceivedNfts,
  type UseReceivedCollectionsFilters,
} from "@/hooks/useXtdhReceived";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faList, faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import type {
  XtdhGranter,
  XtdhGranterPreview,
  XtdhReceivedCollectionOption,
  XtdhReceivedCollectionSummary,
  XtdhReceivedNft,
  XtdhReceivedToken,
} from "@/types/xtdh";

const COLLECTIONS_PAGE_SIZE = 20;
const NFTS_PAGE_SIZE = 20;

const COLLECTION_QUERY_PARAM = "collection";
const MIN_RATE_QUERY_PARAM = "min_rate";
const MIN_GRANTORS_QUERY_PARAM = "min_grantors";

const VIEW_LABELS: Record<ReceivedView, string> = {
  collections: "Collections",
  nfts: "NFTs",
};

const VIEW_ICONS: Record<ReceivedView, IconDefinition> = {
  collections: faTableCellsLarge,
  nfts: faList,
};

const VIEW_ORDER: ReceivedView[] = ["collections", "nfts"];

type ReceivedView = "collections" | "nfts";
type CollectionsSortField =
  | "total_rate"
  | "total_received"
  | "token_count"
  | "collection_name";
type NftSortField =
  | "xtdh_rate"
  | "total_received"
  | "token_id"
  | "collection_name";

const DEFAULT_COLLECTION_SORT: CollectionsSortField = "total_rate";
const DEFAULT_NFT_SORT: NftSortField = "xtdh_rate";
const DEFAULT_DIRECTION = SortDirection.DESC;

const COLLECTION_SORT_ITEMS: CommonSelectItem<CollectionsSortField>[] = [
  { key: "total_rate", label: "Total xTDH Rate", value: "total_rate" },
  { key: "total_received", label: "Total xTDH Received", value: "total_received" },
  { key: "token_count", label: "Token Count", value: "token_count" },
  { key: "collection_name", label: "Collection Name", value: "collection_name" },
];

const NFT_SORT_ITEMS: CommonSelectItem<NftSortField>[] = [
  { key: "xtdh_rate", label: "xTDH Rate", value: "xtdh_rate" },
  { key: "total_received", label: "Total xTDH Received", value: "total_received" },
  { key: "token_id", label: "Token ID", value: "token_id" },
  { key: "collection_name", label: "Collection Name", value: "collection_name" },
];

function parseCollectionsSort(value: string | null): CollectionsSortField {
  if (!value) return DEFAULT_COLLECTION_SORT;
  const normalized = value.toLowerCase() as CollectionsSortField;
  return (
    COLLECTION_SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_COLLECTION_SORT
  );
}

function parseNftSort(value: string | null): NftSortField {
  if (!value) return DEFAULT_NFT_SORT;
  const normalized = value.toLowerCase() as NftSortField;
  return (
    NFT_SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_NFT_SORT
  );
}

function parseSortDirection(value: string | null): SortDirection {
  if (!value) return DEFAULT_DIRECTION;
  const normalized = value.trim().toUpperCase();
  return normalized === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC;
}

function toApiDirection(direction: SortDirection): "asc" | "desc" {
  return direction === SortDirection.ASC ? "asc" : "desc";
}

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function parseCollectionsFilterParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function hasActiveFilters(filters: UseReceivedCollectionsFilters): boolean {
  return Boolean(
    (filters.collections && filters.collections.length > 0) ||
      typeof filters.minRate === "number" ||
      typeof filters.minGrantors === "number"
  );
}

function mergeCollectionOptions(
  options: XtdhReceivedCollectionOption[],
  selected: string[]
): XtdhReceivedCollectionOption[] {
  if (!selected.length) {
    return options;
  }

  const map = new Map<string, XtdhReceivedCollectionOption>();
  for (const option of options) {
    map.set(option.collectionId, option);
  }

  for (const id of selected) {
    if (!map.has(id)) {
      map.set(id, {
        collectionId: id,
        collectionName: id,
        tokenCount: 0,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.collectionName.localeCompare(b.collectionName)
  );
}

function formatValue(value: number): string {
  if (Number.isNaN(value)) return "-";
  return formatNumberWithCommas(value);
}

function formatRate(value: number): string {
  return `${formatValue(value)} /day`;
}

function formatTotal(value: number): string {
  return formatValue(value);
}

export default function UserPageXtdhReceived({
  profileId,
}: {
  readonly profileId: string | null;
}) {
  const [view, setView] = useState<ReceivedView>("collections");
  const [announcement, setAnnouncement] = useState<string>(
    "Collections view selected"
  );

  useEffect(() => {
    setAnnouncement(`${VIEW_LABELS[view]} view selected`);
  }, [view]);

  const handleViewChange = useCallback((next: ReceivedView) => {
    setView(next);
  }, []);

  return (
    <section
      className="tw-flex tw-flex-col tw-gap-4"
      role="region"
      aria-label="Received xTDH"
    >
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        View NFTs you hold that are currently receiving xTDH grants. Use the
        filters to explore by collection or individual token.
      </p>
      {view === "collections" ? (
        <CollectionsView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
        />
      ) : (
        <NftsView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
        />
      )}
    </section>
  );
}

function ViewToggle({
  view,
  onViewChange,
  announcement,
}: {
  readonly view: ReceivedView;
  readonly onViewChange: (view: ReceivedView) => void;
  readonly announcement: string;
}) {
  return (
    <div className="tw-inline-flex tw-flex-col tw-items-end">
      <div
        className="tw-inline-flex tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900"
        role="group"
        aria-label="View options"
      >
        {VIEW_ORDER.map((option) => {
          const isActive = view === option;
          return (
            <TooltipIconButton
              key={option}
              onClick={() => onViewChange(option)}
              aria-pressed={isActive}
              aria-label={`${VIEW_LABELS[option]} view`}
              tooltipText={`${VIEW_LABELS[option]} view`}
              className={classNames(
                "tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-border-solid tw-transition tw-duration-200 tw-ease-out focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-0",
                option === VIEW_ORDER[0] ? "tw-rounded-l-lg" : "tw-rounded-r-lg",
                isActive
                  ? "tw-bg-primary-500"
                  : "tw-bg-transparent hover:tw-bg-iron-800",
                option !== VIEW_ORDER[0] ? "tw-border-l tw-border-iron-700" : ""
              )}
              icon={VIEW_ICONS[option]}
              iconClassName={classNames(
                "tw-text-base",
                isActive ? "tw-text-iron-50" : "tw-text-iron-300"
              )}
            />
          );
        })}
      </div>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="tw-sr-only"
      >
        {announcement}
      </span>
    </div>
  );
}

function CollectionsView({
  profileId,
  view,
  onViewChange,
  announcement,
}: {
  readonly profileId: string | null;
  readonly view: ReceivedView;
  readonly onViewChange: (view: ReceivedView) => void;
  readonly announcement: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeSort = useMemo(
    () => parseCollectionsSort(searchParams?.get("sort") ?? null),
    [searchParams]
  );

  const activeDirection = useMemo(
    () => parseSortDirection(searchParams?.get("dir") ?? null),
    [searchParams]
  );

  const apiDirection = useMemo(
    () => toApiDirection(activeDirection),
    [activeDirection]
  );

  const page = useMemo(
    () => parsePage(searchParams?.get("page") ?? null),
    [searchParams]
  );

  const selectedCollections = useMemo(
    () => parseCollectionsFilterParam(searchParams?.get(COLLECTION_QUERY_PARAM) ?? null),
    [searchParams]
  );

  const minRate = useMemo(
    () => parseNumberParam(searchParams?.get(MIN_RATE_QUERY_PARAM) ?? null),
    [searchParams]
  );
  const minGrantors = useMemo(
    () => parseNumberParam(searchParams?.get(MIN_GRANTORS_QUERY_PARAM) ?? null),
    [searchParams]
  );

  const filters = useMemo<UseReceivedCollectionsFilters>(
    () => ({
      collections: selectedCollections,
      minRate,
      minGrantors,
    }),
    [minGrantors, minRate, selectedCollections]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useReceivedCollections({
    profile: profileId,
    sort: activeSort,
    dir: apiDirection,
    page,
    pageSize: COLLECTIONS_PAGE_SIZE,
    filters,
    enabled: Boolean(profileId),
  });

  const collections = data?.collections ?? [];
  const totalCount = data?.totalCount ?? 0;
  const [availableCollectionOptions, setAvailableCollectionOptions] = useState<
    XtdhReceivedCollectionOption[]
  >([]);

  useEffect(() => {
    if (data?.availableCollections !== undefined) {
      setAvailableCollectionOptions(data.availableCollections);
    }
  }, [data?.availableCollections]);

  const availableCollections = useMemo(
    () => mergeCollectionOptions(availableCollectionOptions, selectedCollections),
    [availableCollectionOptions, selectedCollections]
  );

  const collectionFilterOptions = useMemo(
    () =>
      availableCollections.map((option) => ({
        id: option.collectionId,
        name: option.collectionName,
        tokenCount: option.tokenCount,
      })),
    [availableCollections]
  );

  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / COLLECTIONS_PAGE_SIZE));
  }, [totalCount]);

  const haveNextPage = useMemo(
    () => page * COLLECTIONS_PAGE_SIZE < totalCount,
    [page, totalCount]
  );

  const filtersAreActive = hasActiveFilters(filters);

  const handleUpdateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      updater(params);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleSortChange = useCallback(
    (nextSort: CollectionsSortField) => {
      handleUpdateParams((params) => {
        const currentSort = parseCollectionsSort(params.get("sort"));
        const currentDirection = parseSortDirection(params.get("dir"));

        const nextDirection =
          nextSort === currentSort
            ? currentDirection === SortDirection.ASC
              ? SortDirection.DESC
              : SortDirection.ASC
            : DEFAULT_DIRECTION;

        if (nextSort === DEFAULT_COLLECTION_SORT) {
          params.delete("sort");
        } else {
          params.set("sort", nextSort);
        }

        if (nextDirection === DEFAULT_DIRECTION) {
          params.delete("dir");
        } else {
          params.set("dir", nextDirection.toLowerCase());
        }

        params.set("page", "1");
      });
    },
    [handleUpdateParams]
  );

  const handleCollectionsFilterChange = useCallback(
    (nextSelected: string[]) => {
      handleUpdateParams((params) => {
        if (nextSelected.length) {
          params.set(COLLECTION_QUERY_PARAM, nextSelected.join(","));
        } else {
          params.delete(COLLECTION_QUERY_PARAM);
        }
        params.set("page", "1");
      });
    },
    [handleUpdateParams]
  );

  const handleClearFilters = useCallback(() => {
    handleUpdateParams((params) => {
      params.delete(COLLECTION_QUERY_PARAM);
      params.delete(MIN_RATE_QUERY_PARAM);
      params.delete(MIN_GRANTORS_QUERY_PARAM);
      params.set("page", "1");
    });
  }, [handleUpdateParams]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      handleUpdateParams((params) => {
        params.set("page", nextPage.toString());
      });
    },
    [handleUpdateParams]
  );

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(
    null
  );
  const [expandedTokens, setExpandedTokens] = useState<Record<string, boolean>>({});

  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollectionId((prev) => (prev === collectionId ? null : collectionId));
  }, []);

  const toggleToken = useCallback((tokenId: string) => {
    setExpandedTokens((prev) => ({
      ...prev,
      [tokenId]: !prev[tokenId],
    }));
  }, []);

  useEffect(() => {
    setExpandedTokens((prev) =>
      Object.keys(prev).length > 0 ? {} : prev
    );
  }, [expandedCollectionId]);

  const resultSummary = useMemo(() => {
    if (!profileId) {
      return "Connect or select a profile to view received xTDH.";
    }
    if (isLoading) {
      return "Loading collections…";
    }
    if (isFetching) {
      return "Updating collections…";
    }
    const label = totalCount === 1 ? "collection" : "collections";
    return `Showing ${totalCount.toLocaleString()} ${label}`;
  }, [isFetching, isLoading, profileId, totalCount]);

  if (!profileId) {
    return (
      <EmptyState message="Unable to determine which profile to load." />
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "";
    return (
      <ErrorState message={errorMessage} onRetry={handleRetry} />
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div
        className="tw-flex tw-flex-col tw-gap-3"
        role="region"
        aria-label="Filter and sort controls"
      >
        <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4">
          <div className="tw-w-full lg:tw-w-64">
            <CollectionsAutocomplete
              options={collectionFilterOptions}
              value={selectedCollections}
              onChange={handleCollectionsFilterChange}
              disabled={isLoading || isFetching}
              label="Collections"
            />
          </div>
          <div className="tw-w-full lg:tw-w-auto">
            <CommonSelect
              items={COLLECTION_SORT_ITEMS}
              activeItem={activeSort}
              filterLabel="Sort collections"
              setSelected={handleSortChange}
              sortDirection={activeDirection}
              disabled={isLoading}
            />
          </div>
          {filtersAreActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="tw-self-start tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="tw-text-sm tw-text-iron-300"
          >
            {resultSummary}
          </span>
          <div className="tw-flex tw-justify-end sm:tw-justify-end">
            <ViewToggle
              view={view}
              onViewChange={onViewChange}
              announcement={announcement}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <CollectionsSkeleton />
      ) : collections.length === 0 ? (
        filtersAreActive ? (
          <EmptyState
            message="No NFTs match your filters."
            actionLabel="Clear filters"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState message="You don't hold any NFTs currently receiving xTDH grants. When others grant xTDH to collections you hold, they will appear here." />
        )
      ) : (
        <div className="tw-space-y-3" role="list" aria-label="Collections receiving xTDH">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.collectionId}
              collection={collection}
              expanded={expandedCollectionId === collection.collectionId}
              onToggle={() => toggleCollection(collection.collectionId)}
              expandedTokens={expandedTokens}
              onToggleToken={toggleToken}
            />
          ))}
        </div>
      )}

      {collections.length > 0 && totalPages > 1 && (
        <CommonTablePagination
          small={true}
          currentPage={page}
          setCurrentPage={handlePageChange}
          totalPages={totalPages}
          haveNextPage={haveNextPage}
          loading={isFetching}
        />
      )}
    </div>
  );
}

function NftsView({
  profileId,
  view,
  onViewChange,
  announcement,
}: {
  readonly profileId: string | null;
  readonly view: ReceivedView;
  readonly onViewChange: (view: ReceivedView) => void;
  readonly announcement: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeSort = useMemo(
    () => parseNftSort(searchParams?.get("sort") ?? null),
    [searchParams]
  );

  const activeDirection = useMemo(
    () => parseSortDirection(searchParams?.get("dir") ?? null),
    [searchParams]
  );

  const apiDirection = useMemo(
    () => toApiDirection(activeDirection),
    [activeDirection]
  );

  const page = useMemo(
    () => parsePage(searchParams?.get("page") ?? null),
    [searchParams]
  );

  const selectedCollections = useMemo(
    () => parseCollectionsFilterParam(searchParams?.get(COLLECTION_QUERY_PARAM) ?? null),
    [searchParams]
  );

  const minRate = useMemo(
    () => parseNumberParam(searchParams?.get(MIN_RATE_QUERY_PARAM) ?? null),
    [searchParams]
  );
  const minGrantors = useMemo(
    () => parseNumberParam(searchParams?.get(MIN_GRANTORS_QUERY_PARAM) ?? null),
    [searchParams]
  );

  const filters = useMemo<UseReceivedCollectionsFilters>(
    () => ({
      collections: selectedCollections,
      minRate,
      minGrantors,
    }),
    [minGrantors, minRate, selectedCollections]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useReceivedNfts({
    profile: profileId,
    sort: activeSort,
    dir: apiDirection,
    page,
    pageSize: NFTS_PAGE_SIZE,
    filters,
    enabled: Boolean(profileId),
  });

  const nfts = data?.nfts ?? [];
  const totalCount = data?.totalCount ?? 0;
  const [availableCollectionOptions, setAvailableCollectionOptions] = useState<
    XtdhReceivedCollectionOption[]
  >([]);

  useEffect(() => {
    if (data?.availableCollections !== undefined) {
      setAvailableCollectionOptions(data.availableCollections);
    }
  }, [data?.availableCollections]);

  const availableCollections = useMemo(
    () => mergeCollectionOptions(availableCollectionOptions, selectedCollections),
    [availableCollectionOptions, selectedCollections]
  );

  const collectionFilterOptions = useMemo(
    () =>
      availableCollections.map((option) => ({
        id: option.collectionId,
        name: option.collectionName,
        tokenCount: option.tokenCount,
      })),
    [availableCollections]
  );

  const totalPages = useMemo(() => {
    if (!totalCount) return 1;
    return Math.max(1, Math.ceil(totalCount / NFTS_PAGE_SIZE));
  }, [totalCount]);

  const haveNextPage = useMemo(
    () => page * NFTS_PAGE_SIZE < totalCount,
    [page, totalCount]
  );

  const filtersAreActive = hasActiveFilters(filters);

  const handleUpdateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      updater(params);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleSortChange = useCallback(
    (nextSort: NftSortField) => {
      handleUpdateParams((params) => {
        const currentSort = parseNftSort(params.get("sort"));
        const currentDirection = parseSortDirection(params.get("dir"));

        const nextDirection =
          nextSort === currentSort
            ? currentDirection === SortDirection.ASC
              ? SortDirection.DESC
              : SortDirection.ASC
            : DEFAULT_DIRECTION;

        if (nextSort === DEFAULT_NFT_SORT) {
          params.delete("sort");
        } else {
          params.set("sort", nextSort);
        }

        if (nextDirection === DEFAULT_DIRECTION) {
          params.delete("dir");
        } else {
          params.set("dir", nextDirection.toLowerCase());
        }

        params.set("page", "1");
      });
    },
    [handleUpdateParams]
  );

  const handleCollectionsFilterChange = useCallback(
    (nextSelected: string[]) => {
      handleUpdateParams((params) => {
        if (nextSelected.length) {
          params.set(COLLECTION_QUERY_PARAM, nextSelected.join(","));
        } else {
          params.delete(COLLECTION_QUERY_PARAM);
        }
        params.set("page", "1");
      });
    },
    [handleUpdateParams]
  );

  const handleClearFilters = useCallback(() => {
    handleUpdateParams((params) => {
      params.delete(COLLECTION_QUERY_PARAM);
      params.delete(MIN_RATE_QUERY_PARAM);
      params.delete(MIN_GRANTORS_QUERY_PARAM);
      params.set("page", "1");
    });
  }, [handleUpdateParams]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      handleUpdateParams((params) => {
        params.set("page", nextPage.toString());
      });
    },
    [handleUpdateParams]
  );

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const [expandedTokens, setExpandedTokens] = useState<Record<string, boolean>>({});
  const toggleToken = useCallback((tokenId: string) => {
    setExpandedTokens((prev) => ({
      ...prev,
      [tokenId]: !prev[tokenId],
    }));
  }, []);

  const resultSummary = useMemo(() => {
    if (!profileId) {
      return "Connect or select a profile to view received xTDH.";
    }
    if (isLoading) {
      return "Loading NFTs…";
    }
    if (isFetching) {
      return "Updating NFTs…";
    }
    const label = totalCount === 1 ? "NFT" : "NFTs";
    return `Showing ${totalCount.toLocaleString()} ${label}`;
  }, [isFetching, isLoading, profileId, totalCount]);

  if (!profileId) {
    return (
      <EmptyState message="Unable to determine which profile to load." />
    );
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "";
    return (
      <ErrorState message={errorMessage} onRetry={handleRetry} />
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div
        className="tw-flex tw-flex-col tw-gap-3"
        role="region"
        aria-label="Filter and sort controls"
      >
        <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4">
          <div className="tw-w-full lg:tw-w-64">
            <CollectionsAutocomplete
              options={collectionFilterOptions}
              value={selectedCollections}
              onChange={handleCollectionsFilterChange}
              disabled={isLoading || isFetching}
              label="Collections"
            />
          </div>
          <div className="tw-w-full lg:tw-w-auto">
            <CommonSelect
              items={NFT_SORT_ITEMS}
              activeItem={activeSort}
              filterLabel="Sort NFTs"
              setSelected={handleSortChange}
              sortDirection={activeDirection}
              disabled={isLoading}
            />
          </div>
          {filtersAreActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="tw-self-start tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <span
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="tw-text-sm tw-text-iron-300"
          >
            {resultSummary}
          </span>
          <div className="tw-flex tw-justify-end sm:tw-justify-end">
            <ViewToggle
              view={view}
              onViewChange={onViewChange}
              announcement={announcement}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <NftSkeleton />
      ) : nfts.length === 0 ? (
        filtersAreActive ? (
          <EmptyState
            message="No NFTs match your filters."
            actionLabel="Clear filters"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState message="You don't hold any NFTs currently receiving xTDH grants. When others grant xTDH to collections you hold, they will appear here." />
        )
      ) : (
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3" role="list" aria-label="NFTs receiving xTDH">
          {nfts.map((nft) => (
            <NftCard
              key={nft.tokenId}
              nft={nft}
              expanded={!!expandedTokens[nft.tokenId]}
              onToggle={() => toggleToken(nft.tokenId)}
            />
          ))}
        </div>
      )}

      {nfts.length > 0 && totalPages > 1 && (
        <CommonTablePagination
          small={true}
          currentPage={page}
          setCurrentPage={handlePageChange}
          totalPages={totalPages}
          haveNextPage={haveNextPage}
          loading={isFetching}
        />
      )}
    </div>
  );
}

function CollectionCard({
  collection,
  expanded,
  onToggle,
  expandedTokens,
  onToggleToken,
}: {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly expandedTokens: Record<string, boolean>;
  readonly onToggleToken: (tokenId: string) => void;
}) {
  const additionalGranters = Math.max(
    collection.granterCount - collection.granterPreviews.length,
    0
  );

  return (
    <div
      className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4"
      role="listitem"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`Toggle ${collection.collectionName} collection`}
        className="tw-w-full tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-text-left tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-600"
      >
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-3">
            <img
              src={collection.collectionImage}
              alt={`${collection.collectionName} artwork`}
              className="tw-h-14 tw-w-14 tw-rounded-xl tw-object-cover tw-border tw-border-iron-700"
              loading="lazy"
            />
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-base tw-font-semibold tw-text-iron-50">
                {collection.collectionName}
              </span>
              <span className="tw-text-xs tw-text-iron-300">
                {collection.tokenCount.toLocaleString()} tokens receiving xTDH
              </span>
            </div>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
                Total xTDH Rate
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                {formatRate(collection.totalXtdhRate)}
              </span>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
                Total Received
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                {formatTotal(collection.totalXtdhReceived)}
              </span>
            </div>
            <GranterAvatarGroup
              granters={collection.granterPreviews}
              granterCount={collection.granterCount}
              additional={additionalGranters}
            />
            <span
              className="tw-ml-auto tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-850 tw-text-sm tw-text-iron-200"
              aria-hidden
            >
              {expanded ? "−" : "+"}
            </span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="tw-mt-4 tw-space-y-3">
          {collection.tokens.length === 0 ? (
            <EmptyState message="No tokens found in this collection." />
          ) : (
            collection.tokens.map((token) => (
              <TokenRow
                key={token.tokenId}
                token={token}
                expanded={!!expandedTokens[token.tokenId]}
                onToggle={() => onToggleToken(token.tokenId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TokenRow({
  token,
  expanded,
  onToggle,
}: {
  readonly token: XtdhReceivedToken;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}) {
  const additionalGranters = Math.max(
    token.granterCount - token.granterPreviews.length,
    0
  );

  const granterPanelId = `token-granters-${token.tokenId}`;

  return (
    <div className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <img
            src={token.tokenImage}
            alt={`${token.tokenName} artwork`}
            className="tw-h-12 tw-w-12 tw-rounded-lg tw-object-cover tw-border tw-border-iron-700"
            loading="lazy"
          />
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {token.tokenName}
            </span>
            <span className="tw-text-xs tw-text-iron-300">
              {formatRate(token.xtdhRate)}
            </span>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-1">
            <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
              Total Received
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
              {formatTotal(token.totalXtdhReceived)}
            </span>
          </div>
          <GranterAvatarGroup
            granters={token.granterPreviews}
            granterCount={token.granterCount}
            additional={additionalGranters}
          />
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={granterPanelId}
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-850 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
          >
            {expanded ? "Hide granters" : "View granters"}
          </button>
        </div>
      </div>
      {expanded && (
        <div
          id={granterPanelId}
          className="tw-mt-4 tw-space-y-2"
          role="region"
          aria-label={`Granters for ${token.tokenName}`}
        >
          {token.granters.map((granter) => (
            <GranterRow key={`${token.tokenId}-${granter.profileId}`} granter={granter} />
          ))}
        </div>
      )}
    </div>
  );
}

function NftCard({
  nft,
  expanded,
  onToggle,
}: {
  readonly nft: XtdhReceivedNft;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}) {
  const additionalGranters = Math.max(nft.granterCount - nft.granterPreviews.length, 0);
  const granterPanelId = `nft-granters-${nft.tokenId}`;

  return (
    <div
      className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-flex tw-flex-col tw-gap-4"
      role="listitem"
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        <img
          src={nft.tokenImage}
          alt={`${nft.tokenName} artwork`}
          className="tw-h-16 tw-w-16 tw-rounded-xl tw-object-cover tw-border tw-border-iron-700"
          loading="lazy"
        />
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {nft.tokenName}
          </span>
          <span className="tw-text-xs tw-text-iron-300">
            {nft.collectionName}
          </span>
          <span className="tw-text-xs tw-text-iron-300">
            {formatRate(nft.xtdhRate)}
          </span>
        </div>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
            Total Received
          </span>
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
            {formatTotal(nft.totalXtdhReceived)}
          </span>
        </div>
        <GranterAvatarGroup
          granters={nft.granterPreviews}
          granterCount={nft.granterCount}
          additional={additionalGranters}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={granterPanelId}
          className="tw-ml-auto tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-850 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        >
          {expanded ? "Hide granters" : "View granters"}
        </button>
      </div>
      {expanded && (
        <div
          id={granterPanelId}
          className="tw-space-y-2"
          role="region"
          aria-label={`Granters for ${nft.tokenName}`}
        >
          {nft.granters.map((granter) => (
            <GranterRow key={`${nft.tokenId}-${granter.profileId}`} granter={granter} />
          ))}
        </div>
      )}
    </div>
  );
}

function GranterRow({ granter }: { readonly granter: XtdhGranter }) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-3">
      <div className="tw-flex tw-items-center tw-gap-3">
        <img
          src={granter.profileImage}
          alt={`${granter.displayName} avatar`}
          className="tw-h-9 tw-w-9 tw-rounded-full tw-object-cover tw-border tw-border-iron-700"
          loading="lazy"
        />
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <Link
            href={`/${encodeURIComponent(granter.profileId)}/xtdh`}
            className="tw-text-sm tw-font-semibold tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
          >
            {granter.displayName}
          </Link>
          <span className="tw-text-xs tw-text-iron-300">
            @{granter.profileId}
          </span>
        </div>
      </div>
      <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
        {formatRate(granter.xtdhRateGranted)}
      </span>
    </div>
  );
}

function GranterAvatarGroup({
  granters,
  granterCount,
  additional,
}: {
  readonly granters: XtdhGranterPreview[];
  readonly granterCount: number;
  readonly additional: number;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <div className="tw-flex -tw-space-x-2">
        {granters.map((granter) => (
          <img
            key={granter.profileId}
            src={granter.profileImage}
            alt={`${granter.displayName} avatar`}
            className="tw-h-7 tw-w-7 tw-rounded-full tw-border tw-border-iron-800 tw-object-cover"
            loading="lazy"
          />
        ))}
      </div>
      <span className="tw-text-xs tw-text-iron-300">
        {granterCount.toLocaleString()} granter{granterCount === 1 ? "" : "s"}
      </span>
      {additional > 0 && (
        <span className="tw-text-xs tw-font-semibold tw-text-iron-200">
          +{additional} more
        </span>
      )}
    </div>
  );
}

function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-6 tw-text-sm tw-text-iron-300">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-black hover:tw-bg-primary-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  const resolvedMessage = message || "Failed to load xTDH received data.";
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2 tw-rounded-2xl tw-border tw-border-red-500/40 tw-bg-red-500/10 tw-p-6">
      <p className="tw-text-sm tw-text-red-200 tw-m-0" role="alert">
        {resolvedMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-black hover:tw-bg-primary-400"
      >
        Retry
      </button>
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="tw-space-y-3">
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="tw-animate-pulse tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4"
        >
          <div className="tw-h-16 tw-rounded-xl tw-bg-iron-800" />
        </div>
      ))}
    </div>
  );
}

function NftSkeleton() {
  return (
    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-3">
      {[0, 1, 2, 3].map((key) => (
        <div
          key={key}
          className="tw-animate-pulse tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4"
        >
          <div className="tw-h-20 tw-rounded-xl tw-bg-iron-800" />
        </div>
      ))}
    </div>
  );
}
