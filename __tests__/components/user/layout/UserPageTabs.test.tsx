import UserPageTabs from "@/components/user/layout/UserPageTabs";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { render, screen, waitFor } from "@testing-library/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
}));
const useAuthMock = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => useAuthMock(),
}));
const useSeizeConnectContextMock = jest.fn();
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => useSeizeConnectContextMock(),
}));
const capacitorMock = jest.fn();
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => capacitorMock(),
}));
jest.mock("@/components/user/layout/UserPageTab", () => ({
  __esModule: true,
  default: (p: any) => (
    <div
      data-testid="tab"
      data-active={p.activeTabId === p.tab.id ? "true" : "false"}
    >
      {p.tab.id}
    </div>
  ),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));

const {
  useCookieConsent,
} = require("@/components/cookies/CookieConsentContext");

const getTabIds = () =>
  screen.getAllByTestId("tab").map((tab) => tab.textContent);

const getActiveTabIds = () =>
  screen
    .getAllByTestId("tab")
    .filter((tab) => tab.getAttribute("data-active") === "true")
    .map((tab) => tab.textContent);

const renderTabs = ({
  showWaves,
  isIos,
  country = "US",
  connectedProfile = null,
  fetchingProfile = false,
  pathname = "/[user]",
  address = undefined,
  connectionState = "disconnected",
}: {
  showWaves: boolean;
  isIos: boolean;
  country?: string;
  connectedProfile?: any;
  fetchingProfile?: boolean;
  pathname?: string;
  address?: string;
  connectionState?:
    | "initializing"
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";
}) => {
  const router = { push: jest.fn(), replace: jest.fn() };
  (useRouter as jest.Mock).mockReturnValue(router);
  (usePathname as jest.Mock).mockReturnValue(pathname);
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  (useParams as jest.Mock).mockReturnValue({ user: "testuser" });
  capacitorMock.mockReturnValue({ isIos });
  (useCookieConsent as jest.Mock).mockReturnValue({
    showCookieConsent: false,
    country,
    consent: jest.fn(),
    reject: jest.fn(),
  });
  useAuthMock.mockReturnValue({
    showWaves,
    connectedProfile,
    fetchingProfile,
  });
  useSeizeConnectContextMock.mockReturnValue({
    address,
    connectionState,
  });
  return {
    router,
    ...render(<UserPageTabs />),
  };
};

describe("UserPageTabs", () => {
  it("filters tabs based on context and platform", () => {
    renderTabs({ showWaves: false, isIos: false });
    const tabs = getTabIds();
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.BRAIN);
    expect(tabs).not.toContain("stats");
    expect(tabs).toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
  });

  it("hides subscriptions tab on iOS non-US", () => {
    renderTabs({ showWaves: true, isIos: true, country: "CA" });
    const tabs = getTabIds();
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
  });

  it("shows proxy tab when viewing own profile by handle", () => {
    renderTabs({
      showWaves: false,
      isIos: false,
      connectedProfile: {
        normalised_handle: "testuser",
        wallets: [],
      },
    });
    const tabs = getTabIds();
    expect(tabs).toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("shows proxy tab when viewing own profile by wallet", () => {
    renderTabs({
      showWaves: false,
      isIos: false,
      connectedProfile: {
        normalised_handle: "otherhandle",
        wallets: [{ wallet: "testuser" }],
      },
    });
    const tabs = getTabIds();
    expect(tabs).toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("hides proxy tab when viewing another user's profile", () => {
    renderTabs({
      showWaves: false,
      isIos: false,
      connectedProfile: {
        normalised_handle: "anotheruser",
        wallets: [{ wallet: "0xSomeOtherWallet" }],
      },
    });
    const tabs = getTabIds();
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("hides proxy tab when not connected", () => {
    renderTabs({ showWaves: false, isIos: false });
    const tabs = getTabIds();
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("keeps the proxy tab visible while ownership is still loading", () => {
    const { router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/proxy",
      fetchingProfile: true,
    });

    const tabs = getTabIds();
    expect(tabs).toContain(USER_PAGE_TAB_IDS.PROXY);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("avoids redirecting away from brain while wallet state is initializing", () => {
    const { router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/brain",
      connectionState: "initializing",
    });

    const tabs = getTabIds();
    const activeTabs = getActiveTabIds();
    expect(tabs).toContain(USER_PAGE_TAB_IDS.BRAIN);
    expect(activeTabs).toEqual([USER_PAGE_TAB_IDS.BRAIN]);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("avoids redirecting away from brain while wallet state is connecting", () => {
    const { router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/brain",
      connectionState: "connecting",
    });

    const tabs = getTabIds();
    const activeTabs = getActiveTabIds();
    expect(tabs).toContain(USER_PAGE_TAB_IDS.BRAIN);
    expect(activeTabs).toEqual([USER_PAGE_TAB_IDS.BRAIN]);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("avoids redirecting away from brain while profile access is still loading", () => {
    const { router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/brain",
      address: "0x1",
      connectionState: "connected",
      fetchingProfile: true,
    });

    const tabs = getTabIds();
    const activeTabs = getActiveTabIds();
    expect(tabs).toContain(USER_PAGE_TAB_IDS.BRAIN);
    expect(activeTabs).toEqual([USER_PAGE_TAB_IDS.BRAIN]);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("redirects away from the brain tab after loading when waves stay unavailable", async () => {
    const { rerender, router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/brain",
      address: "0x1",
      connectionState: "connected",
      fetchingProfile: true,
    });

    useAuthMock.mockReturnValue({
      showWaves: false,
      connectedProfile: null,
      fetchingProfile: false,
    });
    useSeizeConnectContextMock.mockReturnValue({
      address: "0x1",
      connectionState: "connected",
    });

    rerender(<UserPageTabs />);

    await waitFor(() => {
      expect(getTabIds()).not.toContain(USER_PAGE_TAB_IDS.BRAIN);
      expect(getActiveTabIds()).toEqual([USER_PAGE_TAB_IDS.REP]);
      expect(router.replace).toHaveBeenCalledWith("/testuser");
    });
  });

  it("shows the brain tab and avoids redirect once waves become available", async () => {
    const { rerender, router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/brain",
      address: "0x1",
      connectionState: "connected",
      fetchingProfile: true,
    });

    useAuthMock.mockReturnValue({
      showWaves: true,
      connectedProfile: {
        normalised_handle: "testuser",
        wallets: [{ wallet: "0x1" }],
      },
      fetchingProfile: false,
    });
    useSeizeConnectContextMock.mockReturnValue({
      address: "0x1",
      connectionState: "connected",
    });

    rerender(<UserPageTabs />);

    await waitFor(() => {
      const tabs = getTabIds();
      const activeTabs = getActiveTabIds();
      expect(tabs).toContain(USER_PAGE_TAB_IDS.BRAIN);
      expect(activeTabs).toEqual([USER_PAGE_TAB_IDS.BRAIN]);
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  it("redirects away from the proxy tab after loading when the profile is not owned", async () => {
    const { rerender, router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/proxy",
      fetchingProfile: true,
    });

    useAuthMock.mockReturnValue({
      showWaves: false,
      connectedProfile: {
        normalised_handle: "someoneelse",
        wallets: [{ wallet: "0xSomeOtherWallet" }],
      },
      fetchingProfile: false,
    });

    rerender(<UserPageTabs />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/testuser");
    });
  });
});
