import UserPageActivityWrapper, {
  USER_PAGE_ACTIVITY_TAB,
} from "@/components/user/stats/activity/UserPageActivityWrapper";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = jest.fn();
const search = new Map<string, string>();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/profile",
  useSearchParams: () => ({
    get: (key: string) => search.get(key) ?? null,
    toString: () =>
      new URLSearchParams(Array.from(search.entries())).toString(),
  }),
}));

jest.mock(
  "@/components/user/stats/activity/tabs/UserPageActivityTabs",
  () => (props: { setActiveTab: (tab: USER_PAGE_ACTIVITY_TAB) => void }) => (
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

beforeEach(() => {
  replace.mockClear();
  search.clear();
});

test("hydrates the active tab from query params and updates the url on change", async () => {
  const user = userEvent.setup();

  search.set("activity", "tdh-history");
  search.set("wallet-activity", "airdrops");
  search.set("page", "2");

  render(<UserPageActivityWrapper profile={profile} activeAddress={null} />);

  expect(screen.getByTestId("tdh")).toBeInTheDocument();

  await user.click(screen.getByTestId("tab"));

  expect(replace).toHaveBeenCalledWith("/profile?activity=distributions", {
    scroll: false,
  });
});
