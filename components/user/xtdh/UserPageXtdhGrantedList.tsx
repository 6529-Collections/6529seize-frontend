"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import { UserPageXtdhGrantedListContent } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantedListContent";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import CommonSelect, {
  type CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import { SortDirection } from "@/entities/ISort";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type GrantedFilterStatus = "ALL" | "PENDING" | "FAILED" | "GRANTED";

export type GrantedSortField =
  | "created_at"
  | "valid_from"
  | "valid_to"
  | "tdh_rate";

const DEFAULT_STATUS: GrantedFilterStatus = "ALL";
const DEFAULT_SORT_FIELD: GrantedSortField = "created_at";
const DEFAULT_DIRECTION = SortDirection.DESC;

const STATUS_LABELS: Record<GrantedFilterStatus, string> = {
  ALL: "All statuses",
  PENDING: "Pending",
  FAILED: "Failed",
  GRANTED: "Granted",
};

const BASE_STATUS_ITEMS: CommonSelectItem<GrantedFilterStatus>[] = [
  { key: "ALL", label: STATUS_LABELS.ALL, value: "ALL" },
  { key: "PENDING", label: STATUS_LABELS.PENDING, value: "PENDING" },
  { key: "FAILED", label: STATUS_LABELS.FAILED, value: "FAILED" },
  { key: "GRANTED", label: STATUS_LABELS.GRANTED, value: "GRANTED" },
];

const SORT_ITEMS: CommonSelectItem<GrantedSortField>[] = [
  { key: "created_at", label: "Created At", value: "created_at" },
  { key: "valid_from", label: "Valid From", value: "valid_from" },
  { key: "valid_to", label: "Valid To", value: "valid_to" },
  { key: "tdh_rate", label: "TDH Rate", value: "tdh_rate" },
];

function parseStatus(value: string | null): GrantedFilterStatus {
  if (!value) return DEFAULT_STATUS;
  const normalized = value.toUpperCase();
  return (
    BASE_STATUS_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_STATUS
  );
}

function parseSortField(value: string | null): GrantedSortField {
  if (!value) return DEFAULT_SORT_FIELD;
  const normalized = value.toLowerCase() as GrantedSortField;
  return (
    SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_SORT_FIELD
  );
}

function parseSortDirection(value: string | null): SortDirection {
  if (!value) return DEFAULT_DIRECTION;
  const normalized = value.trim().toUpperCase();
  return normalized === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC;
}

function normalizeSortDirection(
  value: SortDirection | string
): SortDirection {
  return value === SortDirection.ASC || value === "ASC"
    ? SortDirection.ASC
    : SortDirection.DESC;
}

function formatStatusLabel(
  status: GrantedFilterStatus,
  count: number | undefined
): string {
  const base = STATUS_LABELS[status];
  if (typeof count === "number") {
    return `${base} (${count.toLocaleString()})`;
  }
  return base;
}

export interface UserPageXtdhGrantedListProps {
  readonly grantor: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly isSelf?: boolean;
}

export default function UserPageXtdhGrantedList({
  grantor,
  page = 1,
  pageSize = 25,
  isSelf = false,
}: Readonly<UserPageXtdhGrantedListProps>) {
  const enabled = Boolean(grantor);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeStatus = useMemo(
    () => parseStatus(searchParams?.get("status") ?? null),
    [searchParams]
  );
  const activeSortField = useMemo(
    () => parseSortField(searchParams?.get("sort") ?? null),
    [searchParams]
  );
  const activeSortDirection = useMemo(
    () => parseSortDirection(searchParams?.get("dir") ?? null),
    [searchParams]
  );
  const apiSortDirection = useMemo(
    () => normalizeSortDirection(activeSortDirection),
    [activeSortDirection]
  );

  const updateQueryParams = useCallback(
    (updates: {
      readonly status?: GrantedFilterStatus;
      readonly sort?: GrantedSortField;
      readonly direction?: SortDirection;
    }) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (updates.status !== undefined) {
        if (updates.status === DEFAULT_STATUS) {
          params.delete("status");
        } else {
          params.set("status", updates.status);
        }
      }

      if (updates.sort !== undefined) {
        if (updates.sort === DEFAULT_SORT_FIELD) {
          params.delete("sort");
        } else {
          params.set("sort", updates.sort);
        }
      }

      if (updates.direction !== undefined) {
        if (updates.direction === DEFAULT_DIRECTION) {
          params.delete("dir");
        } else {
          params.set("dir", updates.direction.toLowerCase());
        }
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleStatusChange = useCallback(
    (status: GrantedFilterStatus) => {
      updateQueryParams({ status });
    },
    [updateQueryParams]
  );

  const handleSortFieldChange = useCallback(
    (sort: GrantedSortField) => {
      const nextDirection =
        sort === activeSortField
          ? apiSortDirection === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC
          : DEFAULT_DIRECTION;

      updateQueryParams({ sort, direction: nextDirection });
    },
    [apiSortDirection, activeSortField, updateQueryParams]
  );

  const [statusCounts, setStatusCounts] = useState<
    Partial<Record<GrantedFilterStatus, number>>
  >({});

  useEffect(() => {
    setStatusCounts({});
  }, [grantor]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      QueryKey.TDH_GRANTS,
      grantor,
      page.toString(),
      pageSize.toString(),
      activeStatus,
      activeSortField,
      apiSortDirection,
    ],
    queryFn: async () =>
      await commonApiFetch<ApiTdhGrantsPage>({
        endpoint: "tdh-grants",
        params: {
          grantor,
          page: page.toString(),
          page_size: pageSize.toString(),
          ...(activeStatus !== "ALL" ? { status: activeStatus } : {}),
          sort: activeSortField,
          sort_direction: apiSortDirection,
        },
      }),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const grants = useMemo(() => data?.data ?? [], [data]);
  const totalCount = data?.count ?? 0;

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const errorMessage = error instanceof Error ? error.message : undefined;

  const showControls = enabled && !isError;

  useEffect(() => {
    if (!data) return;
    setStatusCounts((prev) => ({
      ...prev,
      [activeStatus]: data.count,
      ...(activeStatus === "ALL" ? { ALL: data.count } : {}),
    }));
  }, [activeStatus, data]);

  const formattedStatusItems = useMemo(
    () =>
      BASE_STATUS_ITEMS.map((item) => ({
        ...item,
        label: formatStatusLabel(item.value, statusCounts[item.value]),
      })),
    [statusCounts]
  );

  const resultSummary = useMemo(() => {
    if (isError || isLoading) {
      return null;
    }

    if (isFetching) {
      return "Updating granted xTDH…";
    }

    const countText = totalCount.toLocaleString();
    const statusText =
      activeStatus === "ALL"
        ? "grants"
        : `${STATUS_LABELS[activeStatus].toLowerCase()} grants`;

    return `Showing ${countText} ${statusText}`;
  }, [activeStatus, isError, isFetching, isLoading, totalCount]);

  return (
    <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-4">
      <div className="tw-flex tw-items-center">
        <h2 className="tw-text-base tw-font-semibold tw-text-iron-100 tw-m-0">
          Granted xTDH
        </h2>
      </div>
      {showControls && (
        <div
          className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between"
          role="region"
          aria-label="Filter and sort controls">
          <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4">
            <div className="tw-w-full lg:tw-w-56">
              <CommonDropdown
                items={formattedStatusItems}
                activeItem={activeStatus}
                filterLabel="Filter by status"
                setSelected={handleStatusChange}
                disabled={isFetching || isLoading}
              />
            </div>
            <div className="tw-w-full lg:tw-w-auto">
              <CommonSelect
                items={SORT_ITEMS}
                activeItem={activeSortField}
                filterLabel="Sort by"
                setSelected={handleSortFieldChange}
                sortDirection={activeSortDirection}
                disabled={isFetching || isLoading}
              />
            </div>
          </div>
          {resultSummary && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="tw-text-sm tw-text-iron-300">
              {resultSummary}
            </div>
          )}
        </div>
      )}
      <UserPageXtdhGrantedListContent
        enabled={enabled}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        grants={grants}
        isSelf={isSelf}
        onRetry={handleRetry}
        status={activeStatus}
      />
    </div>
  );
}
