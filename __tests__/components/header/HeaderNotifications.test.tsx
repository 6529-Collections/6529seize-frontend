import { render, screen } from "@testing-library/react";
import HeaderNotifications from "@/components/header/notifications/HeaderNotifications";
import React from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: jest.fn(),
}));

jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: jest.fn(),
}));

jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: jest.fn(),
}));

const { usePathname } = require("next/navigation");
const { useAuth } = require("@/components/auth/Auth");
const { useTitle } = require("@/contexts/TitleContext");
const { useUnreadNotifications } = require("@/hooks/useUnreadNotifications");
const {
  useNotificationsContext,
} = require("@/components/notifications/NotificationsContext");

describe("HeaderNotifications", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows unread badge and sets notification count", () => {
    const setNotificationCount = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "alice" },
    });
    (useTitle as jest.Mock).mockReturnValue({
      setTitle: jest.fn(),
      title: "6529.io",
      notificationCount: 0,
      setNotificationCount,
      setWaveData: jest.fn(),
      setStreamHasNewItems: jest.fn(),
    });
    (usePathname as jest.Mock).mockReturnValue("/home");
    const removeAll = jest.fn();
    (useNotificationsContext as jest.Mock).mockReturnValue({
      removeAllDeliveredNotifications: removeAll,
    });
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      notifications: { unread_count: 2 },
      haveUnreadNotifications: true,
    });

    render(<HeaderNotifications />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/my-stream/notifications"
    );
    expect(screen.getByRole("link").querySelector("div")).toBeInTheDocument();
    expect(removeAll).not.toHaveBeenCalled();
    expect(setNotificationCount).toHaveBeenCalledWith(2);
  });

  it("removes delivered notifications when none unread and adjusts link", () => {
    const setNotificationCount = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "bob" },
    });
    (useTitle as jest.Mock).mockReturnValue({
      setTitle: jest.fn(),
      title: "6529.io",
      notificationCount: 0,
      setNotificationCount,
      setWaveData: jest.fn(),
      setStreamHasNewItems: jest.fn(),
    });
    (usePathname as jest.Mock).mockReturnValue("/my-stream/notifications");
    const removeAll = jest.fn();
    (useNotificationsContext as jest.Mock).mockReturnValue({
      removeAllDeliveredNotifications: removeAll,
    });
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      notifications: { unread_count: 0 },
      haveUnreadNotifications: false,
    });

    render(<HeaderNotifications />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/my-stream/notifications?reload=true"
    );
    expect(screen.getByRole("link").querySelector("div")).toBeNull();
    expect(removeAll).toHaveBeenCalled();
    expect(setNotificationCount).toHaveBeenCalledWith(0);
  });
});
