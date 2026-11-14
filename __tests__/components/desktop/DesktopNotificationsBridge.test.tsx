import { act, render, waitFor } from "@testing-library/react";
import DesktopNotificationsBridge from "@/components/desktop/DesktopNotificationsBridge";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { commonApiFetch } from "@/services/api/common-api";
import { getConnectedWalletAccounts } from "@/services/auth/auth.utils";

const push = jest.fn();
const replace = jest.fn();
const switchAccount = jest.fn();
const ADDRESS_A = `0x${"a".repeat(40)}`;
const ADDRESS_B = `0x${"b".repeat(40)}`;

let seizeContext: Record<string, unknown>;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => seizeContext,
}));
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    findNativeEmoji: () => null,
    findCustomEmoji: () => null,
    loadEmojiData: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getConnectedWalletAccounts: jest.fn(),
}));

type Listener = (event: unknown, payload: unknown) => void;

const createBridges = () => {
  const listeners = new Set<Listener>();
  return {
    listeners,
    api: {
      openExternal: jest.fn(),
      onNotificationNavigate: jest.fn((listener: Listener) =>
        listeners.add(listener)
      ),
      offNotificationNavigate: jest.fn((listener: Listener) =>
        listeners.delete(listener)
      ),
    },
    notifications: { showNotification: jest.fn(), setBadge: jest.fn() },
  };
};

let bridges: ReturnType<typeof createBridges>;

const installDesktopShell = () => {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: bridges.api,
  });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
  Object.defineProperty(window, "notifications", {
    configurable: true,
    value: bridges.notifications,
  });
};

const account = (address: string, handle: string) => ({
  address,
  role: null,
  jwt: `jwt-${handle}`,
  profileId: `id-${handle}`,
  profileHandle: handle,
  refreshToken: null,
});

const follow = (id: number, pfp: string | null = null) => ({
  id,
  cause: ApiNotificationCause.IdentitySubscribed,
  created_at: 0,
  read_at: null,
  related_identity: { handle: `follower${id}`, pfp },
  related_drops: [],
  additional_context: {},
});

const followNotification = (...ids: number[]) => ({
  unread_count: ids.length,
  notifications: ids.map((id) => follow(id)),
});

describe("DesktopNotificationsBridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    bridges = createBridges();
    seizeContext = {
      address: ADDRESS_A,
      connectedAccounts: [
        { address: ADDRESS_A, profileId: "id-a", profileHandle: "alice" },
        { address: ADDRESS_B, profileId: "id-b", profileHandle: "bob" },
      ],
      connectedAccountUnreadNotifications: { [ADDRESS_A]: 2, [ADDRESS_B]: 3 },
      seizeSwitchConnectedAccount: switchAccount,
    };
    jest
      .mocked(getConnectedWalletAccounts)
      .mockReturnValue([account(ADDRESS_A, "alice")]);
    jest.mocked(commonApiFetch).mockResolvedValue(followNotification(7));
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    Reflect.deleteProperty(window, "notifications");
  });

  it("does nothing in a browser", async () => {
    render(<DesktopNotificationsBridge />);
    await act(async () => undefined);

    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(bridges.notifications.setBadge).not.toHaveBeenCalled();
  });

  it("sets the badge to the unread total of every profile", () => {
    installDesktopShell();

    render(<DesktopNotificationsBridge />);

    expect(bridges.notifications.setBadge).toHaveBeenCalledWith(5);
  });

  it("shows each new notification once, with its profile as the target", async () => {
    installDesktopShell();
    jest.useFakeTimers();

    render(<DesktopNotificationsBridge />);
    await waitFor(() =>
      expect(bridges.notifications.showNotification).toHaveBeenCalledTimes(1)
    );
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "notifications",
      params: { limit: "5" },
      headers: { Authorization: "Bearer jwt-alice" },
    });
    expect(bridges.notifications.showNotification).toHaveBeenCalledWith(
      7,
      "",
      "[alice] follower7 is now following you",
      "View profile",
      "/follower7",
      {
        targetAddress: ADDRESS_A,
        targetProfileId: "id-a",
        targetProfileHandle: "alice",
      }
    );

    await act(async () => {
      jest.advanceTimersByTime(15_000);
    });
    await act(async () => undefined);
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
    expect(bridges.notifications.showNotification).toHaveBeenCalledTimes(1);
  });

  it("shows every notification newer than the last seen, oldest first", async () => {
    installDesktopShell();
    jest.useFakeTimers();
    render(<DesktopNotificationsBridge />);
    await waitFor(() =>
      expect(bridges.notifications.showNotification).toHaveBeenCalledTimes(1)
    );

    jest.mocked(commonApiFetch).mockResolvedValue(followNotification(10, 9, 7));
    await act(async () => {
      jest.advanceTimersByTime(15_000);
    });
    await act(async () => undefined);

    const shownIds = bridges.notifications.showNotification.mock.calls.map(
      (call) => call[0]
    );
    expect(shownIds).toEqual([7, 9, 10]);
  });

  it("keeps notifying other profiles when one profile's request fails", async () => {
    installDesktopShell();
    jest
      .mocked(getConnectedWalletAccounts)
      .mockReturnValue([
        account(ADDRESS_A, "alice"),
        account(ADDRESS_B, "bob"),
      ]);
    jest
      .mocked(commonApiFetch)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(followNotification(8));

    render(<DesktopNotificationsBridge />);

    await waitFor(() =>
      expect(bridges.notifications.showNotification).toHaveBeenCalledTimes(1)
    );
    expect(
      bridges.notifications.showNotification.mock.calls[0]?.[5]
    ).toMatchObject({ targetAddress: ADDRESS_B });
  });

  it("passes only http(s) icons to the shell", async () => {
    installDesktopShell();
    jest.mocked(commonApiFetch).mockResolvedValue({
      unread_count: 1,
      notifications: [follow(11, "javascript:alert(1)")],
    });

    render(<DesktopNotificationsBridge />);

    await waitFor(() =>
      expect(bridges.notifications.showNotification).toHaveBeenCalledTimes(1)
    );
    expect(bridges.notifications.showNotification.mock.calls[0]?.[1]).toBe("");
  });

  it("does not switch on a handle shared by two profiles", async () => {
    installDesktopShell();
    seizeContext = {
      ...seizeContext,
      connectedAccounts: [
        { address: ADDRESS_A, profileId: "id-a", profileHandle: "twin" },
        { address: ADDRESS_B, profileId: "id-b", profileHandle: "twin" },
      ],
    };
    render(<DesktopNotificationsBridge />);

    act(() => {
      for (const listener of bridges.listeners) {
        listener({}, { path: "/waves", targetProfileHandle: "twin" });
      }
    });
    await act(async () => undefined);

    expect(switchAccount).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not open the page when the profile switch never completes", async () => {
    installDesktopShell();
    jest.useFakeTimers();
    render(<DesktopNotificationsBridge />);

    act(() => {
      for (const listener of bridges.listeners) {
        listener({}, { path: "/waves", targetAddress: ADDRESS_B });
      }
    });
    await act(async () => {
      jest.advanceTimersByTime(3_100);
    });
    await act(async () => undefined);

    expect(switchAccount).toHaveBeenCalledWith(ADDRESS_B);
    expect(push).not.toHaveBeenCalled();
  });

  it("switches to the notification's profile, then opens its page", async () => {
    installDesktopShell();
    switchAccount.mockImplementation((address: string) => {
      seizeContext = { ...seizeContext, address };
    });
    const { rerender } = render(<DesktopNotificationsBridge />);

    act(() => {
      for (const listener of bridges.listeners) {
        listener(
          {},
          {
            path: "/waves?wave=1",
            targetAddress: ADDRESS_B,
            targetProfileId: null,
            targetProfileHandle: "bob",
          }
        );
      }
    });
    expect(switchAccount).toHaveBeenCalledWith(ADDRESS_B);
    rerender(<DesktopNotificationsBridge />);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/waves?wave=1"));
  });

  it("ignores clicks that target another site or an unknown profile", async () => {
    installDesktopShell();
    render(<DesktopNotificationsBridge />);

    act(() => {
      for (const listener of bridges.listeners) {
        listener({}, { path: "//evil.example/" });
        listener({}, { path: "/waves", targetAddress: `0x${"c".repeat(40)}` });
      }
    });
    await act(async () => undefined);

    expect(push).not.toHaveBeenCalled();
    expect(switchAccount).not.toHaveBeenCalled();
  });
});
