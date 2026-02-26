import { AuthContext } from "@/components/auth/Auth";
import UserPageTabs from "@/components/user/layout/UserPageTabs";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { render, screen } from "@testing-library/react";
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

const renderTabs = (
  showWaves: boolean,
  isIos: boolean,
  country: string = "US",
  connectedProfile: any = null
) => {
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  (usePathname as jest.Mock).mockReturnValue("/[user]");
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  (useParams as jest.Mock).mockReturnValue({ user: "testuser" });
  capacitorMock.mockReturnValue({ isIos });
  (useCookieConsent as jest.Mock).mockReturnValue({
    showCookieConsent: false,
    country,
    consent: jest.fn(),
    reject: jest.fn(),
  });
  return render(
    <AuthContext.Provider value={{ showWaves, connectedProfile } as any}>
      <UserPageTabs />
    </AuthContext.Provider>
  );
};

describe("UserPageTabs", () => {
  it("filters tabs based on context and platform", () => {
    renderTabs(false, false);
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.BRAIN);
    expect(tabs).toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
  });

  it("hides subscriptions tab on iOS non-US", () => {
    renderTabs(true, true, "CA");
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.SUBSCRIPTIONS);
  });

  it("shows proxy tab when viewing own profile by handle", () => {
    renderTabs(false, false, "US", {
      normalised_handle: "testuser",
      wallets: [],
    });
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("shows proxy tab when viewing own profile by wallet", () => {
    renderTabs(false, false, "US", {
      normalised_handle: "otherhandle",
      wallets: [{ wallet: "testuser" }],
    });
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("hides proxy tab when viewing another user's profile", () => {
    renderTabs(false, false, "US", {
      normalised_handle: "anotheruser",
      wallets: [{ wallet: "0xSomeOtherWallet" }],
    });
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.PROXY);
  });

  it("hides proxy tab when not connected", () => {
    renderTabs(false, false, "US", null);
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(USER_PAGE_TAB_IDS.PROXY);
  });
});
