import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserPageStatsActivityWallet from "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet";
import { UserPageStatsActivityWalletFilterType } from "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet.types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = jest.fn();
const search = new Map<string, string>();
const mockUseQuery = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/path",
  useSearchParams: () => ({
    get: (key: string) => search.get(key) ?? null,
    toString: () =>
      new URLSearchParams(Array.from(search.entries())).toString(),
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  keepPreviousData: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/user/stats/activity/wallet/table/UserPageStatsActivityWalletTableWrapper",
  () =>
    (props: {
      filter: UserPageStatsActivityWalletFilterType;
      page: number;
      onActiveFilter: (filter: UserPageStatsActivityWalletFilterType) => void;
      setPage: (page: number) => void;
    }) => (
      <div
        data-testid="wrapper"
        data-filter={props.filter}
        data-page={props.page}
      >
        <button
          data-testid="set-filter"
          onClick={() =>
            props.onActiveFilter(UserPageStatsActivityWalletFilterType.MINTS)
          }
        >
          filter
        </button>
        <button data-testid="set-page" onClick={() => props.setPage(3)}>
          page
        </button>
      </div>
    )
);

beforeEach(() => {
  replace.mockClear();
  search.clear();
  mockUseQuery.mockReset();
  mockUseQuery.mockImplementation((config: { queryKey: unknown[] }) => {
    if (config.queryKey[0] === QueryKey.PROFILE_TRANSACTIONS) {
      return {
        isFetching: false,
        isLoading: false,
        data: { count: 20, page: 2, data: [] },
      };
    }

    return {
      isFetching: false,
      isLoading: false,
      data: [],
    };
  });
});

describe("UserPageStatsActivityWallet", () => {
  it("hydrates filter and page state from the query string", async () => {
    search.set("wallet-activity", "mints");
    search.set("page", "2");

    render(
      <UserPageStatsActivityWallet
        profile={{ wallets: [] } as any}
        activeAddress={null}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId("wrapper")).toHaveAttribute(
        "data-filter",
        "MINTS"
      )
    );
    expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "2");
  });

  it("updates the url when the filter or page changes", async () => {
    const user = userEvent.setup();

    render(
      <UserPageStatsActivityWallet
        profile={{ wallets: [] } as any}
        activeAddress={null}
      />
    );

    await user.click(screen.getByTestId("set-filter"));
    expect(replace).toHaveBeenCalledWith("/path?wallet-activity=mints&page=1", {
      scroll: false,
    });

    replace.mockClear();

    await user.click(screen.getByTestId("set-page"));
    expect(replace).toHaveBeenCalledWith("/path?page=3", { scroll: false });
  });
});
