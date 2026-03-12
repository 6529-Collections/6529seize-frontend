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
const capacitorMock = jest.fn();
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => capacitorMock(),
}));
jest.mock("@/components/user/layout/UserPageTab", () => ({
  __esModule: true,
  default: (p: any) => <div data-testid="tab">{p.tab.id}</div>,
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: jest.fn(),
}));

const {
  useCookieConsent,
} = require("@/components/cookies/CookieConsentContext");

const renderTabs = ({
  showWaves,
  isIos,
  country = "US",
  connectedProfile = null,
  fetchingProfile = false,
  pathname = "/[user]",
}: {
  showWaves: boolean;
  isIos: boolean;
  country?: string;
  connectedProfile?: any;
  fetchingProfile?: boolean;
  pathname?: string;
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
  return {
    router,
    ...render(<UserPageTabs />),
  };
};

describe("UserPageTabs", () => {
  it("filters tabs based on context and platform", () => {
    renderTabs({ showWaves: false, isIos: false });
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.BRAIN);
    expect(tabs).not.toContain("stats");
    expect(tabs).toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
  });

  it("hides subscriptions tab on iOS non-US", () => {
    renderTabs({ showWaves: true, isIos: true, country: "CA" });
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
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
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
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
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
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
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("hides proxy tab when not connected", () => {
    renderTabs({ showWaves: false, isIos: false });
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("keeps the proxy tab visible while ownership is still loading", () => {
    const { router } = renderTabs({
      showWaves: false,
      isIos: false,
      pathname: "/testuser/proxy",
      fetchingProfile: true,
    });

    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).toContain(USER_PAGE_TAB_IDS.PROXY);
    expect(router.replace).not.toHaveBeenCalled();
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
