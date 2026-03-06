import UserPageStatsActivityWallet, {
  UserPageStatsActivityWalletFilterType,
} from "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    isFetching: false,
    isLoading: false,
    data: { count: 20, data: [] },
  }),
  keepPreviousData: jest.fn(),
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

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

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
});
