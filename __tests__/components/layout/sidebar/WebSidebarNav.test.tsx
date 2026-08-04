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

let mockCanAccessDropForge = false;
jest.mock("@/hooks/useDropForgePermissions", () => ({
  useDropForgePermissions: () => ({
    canAccessLanding: mockCanAccessDropForge,
  }),
}));

const mockUseUnreadIndicator = jest.fn((_props: unknown) => ({
  hasUnread: false,
  unreadCount: 0,
}));
jest.mock("@/hooks/useUnreadIndicator", () => ({
  useUnreadIndicator: (props: unknown) => mockUseUnreadIndicator(props),
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
    mockUsePathname.mockReturnValue("/waves");
    mockCanAccessDropForge = false;
    mockUseUnreadIndicator.mockClear();
  });

  it("requests the shared messages unread indicator", () => {
    render(<WebSidebarNav isCollapsed={false} />);

    expect(mockUseUnreadIndicator).toHaveBeenCalledWith({
      type: "messages",
      handle: null,
    });
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
});
