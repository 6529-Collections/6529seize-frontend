import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WsMessageType } from "@/helpers/Types";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import type { ConnectedWalletAccount } from "@/services/auth/auth.utils";
import { setNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";
import { NotificationWebSocketSync } from "@/services/websocket/NotificationWebSocketSync";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { mockRandomUnit } from "../helpers/mockRandomUnit";

const commonApiFetchMock = jest.fn();
const sendMock = jest.fn();
const messageCallbacks = new Map<WsMessageType, (value: unknown) => void>();
let mockWebSocketStatus = WebSocketStatus.CONNECTED;

const ACTIVE_JWT = "active-jwt";
const SECOND_JWT = "second-jwt";
const THIRD_JWT = "third-jwt";
const ALL_PROFILE_IDS = ["profile-active", "profile-second", "profile-third"];

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetchMock(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "auth-token-changed",
  WALLET_ACCOUNTS_UPDATED_EVENT: "wallet-accounts-updated",
  getAuthJwt: () => "active-jwt",
  getConnectedWalletAccounts: () => [
    { jwt: "active-jwt" },
    { jwt: "second-jwt" },
    { jwt: "third-jwt" },
  ],
  isAuthJwtUsable: (jwt: unknown) => typeof jwt === "string" && jwt.length > 0,
}));

jest.mock("@/components/auth/SeizeConnectContext", () => {
  const connectedAccounts = [
    { address: "0xactive", profileId: "profile-active", isActive: true },
    { address: "0xsecond", profileId: "profile-second", isActive: false },
    { address: "0xthird", profileId: "profile-third", isActive: false },
  ];
  return { useSeizeConnectContext: () => ({ connectedAccounts }) };
});

jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: () => ({ send: sendMock, status: mockWebSocketStatus }),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (
    type: WsMessageType,
    callback: (value: unknown) => void
  ) => {
    messageCallbacks.set(type, callback);
    return { isConnected: true };
  },
}));

const OTHER_ACCOUNTS: readonly ConnectedWalletAccount[] = [
  {
    address: "0xSECOND",
    refreshToken: null,
    role: null,
    jwt: SECOND_JWT,
    profileId: "profile-second",
    profileHandle: "bob",
  },
  {
    address: "0xTHIRD",
    refreshToken: null,
    role: null,
    jwt: THIRD_JWT,
    profileId: "profile-third",
    profileHandle: "carol",
  },
];

const unreadCountByJwt = new Map<string, number>();

const requestsFor = (jwt: string): number =>
  commonApiFetchMock.mock.calls.filter(
    ([params]) =>
      (params as { readonly headers?: { readonly Authorization?: string } })
        .headers?.Authorization === `Bearer ${jwt}`
  ).length;

const requestCounts = () => ({
  active: requestsFor(ACTIVE_JWT),
  second: requestsFor(SECOND_JWT),
  third: requestsFor(THIRD_JWT),
});

const setVisibility = (value: DocumentVisibilityState): void => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
  document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
};

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

// Every unread surface of a signed-in session with three connected accounts:
// the provider, desktop sidebar and mobile nav all read the active account
// (the sidebar's handle can differ in case or lag behind a switch), and the
// provider reads the two other accounts.
function useUnreadSurfaces() {
  const provider = useUnreadNotifications("alice", {
    profileId: "profile-active",
  });
  const sidebar = useUnreadNotifications("Alice", {
    profileId: "profile-active",
  });
  const mobileNav = useUnreadNotifications("alice", {
    profileId: "profile-active",
  });
  const otherAccounts = useConnectedAccountsUnreadNotifications(OTHER_ACCOUNTS);
  return { provider, sidebar, mobileNav, otherAccounts };
}

describe("socket-driven unread notification polling", () => {
  let queryClient: QueryClient;
  let randomUnitSpy: jest.SpyInstance;

  const renderSurfaces = () =>
    renderHook(() => useUnreadSurfaces(), {
      wrapper: function Wrapper({
        children,
      }: {
        readonly children: ReactNode;
      }) {
        return (
          <QueryClientProvider client={queryClient}>
            <NotificationWebSocketSync />
            {children}
          </QueryClientProvider>
        );
      },
    });

  const acknowledgeIdentitySync = async (): Promise<void> => {
    act(() => {
      messageCallbacks.get(WsMessageType.NOTIFICATION_IDENTITIES_SYNCED)?.({
        profile_ids: ALL_PROFILE_IDS,
      });
    });
    await advance(0);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    randomUnitSpy = mockRandomUnit(0.5);
    commonApiFetchMock.mockReset();
    sendMock.mockReset();
    messageCallbacks.clear();
    mockWebSocketStatus = WebSocketStatus.CONNECTED;
    setNotificationRealtimeState(false);
    setVisibility("visible");
    unreadCountByJwt.clear();
    unreadCountByJwt.set(ACTIVE_JWT, 1);
    unreadCountByJwt.set(SECOND_JWT, 2);
    unreadCountByJwt.set(THIRD_JWT, 3);
    commonApiFetchMock.mockImplementation(
      (params: { readonly headers: { readonly Authorization: string } }) => {
        const jwt = params.headers.Authorization.replace("Bearer ", "");
        return Promise.resolve({
          unread_count: unreadCountByJwt.get(jwt) ?? 0,
          notifications: [],
        });
      }
    );
    // Mirror the app's QueryClient defaults that affect refetch timing.
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 10_000, gcTime: Number.POSITIVE_INFINITY },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    randomUnitSpy.mockRestore();
    setNotificationRealtimeState(false);
    setVisibility("visible");
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("fetches each account once per five minutes while the socket covers it", async () => {
    const { result, unmount } = renderSurfaces();
    await advance(0);

    expect(sendMock).toHaveBeenCalledWith(
      WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
      { access_tokens: [ACTIVE_JWT, SECOND_JWT, THIRD_JWT] }
    );
    // Three active-account readers share one request.
    expect(requestCounts()).toEqual({ active: 1, second: 1, third: 1 });

    // The sync acknowledgement is the "socket (re)connected" refresh.
    await acknowledgeIdentitySync();
    expect(requestCounts()).toEqual({ active: 2, second: 2, third: 2 });

    commonApiFetchMock.mockClear();
    await advance(15 * 60_000);
    expect(requestCounts()).toEqual({ active: 3, second: 3, third: 3 });

    expect(result.current.provider.notifications?.unread_count).toBe(1);
    expect(result.current.sidebar.notifications?.unread_count).toBe(1);
    expect(result.current.mobileNav.haveUnreadNotifications).toBe(true);
    expect(result.current.otherAccounts).toEqual({
      "0xsecond": 2,
      "0xthird": 3,
    });
    unmount();
  });

  it("refreshes an account's count from a notification event without waiting for the poll", async () => {
    const { result, unmount } = renderSurfaces();
    await advance(0);
    await acknowledgeIdentitySync();
    commonApiFetchMock.mockClear();

    unreadCountByJwt.set(SECOND_JWT, 7);
    act(() => {
      messageCallbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
        profile_id: "profile-second",
      });
    });
    await advance(200);

    expect(requestsFor(SECOND_JWT)).toBe(1);
    expect(requestsFor(ACTIVE_JWT)).toBe(0);
    expect(result.current.otherAccounts["0xsecond"]).toBe(7);

    unreadCountByJwt.set(ACTIVE_JWT, 0);
    act(() => {
      messageCallbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
        profile_id: "profile-active",
      });
    });
    await advance(200);

    expect(requestsFor(ACTIVE_JWT)).toBe(1);
    expect(result.current.provider.haveUnreadNotifications).toBe(false);
    expect(result.current.sidebar.haveUnreadNotifications).toBe(false);
    unmount();
  });

  it("polls every 30 seconds while disconnected and returns to the slow poll after reconnecting", async () => {
    const { rerender, unmount } = renderSurfaces();
    await advance(0);
    await acknowledgeIdentitySync();

    mockWebSocketStatus = WebSocketStatus.DISCONNECTED;
    rerender();
    await advance(0);
    commonApiFetchMock.mockClear();

    await advance(60_000);
    expect(requestCounts()).toEqual({ active: 2, second: 2, third: 2 });

    mockWebSocketStatus = WebSocketStatus.CONNECTED;
    rerender();
    await advance(0);
    commonApiFetchMock.mockClear();

    // The identity sync is staggered after a reconnect, then acknowledged.
    await advance(3_000);
    expect(sendMock).toHaveBeenLastCalledWith(
      WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
      { access_tokens: [ACTIVE_JWT, SECOND_JWT, THIRD_JWT] }
    );
    await acknowledgeIdentitySync();
    expect(requestCounts()).toEqual({ active: 1, second: 1, third: 1 });

    commonApiFetchMock.mockClear();
    await advance(5 * 60_000);
    expect(requestCounts()).toEqual({ active: 1, second: 1, third: 1 });
    unmount();
  });

  it("keeps polling only the account the socket did not confirm at the fallback interval", async () => {
    const { unmount } = renderSurfaces();
    await advance(0);
    act(() => {
      messageCallbacks.get(WsMessageType.NOTIFICATION_IDENTITIES_SYNCED)?.({
        profile_ids: ["profile-active", "profile-second"],
      });
    });
    await advance(0);
    commonApiFetchMock.mockClear();

    await advance(5 * 60_000);
    expect(requestCounts()).toEqual({ active: 1, second: 1, third: 10 });
    unmount();
  });

  it("refreshes every account when the tab becomes visible again", async () => {
    const { unmount } = renderSurfaces();
    await advance(0);
    await acknowledgeIdentitySync();

    act(() => setVisibility("hidden"));
    await advance(2 * 60_000);
    commonApiFetchMock.mockClear();

    act(() => setVisibility("visible"));
    await advance(0);
    expect(requestCounts()).toEqual({ active: 1, second: 1, third: 1 });

    // A quick switch back within the stale window does not refetch again.
    act(() => setVisibility("hidden"));
    act(() => setVisibility("visible"));
    await advance(0);
    expect(requestCounts()).toEqual({ active: 1, second: 1, third: 1 });
    unmount();
  });
});
