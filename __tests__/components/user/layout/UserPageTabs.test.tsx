import { AuthContext } from "@/components/auth/Auth";
import UserPageTabs, {
  UserPageTabType,
} from "@/components/user/layout/UserPageTabs";
import { render, screen } from "@testing-library/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
const useCapacitorMock = jest.fn();
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => useCapacitorMock(),
}));
jest.mock("@/components/user/layout/UserPageTab", () => ({
  __esModule: true,
  default: (p: any) => <div data-testid="tab">{p.tab}</div>,
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
  country: string = "US"
) => {
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  (usePathname as jest.Mock).mockReturnValue("/[user]/rep");
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  useCapacitorMock.mockReturnValue({ isIos });
  (useCookieConsent as jest.Mock).mockReturnValue({
    showCookieConsent: false,
    country,
    consent: jest.fn(),
    reject: jest.fn(),
  });
  return render(
    <AuthContext.Provider value={{ showWaves } as any}>
      <UserPageTabs />
    </AuthContext.Provider>
  );
};

describe("UserPageTabs", () => {
  it("filters tabs based on context and platform", () => {
    renderTabs(false, false);
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(UserPageTabType.BRAIN);
    expect(tabs).not.toContain(UserPageTabType.WAVES);
    expect(tabs).toContain(UserPageTabType.SUBSCRIPTIONS);
  });

  it("hides subscriptions tab on iOS and shows waves when enabled", () => {
    renderTabs(true, true, "CA"); // Non-US country to trigger subscription hiding
    const tabs = screen.getAllByTestId("tab").map((t) => t.textContent);
    expect(tabs).not.toContain(UserPageTabType.SUBSCRIPTIONS);
    expect(tabs).toContain(UserPageTabType.WAVES);
  });
});
