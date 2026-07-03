import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import WebSidebarNav from "@/components/layout/sidebar/WebSidebarNav";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: false }),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));

jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => ({ canAccessLanding: false }),
}));

jest.mock("@/hooks/useUnreadIndicator", () => ({
  useUnreadIndicator: () => ({ hasUnread: false }),
}));

const mockUsePathname = usePathname as jest.Mock;

describe("WebSidebarNav", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/waves");
  });

  it("renders Waves as a direct /waves link instead of an expandable trigger", () => {
    render(<WebSidebarNav isCollapsed={false} />);

    expect(screen.getByRole("link", { name: "Waves" })).toHaveAttribute(
      "href",
      "/waves"
    );
    expect(screen.queryByRole("button", { name: "Waves" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Discover Waves" })).toBeNull();
  });

  it("keeps Waves active for nested wave routes", () => {
    mockUsePathname.mockReturnValue("/waves/example-wave");

    render(<WebSidebarNav isCollapsed={true} />);

    expect(screen.getByRole("link", { name: "Waves" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("keeps Waves active when users are on Discover Waves", () => {
    mockUsePathname.mockReturnValue("/discover");

    render(<WebSidebarNav isCollapsed={false} />);

    const wavesLink = screen.getByRole("link", { name: "Waves" });
    expect(wavesLink).toHaveAttribute("href", "/waves");
    expect(wavesLink).toHaveAttribute("aria-current", "location");
    expect(screen.queryByRole("link", { name: "Discover Waves" })).toBeNull();
  });
});
