import UserPageActivityWrapper from "@/components/user/stats/activity/UserPageActivityWrapper";
import { USER_PAGE_ACTIVITY_TAB } from "@/components/user/stats/activity/activity.types";
import {
  getActivityPanelId,
  getActivityTabId,
} from "@/components/user/stats/activity/tabs/activity-tabs.helpers";
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
  () =>
    (props: {
      locale: string;
      setActiveTab: (tab: USER_PAGE_ACTIVITY_TAB) => void;
    }) => (
      <button
        data-testid="tab"
        data-locale={props.locale}
        onClick={() => props.setActiveTab(USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS)}
      >
        tab
      </button>
    )
);

jest.mock(
  "@/components/user/stats/activity/wallet/UserPageStatsActivityWallet",
  () => (props: { locale: string }) => (
    <div data-testid="wallet" data-locale={props.locale} />
  )
);
jest.mock(
  "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributions",
  () => (props: { locale: string }) => (
    <div data-testid="dist" data-locale={props.locale} />
  )
);
jest.mock(
  "@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistory",
  () => (props: { locale: string }) => (
    <div data-testid="tdh" data-locale={props.locale} />
  )
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
  search.set("wallet-activity-page", "2");
  search.set("distribution-page", "3");
  search.set("page", "2");
  search.set("locale", "de-DE");

  render(
    <UserPageActivityWrapper
      profile={profile}
      activeAddress={null}
      locale="de-DE"
    />
  );

  expect(screen.getByTestId("tdh")).toBeInTheDocument();
  expect(screen.getByTestId("tdh")).toHaveAttribute("data-locale", "de-DE");
  expect(screen.getByTestId("tab")).toHaveAttribute("data-locale", "de-DE");
  const activePanel = screen.getByRole("tabpanel");
  expect(activePanel).toHaveAttribute(
    "id",
    getActivityPanelId(USER_PAGE_ACTIVITY_TAB.TDH_HISTORY)
  );
  expect(activePanel).toHaveAttribute(
    "aria-labelledby",
    getActivityTabId(USER_PAGE_ACTIVITY_TAB.TDH_HISTORY)
  );

  await user.click(screen.getByTestId("tab"));

  expect(replace).toHaveBeenCalledWith(
    "/profile?activity=distributions&page=2&locale=de-DE",
    {
      scroll: false,
    }
  );
});

test("passes locale to the default wallet panel", () => {
  render(
    <UserPageActivityWrapper
      profile={profile}
      activeAddress={null}
      locale="de-DE"
    />
  );

  expect(screen.getByTestId("wallet")).toHaveAttribute("data-locale", "de-DE");
});
