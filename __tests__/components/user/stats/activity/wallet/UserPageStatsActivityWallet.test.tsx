import UserPageStatsActivityWallet, {
  UserPageStatsActivityWalletFilterType,
} from "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  keepPreviousData: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock(
  "@/components/user/stats/activity/wallet/table/UserPageStatsActivityWalletTableWrapper",
  () => (props: any) => {
    return (
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
    );
  }
);

const mockedCommonApiFetch = jest.mocked(commonApiFetch);

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseQuery.mockImplementation(() => ({
    isFetching: false,
    isLoading: false,
    data: { count: 20, data: [] },
  }));
  mockedCommonApiFetch.mockReset();
});

describe("UserPageStatsActivityWallet", () => {
  it("updates local filter and page state", async () => {
    const user = userEvent.setup();
    render(
      <UserPageStatsActivityWallet
        profile={{ wallets: [] } as any}
        activeAddress={null}
      />
    );

    expect(screen.getByTestId("wrapper")).toHaveAttribute("data-filter", "ALL");
    expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "1");

    await user.click(screen.getByTestId("set-page"));
    expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "2");

    await user.click(screen.getByTestId("set-filter"));
    expect(screen.getByTestId("wrapper")).toHaveAttribute(
      "data-filter",
      "MINTS"
    );
    expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "1");
  });

  it("fetches only the requested page for the current query key", async () => {
    const user = userEvent.setup();

    render(
      <UserPageStatsActivityWallet
        profile={{ wallets: [] } as any}
        activeAddress={null}
      />
    );

    await user.click(screen.getByTestId("set-page"));

    await waitFor(() =>
      expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "2")
    );

    const transactionsQuery = mockUseQuery.mock.calls
      .map(([config]) => config)
      .find(
        (config) =>
          config.queryKey[0] === QueryKey.PROFILE_TRANSACTIONS &&
          config.queryKey[1].page === "3"
      );

    if (!transactionsQuery) {
      throw new Error("Expected a transactions query for page 3");
    }

    mockedCommonApiFetch.mockResolvedValueOnce({
      count: 20,
      page: 3,
      next: null,
      data: [],
    } as any);

    await transactionsQuery.queryFn();

    expect(mockedCommonApiFetch).toHaveBeenCalledTimes(1);
    expect(mockedCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "transactions",
      params: {
        wallet: "",
        page_size: "10",
        page: "3",
      },
    });
  });
});
