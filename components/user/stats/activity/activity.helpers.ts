import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useCallback, useEffect, useReducer } from "react";

export const ACTIVITY_PAGE_SIZE = 10;

const getTotalPages = (count: number | undefined, pageSize: number) =>
  typeof count === "number" && count > 0
    ? Math.max(1, Math.ceil(count / pageSize))
    : 1;

type PageFilterAction = {
  readonly type: "set";
  readonly page: number;
};

const pageFilterReducer = (_state: number, action: PageFilterAction): number =>
  action.page;

export const getActivityWalletsParam = ({
  activeAddress,
  wallets,
}: {
  readonly activeAddress: string | null;
  readonly wallets: ApiIdentity["wallets"];
}) => {
  if (activeAddress) {
    return activeAddress.toLowerCase();
  }

  return (wallets ?? []).map((wallet) => wallet.wallet.toLowerCase()).join(",");
};

export function useActivityPageFilter() {
  const [pageFilter, dispatchPageFilter] = useReducer(pageFilterReducer, 1);

  const setPage = useCallback((nextPage: number) => {
    dispatchPageFilter({
      type: "set",
      page: nextPage,
    });
  }, []);

  return {
    pageFilter,
    setPage,
  };
}

export function useSyncActivityPageFilter({
  count,
  isFetching,
  pageFilter,
  pageSize,
  setPage,
}: {
  readonly count: number | undefined;
  readonly isFetching: boolean;
  readonly pageFilter: number;
  readonly pageSize: number;
  readonly setPage: (nextPage: number) => void;
}) {
  useEffect(() => {
    if (isFetching || count === undefined) {
      return;
    }

    if (count === 0) {
      if (pageFilter !== 1) {
        setPage(1);
      }
      return;
    }

    const totalPages = getTotalPages(count, pageSize);
    if (pageFilter > totalPages) {
      setPage(totalPages);
    }
  }, [count, isFetching, pageFilter, pageSize, setPage]);
}

export const getActivityPaginationState = ({
  count,
  page,
  pageFilter,
  pageSize,
}: {
  readonly count: number | undefined;
  readonly page: number | undefined;
  readonly pageFilter: number;
  readonly pageSize: number;
}) => {
  const totalPages = getTotalPages(count, pageSize);
  const responsePage = typeof page === "number" ? page : pageFilter;
  const currentPage =
    typeof count === "number" && count > 0
      ? Math.min(responsePage, totalPages)
      : 1;

  return {
    currentPage,
    totalPages,
  };
};
