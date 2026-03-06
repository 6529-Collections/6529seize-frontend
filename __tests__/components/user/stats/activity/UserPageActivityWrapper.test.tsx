import UserPageActivityWrapper, {
  USER_PAGE_ACTIVITY_TAB,
} from "@/components/user/stats/activity/UserPageActivityWrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@/components/user/stats/activity/tabs/UserPageActivityTabs",
  () => (props: any) => (
    <button
      data-testid="tab"
      onClick={() => props.setActiveTab(USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS)}
    >
      tab
    </button>
  )
);

jest.mock(
  "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet",
  () => () => <div data-testid="wallet" />
);
jest.mock(
  "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributions",
  () => () => <div data-testid="dist" />
);
jest.mock(
  "@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistory",
  () => () => <div data-testid="tdh" />
);

const profile = { wallets: [] } as any;

test("switches tabs locally", async () => {
  const user = userEvent.setup();
  render(<UserPageActivityWrapper profile={profile} activeAddress={null} />);
  expect(screen.getByTestId("wallet")).toBeInTheDocument();
  await user.click(screen.getByTestId("tab"));
  expect(screen.getByTestId("dist")).toBeInTheDocument();
});
