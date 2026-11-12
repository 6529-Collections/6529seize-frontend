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
  useAuth: () => mockMembershipAuth,
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

let mockCanAccessDropForge = false;

let mockMembershipAuth = {
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
};
let mockConnectionState = "disconnected";
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ connectionState: mockConnectionState }),
}));

let mockModeratorAccess = {
  data: { moderator: false, has_open_reports: false, needs_review_count: 0 },
};
jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => ({
    canAccessLanding: mockCanAccessDropForge,
  }),
}));

jest.mock("@/hooks/useUnreadIndicator", () => ({
  useUnreadIndicator: () => ({ hasUnread: false }),
}));

jest.mock("@/hooks/content-moderation/useContentModeratorAccess", () => ({
  useContentModeratorAccess: () => mockModeratorAccess,
}));

const mockUsePathname = usePathname as jest.Mock;

function expectDocumentOrder(elements: HTMLElement[]) {
  for (let index = 0; index < elements.length - 1; index += 1) {
    const current = elements[index];
    const next = elements[index + 1];

    if (current === undefined || next === undefined) {
      throw new Error("Missing sidebar navigation item");
    }

    const currentRow = current.closest("li");
    const nextRow = next.closest("li");

    expect(currentRow).not.toBeNull();
    expect(nextRow).not.toBeNull();
    expect(currentRow?.nextElementSibling).toBe(nextRow);
  }
}

describe("WebSidebarNav", () => {
  beforeEach(() => {
    mockMembershipAuth = {
      connectedProfile: null,
      isAuthenticated: false,
      fetchingProfile: false,
    };
    mockConnectionState = "disconnected";
    mockUsePathname.mockReturnValue("/waves");
    mockCanAccessDropForge = false;
    mockModeratorAccess = {
      data: {
        moderator: false,
        has_open_reports: false,
        needs_review_count: 0,
      },
    };
  });

  it("shows compact submenu indicators only on expandable items", () => {
    const { rerender } = render(<WebSidebarNav isCollapsed />);
    for (const name of ["NFTs", "About"]) {
      expect(
        screen
          .getByRole("button", { name })
          .querySelector("[data-sidebar-submenu-indicator]")
      ).toBeInTheDocument();
    }
    expect(
      screen
        .getByRole("link", { name: "Museum" })
        .querySelector("[data-sidebar-submenu-indicator]")
    ).toBeNull();
    rerender(<WebSidebarNav isCollapsed={false} />);
    expect(
      document.querySelector("[data-sidebar-submenu-indicator]")
    ).toBeNull();
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

  it("keeps art destinations together and Waves adjacent to DMs", () => {
    mockCanAccessDropForge = true;

    render(<WebSidebarNav isCollapsed={false} />);

    expectDocumentOrder([
      screen.getByRole("button", { name: "NFTs" }),
      screen.getByRole("link", { name: "Museum" }),
      screen.getByRole("link", { name: "Waves" }),
      screen.getByRole("link", { name: "DMs" }),
      screen.getByRole("link", { name: "Join 6529" }),
      screen.getByRole("button", { name: "About" }),
      screen.getByRole("link", { name: "Drop Forge" }),
    ]);
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

  it("hides Drop Forge when the wallet cannot access the landing route", () => {
    render(<WebSidebarNav isCollapsed={false} />);

    expect(screen.queryByRole("link", { name: "Drop Forge" })).toBeNull();
  });

  it("renders Drop Forge as a standalone gated row after About", () => {
    mockCanAccessDropForge = true;

    render(<WebSidebarNav isCollapsed={false} />);

    const aboutButton = screen.getByRole("button", { name: "About" });
    const dropForgeLink = screen.getByRole("link", { name: "Drop Forge" });

    expect(dropForgeLink).toHaveAttribute("href", "/drop-forge");
    expect(
      aboutButton.compareDocumentPosition(dropForgeLink) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("marks Drop Forge active for nested Drop Forge routes", () => {
    mockCanAccessDropForge = true;
    mockUsePathname.mockReturnValue("/drop-forge/craft");

    render(<WebSidebarNav isCollapsed={false} />);

    expect(screen.getByRole("link", { name: "Drop Forge" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("shows WatchTower with an accessible open-report indicator", () => {
    mockModeratorAccess = {
      data: { moderator: true, has_open_reports: false, needs_review_count: 1 },
    };

    render(<WebSidebarNav isCollapsed={false} />);

    expect(
      screen.getByRole("link", {
        name: "WatchTower: Cases need manual review",
      })
    ).toHaveAttribute("href", "/content-moderation");
  });

  it("places WatchTower after Drop Forge when both are available", () => {
    mockCanAccessDropForge = true;
    mockModeratorAccess = {
      data: { moderator: true, has_open_reports: false, needs_review_count: 0 },
    };

    render(<WebSidebarNav isCollapsed={false} />);

    expectDocumentOrder([
      screen.getByRole("link", { name: "Drop Forge" }),
      screen.getByRole("link", { name: "WatchTower" }),
    ]);
  });
  it.each([false, true])(
    "keeps the member slot in place with active Validator (collapsed=%s)",
    (collapsed) => {
      mockMembershipAuth.isAuthenticated = true;
      mockConnectionState = "connected";
      mockUsePathname.mockReturnValue("/validator/status");
      render(<WebSidebarNav isCollapsed={collapsed} />);
      const validator = screen.getByRole("link", { name: "Validator" });
      expect(validator).toHaveAttribute("href", "/validator");
      expect(validator).toHaveAttribute("aria-current", "page");
      expect(validator).toHaveAttribute("data-tooltip-content", "Validator");
      expect(validator).toHaveClass("focus-visible:tw-ring-2");
      expect(screen.queryByRole("link", { name: "Join 6529" })).toBeNull();
      expectDocumentOrder([
        screen.getByRole("link", { name: "DMs" }),
        validator,
        screen.getByRole("button", { name: "About" }),
      ]);
    }
  );

  it("reserves the same slot while wallet and profile restoration settle", () => {
    mockConnectionState = "initializing";
    const { rerender } = render(<WebSidebarNav isCollapsed />);
    const join = screen.getByRole("link", { name: "Join 6529" });
    expect(join.closest("li")).toHaveClass("tw-invisible");
    expect(screen.queryByRole("link", { name: "Validator" })).toBeNull();
    mockConnectionState = "connected";
    mockMembershipAuth.fetchingProfile = true;
    rerender(<WebSidebarNav isCollapsed />);
    expect(join.closest("li")).toHaveClass("tw-invisible");
    mockMembershipAuth.fetchingProfile = false;
    mockMembershipAuth.isAuthenticated = true;
    rerender(<WebSidebarNav isCollapsed />);
    expect(
      screen.getByRole("link", { name: "Validator" }).closest("li")
    ).not.toHaveClass("tw-invisible");
  });

  it.each(["disconnected", "connected", "error"])(
    "keeps Join highlighted for a newcomer (%s)",
    (state) => {
      mockConnectionState = state;
      mockUsePathname.mockReturnValue("/join-6529");
      render(<WebSidebarNav isCollapsed={false} />);
      const join = screen.getByRole("link", { name: "Join 6529" });
      expect(join).toHaveAttribute("aria-current", "page");
      expect(join).toHaveClass("tw-bg-white/5");
      expect(
        join.querySelector(".motion-safe\\:tw-animate-sidebar-control-in")
      ).toBeNull();
      expect(join.closest("li")).not.toHaveClass("tw-invisible");
    }
  );
});
