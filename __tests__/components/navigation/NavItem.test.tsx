import { fireEvent, render } from "@testing-library/react";
import NavItem from "@/components/navigation/NavItem";
import { useViewContext } from "@/components/navigation/ViewContext";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useTitle } from "@/contexts/TitleContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { isNavItemActive } from "@/components/navigation/isNavItemActive";
import { useWaveData } from "@/hooks/useWaveData";
import { useWave } from "@/hooks/useWave";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const mockUseLinkStatus = jest.fn(() => ({ pending: false }));

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    prefetch,
    ...props
  }: {
    readonly children: any;
    readonly href: string;
    readonly prefetch?: boolean | undefined;
  }) => (
    <a
      href={href}
      data-prefetch={prefetch === undefined ? undefined : `${prefetch}`}
      {...props}
    >
      {children}
    </a>
  );

  return {
    __esModule: true,
    default: MockLink,
    useLinkStatus: () => mockUseLinkStatus(),
  };
});

jest.mock("@/components/navigation/ViewContext", () => ({
  getActiveViewFromUrl: ({
    activeWaveId,
    searchParams,
  }: {
    readonly activeWaveId: string | null | undefined;
    readonly searchParams: URLSearchParams | null | undefined;
  }) => {
    const view = searchParams?.get("view");
    return activeWaveId || (view !== "waves" && view !== "messages")
      ? null
      : view;
  },
  useViewContext: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/contexts/TitleContext", () => ({ useTitle: jest.fn() }));
jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: jest.fn(),
}));
jest.mock("@/hooks/useUnreadIndicator", () => ({
  useUnreadIndicator: jest.fn(),
}));
jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: jest.fn(),
}));
jest.mock("@/components/navigation/isNavItemActive", () => ({
  isNavItemActive: jest.fn(),
}));
jest.mock("@/hooks/useWaveData", () => ({ useWaveData: jest.fn() }));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

describe("NavItem notifications", () => {
  const handleNavClick = jest.fn();
  const getNavHref = jest.fn();
  const recordNavClick = jest.fn();
  const seizeConnect = jest.fn();
  const removeAllDeliveredNotifications = jest.fn();
  const setTitle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLinkStatus.mockReturnValue({ pending: false });
    getNavHref.mockImplementation((item) => {
      if (item.kind === "view") {
        return `/${item.viewKey}`;
      }
      return item.href;
    });
    (useViewContext as jest.Mock).mockReturnValue({
      handleNavClick,
      getNavHref,
      recordNavClick,
    });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (usePathname as jest.Mock).mockReturnValue("/");
    (isNavItemActive as jest.Mock).mockReturnValue(false);
    (useUnreadIndicator as jest.Mock).mockReturnValue({ hasUnread: false });
    (useNotificationsContext as jest.Mock).mockReturnValue({
      removeAllDeliveredNotifications,
    });
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "user", normalised_handle: "user" },
    });
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: "0xabc",
      seizeConnect,
    });
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      notifications: { unread_count: 0 },
      haveUnreadNotifications: false,
    });
    (useTitle as jest.Mock).mockReturnValue({
      setTitle,
      title: "6529.io",
      notificationCount: 0,
      setNotificationCount: jest.fn(),
      setWaveData: jest.fn(),
    });
    (useWaveData as jest.Mock).mockReturnValue({ data: null });
    (useWave as jest.Mock).mockReturnValue({ isDm: false });
  });

  it("sets title and shows badge when there are unread notifications", () => {
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      notifications: { unread_count: 3 },
      haveUnreadNotifications: true,
    });
    const item = {
      kind: "route",
      name: "Notifications",
      href: "/notifications",
      icon: "/n",
    } as any;

    const { container } = render(<NavItem item={item} />);

    // Title is set via TitleContext hooks
    expect(container.querySelector(".tw-bg-red")).not.toBeNull();
    expect(removeAllDeliveredNotifications).not.toHaveBeenCalled();
  });

  it("clears delivered notifications when none unread", () => {
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      notifications: { unread_count: 0 },
      haveUnreadNotifications: false,
    });
    const item = {
      kind: "route",
      name: "Notifications",
      href: "/notifications",
      icon: "/n",
    } as any;

    const { container } = render(<NavItem item={item} />);

    // Title is set via TitleContext hooks
    expect(removeAllDeliveredNotifications).toHaveBeenCalled();
    expect(container.querySelector(".tw-bg-red")).toBeNull();
  });

  it("prompts connect when profile item is clicked without a connected wallet", () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: undefined,
      seizeConnect,
    });
    const item = {
      kind: "route",
      name: "Profile",
      href: "/profile",
      icon: "profile",
    } as any;

    const { getByRole } = render(<NavItem item={item} />);
    fireEvent.click(getByRole("link", { name: "Profile" }));

    expect(seizeConnect).toHaveBeenCalledTimes(1);
    expect(handleNavClick).not.toHaveBeenCalled();
    expect(recordNavClick).not.toHaveBeenCalled();
  });

  it("records connected user profile link clicks with the resolved profile route", () => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "User", normalised_handle: "my-handle" },
    });
    const item = {
      kind: "route",
      name: "Profile",
      href: "/profile",
      icon: "profile",
    } as any;

    const { getByRole } = render(<NavItem item={item} />);
    fireEvent.click(getByRole("link", { name: "Profile" }));

    expect(recordNavClick).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "route",
        name: "Profile",
        href: "/my-handle",
      })
    );
    expect(handleNavClick).not.toHaveBeenCalled();
    expect(seizeConnect).not.toHaveBeenCalled();
  });

  it("marks profile active only on own profile routes", () => {
    (usePathname as jest.Mock).mockReturnValue("/my-handle/proxy");
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "User", normalised_handle: "my-handle" },
    });
    const item = {
      kind: "route",
      name: "Profile",
      href: "/profile",
      icon: "profile",
    } as any;

    const { getByRole, rerender } = render(<NavItem item={item} />);
    expect(getByRole("link", { name: "Profile" })).toHaveAttribute(
      "aria-current",
      "page"
    );

    (usePathname as jest.Mock).mockReturnValue("/other-user");
    rerender(<NavItem item={item} />);
    expect(getByRole("link", { name: "Profile" })).not.toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("uses full prefetch for app view tab links", () => {
    const item = {
      kind: "view",
      name: "Waves",
      viewKey: "waves",
      icon: "waves",
    } as any;

    const { getByRole } = render(<NavItem item={item} fullPrefetch />);

    const link = getByRole("link", { name: "Waves" });
    expect(link).toHaveAttribute("href", "/waves");
    expect(link).toHaveAttribute("data-prefetch", "true");
  });

  it("shows immediate pending feedback while a link navigation is pending", () => {
    mockUseLinkStatus.mockReturnValue({ pending: true });
    const item = {
      kind: "view",
      name: "Messages",
      viewKey: "messages",
      icon: "messages",
    } as any;

    const { getByTestId } = render(<NavItem item={item} />);

    expect(getByTestId("nav-item-pending-indicator")).toBeInTheDocument();
  });

  it("renders disabled item when disabled flag set", () => {
    (useUnreadNotifications as jest.Mock).mockReturnValue({});
    const item = { name: "Feed", icon: "/i", disabled: true } as any;
    const { getByRole } = render(<NavItem item={item} />);
    const button = getByRole("button");
    expect(button).toBeDisabled();
  });
});
