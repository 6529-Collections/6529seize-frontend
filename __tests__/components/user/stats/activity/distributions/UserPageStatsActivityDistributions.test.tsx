import UserPageStatsActivityDistributions from "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributions";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableWrapper",
  () => (props: any) => (
    <div data-testid="wrapper" data-page={props.page}>
      <button data-testid="set-page" onClick={() => props.setPage(3)}>
        set
      </button>
    </div>
  )
);

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({
    isFetching: false,
    isLoading: false,
    data: { count: 20, page: 1, data: [] },
  })),
  keepPreviousData: {},
}));

test("updates local page state", async () => {
  const profile = { wallets: [] } as any;
  render(
    <UserPageStatsActivityDistributions
      profile={profile}
      activeAddress={null}
    />
  );
  expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "1");
  await userEvent.click(screen.getByTestId("set-page"));
  expect(screen.getByTestId("wrapper")).toHaveAttribute("data-page", "2");
});
