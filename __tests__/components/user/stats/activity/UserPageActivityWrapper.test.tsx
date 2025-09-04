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
    get: (k: string) => search.get(k),
    toString: () =>
      Array.from(search)
        .map(([k, v]) => `${k}=${v}`)
        .join("&"),
  }),
}));

jest.mock(
  "@/components/user/stats/activity/tabs/UserPageActivityTabs",
  () => (props: any) =>
    (
      <button
        data-testid="tab"
        onClick={() =>
          props.setActiveTab(USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS)
        }>
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

test("sets initial tab from query and navigates on change", async () => {
  search.set("activity", "tdh-history");
  search.set("wallet-activity", "x");
  search.set("page", "2");
  const user = userEvent.setup();
  render(<UserPageActivityWrapper profile={profile} activeAddress={null} />);
  // initial
  expect(screen.getByTestId("tdh")).toBeInTheDocument();
  await user.click(screen.getByTestId("tab"));
  expect(replace).toHaveBeenCalledWith("/profile?activity=distributions", {
    scroll: false,
  });
});
