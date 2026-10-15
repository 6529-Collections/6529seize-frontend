import WebSidebar from "@/components/layout/sidebar/WebSidebar";
import { fireEvent, render, screen } from "@testing-library/react";

const mockPreloadSite = jest.fn();
const mockSiteIdlePreload = jest.fn();

jest.mock("@/components/header/header-search/LazyHeaderSearchModal", () => ({
  __esModule: true,
  default: () => null,
  preloadHeaderSearchModal: () => mockPreloadSite(),
  useHeaderSearchModalIdlePreload: (enabled?: boolean) =>
    mockSiteIdlePreload(enabled),
}));

jest.mock("next/navigation", () => ({ usePathname: () => "/waves" }));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: false,
    isMobileDevice: false,
    isAppleMobile: false,
    hasTouchScreen: false,
  }),
}));
jest.mock("@/contexts/VersionStatusContext", () => ({
  useVersionStatus: () => true,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: undefined,
    hasValidWalletAuth: false,
  }),
}));
jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: () => ({ haveUnreadNotifications: false }),
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/components/layout/sidebar/WebSidebarNav", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/layout/sidebar/WebSidebarHeader", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/layout/sidebar/WebSidebarUser", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/header/share/HeaderShare", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("react-tooltip", () => ({ Tooltip: () => null }));

const sidebarProps = {
  isCollapsed: true,
  onToggle: jest.fn(),
  isMobile: false,
  isOffcanvasOpen: false,
  onCloseOffcanvas: jest.fn(),
  sidebarWidth: "5rem",
};

beforeEach(() => jest.clearAllMocks());

describe("WebSidebar search chunk warm-up", () => {
  it("asks to warm the search modal when idle, only where the sidebar has desktop search", () => {
    const { rerender } = render(<WebSidebar {...sidebarProps} isMobile />);
    expect(mockSiteIdlePreload).toHaveBeenLastCalledWith(false);

    rerender(<WebSidebar {...sidebarProps} />);
    expect(mockSiteIdlePreload).toHaveBeenLastCalledWith(true);
    // Nothing is fetched eagerly: only the idle hook is involved.
    expect(mockPreloadSite).not.toHaveBeenCalled();
  });

  it("warms the search modal on hover and on keyboard focus of the Search item", () => {
    render(<WebSidebar {...sidebarProps} />);
    const search = screen.getByRole("button", { name: "Search" });

    fireEvent.pointerEnter(search);
    expect(mockPreloadSite).toHaveBeenCalledTimes(1);

    fireEvent.focus(search);
    expect(mockPreloadSite).toHaveBeenCalledTimes(2);
  });
});
