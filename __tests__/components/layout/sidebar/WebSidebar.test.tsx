import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, Ref } from "react";
import { useImperativeHandle } from "react";
import WebSidebar from "@/components/layout/sidebar/WebSidebar";

const mockCloseSubmenu = jest.fn();
let mockPathname = "/messages";

jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: null, hasValidWalletAuth: false }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null }),
}));
jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: () => ({ haveUnreadNotifications: false }),
}));
jest.mock("@/hooks/useIsTouchDevice", () => () => false);
jest.mock("@/hooks/useDeviceInfo", () => () => ({ hasTouchScreen: false }));
jest.mock("@/components/common/EnvironmentBadge", () => () => null);
jest.mock(
  "@/components/header/header-search/HeaderSearchModal",
  () => () => null
);
jest.mock("@/components/header/share/HeaderShare", () => () => null);
jest.mock("react-tooltip", () => ({ Tooltip: () => null }));
jest.mock("@/components/layout/sidebar/WebSidebarNav", () => ({
  __esModule: true,
  default: function SidebarNav({
    ref,
  }: {
    ref: Ref<{ closeSubmenu: () => void }>;
  }) {
    useImperativeHandle(ref, () => ({ closeSubmenu: mockCloseSubmenu }));
    return <nav aria-label="Desktop navigation" />;
  },
}));
jest.mock("@/components/layout/sidebar/WebSidebarUser", () => () => (
  <button type="button">Account</button>
));

type SidebarProps = ComponentProps<typeof WebSidebar>;

const defaultProps: SidebarProps = {
  isCollapsed: true,
  onToggle: jest.fn(),
  isMobile: false,
  isNarrow: false,
  isOffcanvasOpen: false,
  onCloseOffcanvas: jest.fn(),
  sidebarWidth: "80px",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/messages";
});

describe("main sidebar toggle", () => {
  it.each([
    ["collapsed desktop", {}, "Expand", false],
    ["expanded desktop", { isCollapsed: false }, "Collapse", true],
    ["narrow rail", { isNarrow: true }, "Expand", false],
    [
      "narrow overlay",
      { isCollapsed: false, isNarrow: true, isOffcanvasOpen: true },
      "Close",
      true,
    ],
    [
      "small-screen menu",
      { isMobile: true, isOffcanvasOpen: true },
      "Close",
      true,
    ],
  ] as const)(
    "labels %s and exposes its state",
    (_mode, overrides, label, expanded) => {
      render(<WebSidebar {...defaultProps} {...overrides} />);

      const toggle = screen.getByRole("button", {
        name: `${label} main sidebar`,
      });
      expect(toggle).toHaveTextContent(label);
      expect(toggle).toHaveAttribute("aria-expanded", String(expanded));
      expect(toggle).toHaveAttribute("data-tooltip-content", label);
      expect(toggle).toHaveAttribute("data-tooltip-hidden", String(expanded));
      expect(
        screen.queryByRole("button", { name: "Toggle right sidebar" })
      ).not.toBeInTheDocument();

      const account = screen.getByRole("button", { name: "Account" });
      expect(
        account.compareDocumentPosition(toggle) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(screen.getAllByRole("button").at(-1)).toBe(toggle);

      fireEvent.click(toggle);
      expect(mockCloseSubmenu).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
    }
  );

  it("unmounts the small-screen sidebar when closed", () => {
    render(<WebSidebar {...defaultProps} isMobile />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("preserves overlay dismissal by Escape, backdrop, and route changes", () => {
    const props = {
      ...defaultProps,
      isNarrow: true,
      isOffcanvasOpen: true,
      isCollapsed: false,
    };
    const { rerender } = render(<WebSidebar {...props} />);
    fireEvent.keyDown(globalThis.window, { key: "Escape" });
    expect(defaultProps.onCloseOffcanvas).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Close menu overlay" }));
    expect(defaultProps.onCloseOffcanvas).toHaveBeenCalledTimes(2);
    mockPathname = "/waves";
    rerender(<WebSidebar {...props} />);
    expect(defaultProps.onCloseOffcanvas).toHaveBeenCalledTimes(3);
  });
});
