import UserPageTabs from "@/components/user/layout/UserPageTabs";
import { getUserProfileTabsMessage } from "@/components/user/layout/user-tabs.messages";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
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
const useIdentityMock = jest.fn();
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => useIdentityMock(),
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

const initialProfile = Object.assign(new ApiIdentity(), {
  profile_wave_id: null,
});

const renderTabs = ({
  showWaves,
  isIos,
  country = "US",
  isCountryPending = false,
  connectedProfile = null,
  fetchingProfile = false,
  pathname = "/[user]",
  address = undefined,
  connectionState = "disconnected",
}: {
  showWaves: boolean;
  isIos: boolean;
  country?: string;
  isCountryPending?: boolean;
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
    isCountryPending,
    consent: jest.fn(),
    reject: jest.fn(),
  });
  useAuthMock.mockReturnValue({
    showWaves,
    connectedProfile,
    fetchingProfile,
  });
  useIdentityMock.mockReturnValue({
    profile: { profile_wave_id: null },
    isLoading: false,
  });
  useSeizeConnectContextMock.mockReturnValue({
    address,
    connectionState,
  });
  return {
    router,
    ...render(<UserPageTabs initialProfile={initialProfile} />),
  };
};

describe("UserPageTabs", () => {
  it("filters tabs based on context and platform", () => {
    renderTabs({ showWaves: false, isIos: false });
    expect(
      screen.getByRole("navigation", {
        name: getUserProfileTabsMessage("user.profile.tabs.navigationLabel"),
      })
    ).toBeInTheDocument();
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

  it("redirects a direct subscription visit to Identity on restricted iOS", () => {
    const { router } = renderTabs({
      showWaves: true,
      isIos: true,
      country: "CY",
      pathname: "/testuser/subscriptions",
    });
    expect(router.replace).toHaveBeenCalledWith("/testuser");
    expect(getTabIds()).not.toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
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

    rerender(<UserPageTabs initialProfile={initialProfile} />);

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

    rerender(<UserPageTabs initialProfile={initialProfile} />);

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

    rerender(<UserPageTabs initialProfile={initialProfile} />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/testuser");
    });
  });
});

describe("UserPageTabs iOS country check", () => {
  const subscriptionsPath = "/testuser/subscriptions";

  const settleCountry = (
    rerender: (ui: ReactElement) => void,
    country: string
  ) => {
    (useCookieConsent as jest.Mock).mockReturnValue({
      showCookieConsent: false,
      country,
      isCountryPending: false,
      consent: jest.fn(),
      reject: jest.fn(),
    });
    rerender(<UserPageTabs initialProfile={initialProfile} />);
  };

  const renderPendingIosDeepLink = () =>
    renderTabs({
      showWaves: true,
      isIos: true,
      country: "",
      isCountryPending: true,
      pathname: subscriptionsPath,
    });

  it("keeps the subscriptions URL hidden but in place while the lookup is pending", () => {
    const { router } = renderPendingIosDeepLink();

    expect(getTabIds()).not.toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
    expect(getActiveTabIds()).toEqual([]);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("shows the subscriptions tab in place when the lookup settles to US", async () => {
    const { rerender, router } = renderPendingIosDeepLink();

    settleCountry(rerender, "US");

    await waitFor(() => {
      expect(getTabIds()).toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
      expect(getActiveTabIds()).toEqual([USER_PAGE_TAB_IDS.SUBSCRIPTIONS]);
    });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it.each([
    ["a non-US country", "FR"],
    ["an unknown country", ""],
  ])(
    "redirects to Identity when the lookup settles with %s",
    async (_label, country) => {
      const { rerender, router } = renderPendingIosDeepLink();
      expect(router.replace).not.toHaveBeenCalled();

      settleCountry(rerender, country);

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith("/testuser");
      });
      expect(getTabIds()).not.toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
      expect(getActiveTabIds()).toEqual([USER_PAGE_TAB_IDS.REP]);
    }
  );

  it("does not make Android or web wait for the lookup", () => {
    const { router } = renderTabs({
      showWaves: true,
      isIos: false,
      country: "",
      isCountryPending: true,
      pathname: subscriptionsPath,
    });

    expect(getTabIds()).toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
    expect(getActiveTabIds()).toEqual([USER_PAGE_TAB_IDS.SUBSCRIPTIONS]);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
