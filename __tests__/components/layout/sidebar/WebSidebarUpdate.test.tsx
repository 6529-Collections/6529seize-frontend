import { fireEvent, render, screen } from "@testing-library/react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import WebSidebar from "@/components/layout/sidebar/WebSidebar";
import NewVersionToast from "@/components/utils/NewVersionToast";
import { useVersionStatus } from "@/contexts/VersionStatusContext";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";

jest.mock("next/navigation", () => ({ usePathname: () => "/waves" }));
jest.mock("@/contexts/VersionStatusContext", () => ({
  useVersionStatus: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/helpers/version-refresh.helpers", () => ({
  refreshAppVersion: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    address: undefined,
    hasValidWalletAuth: false,
  })),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null }),
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
jest.mock("@/components/header/header-search/HeaderSearchModal", () => ({
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

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSeizeConnectContext).mockReturnValue({
    address: undefined,
    hasValidWalletAuth: false,
  } as unknown as ReturnType<typeof useSeizeConnectContext>);
  jest.mocked(useVersionStatus).mockReturnValue(true);
  jest.mocked(useDeviceInfo).mockReturnValue({
    isApp: false,
    isMobileDevice: false,
    isAppleMobile: false,
    hasTouchScreen: false,
  });
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["en-US"],
  });
});

it("puts the collapsed update rocket last in utilities with no desktop toast", () => {
  render(
    <>
      <WebSidebar {...sidebarProps} />
      <NewVersionToast />
    </>
  );
  const update = screen.getByRole("button", { name: "Update" });
  const utilities = update.closest('[data-sidebar-section="utilities"]');
  expect(utilities).not.toBeNull();
  expect(utilities?.lastElementChild).toContainElement(update);
  expect(
    screen
      .getByRole("button", { name: "Search" })
      .closest('[data-sidebar-section="utilities"]')
  ).not.toBeNull();
  expect(update).toHaveAttribute("data-tooltip-content", "Update");
  expect(update).toHaveAttribute("data-tooltip-hidden", "false");
  expect(update.querySelector("img")).toHaveAttribute(
    "src",
    "/rocket-refresh-small.png"
  );
  expect(screen.getByText("Update")).toHaveClass("tw-w-0", "tw-opacity-0");
  expect(
    screen.queryByRole("button", { name: "Refresh page" })
  ).not.toBeInTheDocument();

  fireEvent.click(update);
  expect(refreshAppVersion).toHaveBeenCalledTimes(1);
});

it("reveals the Update label when the sidebar expands", () => {
  const { rerender } = render(<WebSidebar {...sidebarProps} />);
  rerender(<WebSidebar {...sidebarProps} isCollapsed={false} />);

  expect(screen.getByText("Update")).toHaveClass("tw-flex-1", "tw-opacity-100");
  expect(screen.getByRole("button", { name: "Update" })).toHaveAttribute(
    "data-tooltip-hidden",
    "true"
  );
});

it("responds to update availability without adding a placeholder above Search", () => {
  jest.mocked(useVersionStatus).mockReturnValue(false);
  const { rerender } = render(<WebSidebar {...sidebarProps} />);
  expect(
    screen.queryByRole("button", { name: "Update" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Search" }).previousElementSibling
  ).toBeNull();

  jest.mocked(useVersionStatus).mockReturnValue(true);
  rerender(<WebSidebar {...sidebarProps} />);
  expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
});

it.each([
  { isApp: true },
  { isMobileDevice: true },
  { isAppleMobile: true },
  { hasTouchScreen: true },
])(
  "does not add a sidebar update on native or mobile browsers: %j",
  (device) => {
    jest.mocked(useDeviceInfo).mockReturnValue({
      isApp: false,
      isMobileDevice: false,
      isAppleMobile: false,
      hasTouchScreen: false,
      ...device,
    });
    render(<WebSidebar {...sidebarProps} />);
    expect(
      screen.queryByRole("button", { name: "Update" })
    ).not.toBeInTheDocument();
  }
);

it("uses the localized Update label", () => {
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["fr-FR"],
  });
  render(<WebSidebar {...sidebarProps} isCollapsed={false} />);
  expect(
    screen.getByRole("button", { name: "Mettre à jour" })
  ).toBeInTheDocument();
});

it("keeps Update in the same utility row when Notifications appears or disappears", () => {
  const { rerender } = render(<WebSidebar {...sidebarProps} />);
  const update = screen.getByRole("button", { name: "Update" });
  const utilityRow = update.parentElement;
  const utilities = update.closest('[data-sidebar-section="utilities"]');
  expect(utilities?.lastElementChild).toBe(utilityRow);
  expect(
    screen.queryByRole("link", { name: "Notifications" })
  ).not.toBeInTheDocument();

  jest.mocked(useSeizeConnectContext).mockReturnValue({
    address: "0xalice",
    hasValidWalletAuth: true,
  } as unknown as ReturnType<typeof useSeizeConnectContext>);
  rerender(<WebSidebar {...sidebarProps} />);
  const notifications = screen.getByRole("link", { name: "Notifications" });
  expect(
    notifications.closest('[data-sidebar-section="account"]')
  ).not.toBeNull();
  expect(utilities).not.toContainElement(notifications);
  expect(screen.getByRole("button", { name: "Update" })).toBe(update);
  expect(utilities?.lastElementChild).toBe(utilityRow);

  jest.mocked(useSeizeConnectContext).mockReturnValue({
    address: undefined,
    hasValidWalletAuth: false,
  } as unknown as ReturnType<typeof useSeizeConnectContext>);
  rerender(<WebSidebar {...sidebarProps} />);
  expect(
    screen.queryByRole("link", { name: "Notifications" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Update" })).toBe(update);
  expect(utilities?.lastElementChild).toBe(utilityRow);
});
