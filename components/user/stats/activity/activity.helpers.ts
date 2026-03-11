import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export const ACTIVITY_PAGE_SIZE = 10;
export const SEARCH_PARAM_ACTIVITY = "activity";
export const WALLET_ACTIVITY_FILTER_PARAM = "wallet-activity";
export const WALLET_ACTIVITY_PAGE_PARAM = "page";
export const WALLET_DISTRIBUTION_PAGE_PARAM = "page";

const getTotalPages = (count: number | undefined, pageSize: number) =>
  typeof count === "number" && count > 0
    ? Math.max(1, Math.ceil(count / pageSize))
    : 1;

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
