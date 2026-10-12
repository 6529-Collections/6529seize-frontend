import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WsMessageType } from "@/helpers/Types";
import {
  setNotificationRealtimeState,
  useNotificationRealtimeState,
} from "@/services/notifications/notification-realtime-state";
import { NotificationWebSocketSync } from "@/services/websocket/NotificationWebSocketSync";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { mockRandomUnit } from "../helpers/mockRandomUnit";

const invalidateQueriesMock = jest.fn().mockResolvedValue(undefined);
const sendMock = jest.fn();
const messageCallbacks = new Map<WsMessageType, (value: unknown) => void>();
const getAuthJwtMock = jest.fn();
const getConnectedWalletAccountsMock = jest.fn();
const mockUseQueryClient = jest.fn();
let webSocketStatus = WebSocketStatus.CONNECTED;

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    connectedAccounts: [
      {
        address: "0xprimary",
        profileId: "profile-1",
        isActive: true,
      },
      {
        address: "0xsecondary",
        profileId: "profile-2",
        isActive: false,
      },
    ],
  }),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "auth-token-changed",
  WALLET_ACCOUNTS_UPDATED_EVENT: "wallet-accounts-updated",
  getAuthJwt: () => getAuthJwtMock(),
  getConnectedWalletAccounts: () => getConnectedWalletAccountsMock(),
  isAuthJwtUsable: (jwt: unknown) => typeof jwt === "string" && !!jwt,
}));

jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: () => ({
    send: sendMock,
    status: webSocketStatus,
  }),
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

function RealtimeStateProbe() {
  const state = useNotificationRealtimeState();
  return (
    <output data-testid="realtime-state">
      {`${state.connected}:${state.syncedProfileIds.join(",")}`}
    </output>
  );
}

function Subject() {
  return (
    <>
      <NotificationWebSocketSync />
      <RealtimeStateProbe />
    </>
  );
}

function ActiveNotificationsRefresh({
  queryFn,
}: {
  readonly queryFn: (context: {
    readonly signal: AbortSignal;
  }) => Promise<{ readonly unread_count: number }>;
}) {
  useQuery({
    queryKey: [QueryKey.IDENTITY_NOTIFICATIONS, "active-refresh"],
    queryFn,
  });
  return null;
}

const createQueryClientWrapper = (
  queryClient: QueryClient,
  children: ReactNode
) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

const flushQueryWork = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(0);
    await Promise.resolve();
  });
};

describe("NotificationWebSocketSync", () => {
  let randomUnitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    randomUnitSpy = mockRandomUnit(0.5);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: invalidateQueriesMock,
    });
    messageCallbacks.clear();
    webSocketStatus = WebSocketStatus.CONNECTED;
    setNotificationRealtimeState(false);
    getAuthJwtMock.mockReturnValue("primary-jwt");
    getConnectedWalletAccountsMock.mockReturnValue([
      { jwt: "primary-jwt" },
      { jwt: "secondary-jwt" },
    ]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    randomUnitSpy.mockRestore();
  });

  it("syncs owned account JWTs and refreshes only the changed recipient", () => {
    const { unmount } = render(<Subject />);

    expect(sendMock).toHaveBeenCalledWith(
      WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
      { access_tokens: ["primary-jwt", "secondary-jwt"] }
    );

    act(() => {
      messageCallbacks.get(WsMessageType.NOTIFICATION_IDENTITIES_SYNCED)?.({
        profile_ids: ["profile-1", "profile-2"],
      });
    });
    invalidateQueriesMock.mockClear();

    act(() => {
      messageCallbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
        profile_id: "profile-2",
      });
      jest.advanceTimersByTime(150);
    });

    expect(invalidateQueriesMock).toHaveBeenCalledTimes(1);
    expect(invalidateQueriesMock).toHaveBeenCalledWith(
      {
        queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
      },
      {
        cancelRefetch: false,
      }
    );
    unmount();
  });

  it("preserves acknowledged coverage during token resync and resets it on reconnect", () => {
    const { rerender, unmount } = render(<Subject />);

    act(() => {
      messageCallbacks.get(WsMessageType.NOTIFICATION_IDENTITIES_SYNCED)?.({
        profile_ids: ["profile-1", "profile-2"],
      });
    });
    expect(screen.getByTestId("realtime-state")).toHaveTextContent(
      "true:profile-1,profile-2"
    );

    getAuthJwtMock.mockReturnValue("rotated-primary-jwt");
    getConnectedWalletAccountsMock.mockReturnValue([
      { jwt: "rotated-primary-jwt" },
      { jwt: "secondary-jwt" },
    ]);
    act(() => {
      window.dispatchEvent(new Event("auth-token-changed"));
    });

    expect(sendMock).toHaveBeenLastCalledWith(
      WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
      { access_tokens: ["rotated-primary-jwt", "secondary-jwt"] }
    );
    expect(screen.getByTestId("realtime-state")).toHaveTextContent(
      "true:profile-1,profile-2"
    );

    webSocketStatus = WebSocketStatus.DISCONNECTED;
    rerender(<Subject />);
    expect(screen.getByTestId("realtime-state")).toHaveTextContent("false:");

    getAuthJwtMock.mockReturnValue("reconnect-primary-jwt");
    getConnectedWalletAccountsMock.mockReturnValue([
      { jwt: "reconnect-primary-jwt" },
      { jwt: "reconnect-secondary-jwt" },
    ]);
    webSocketStatus = WebSocketStatus.CONNECTED;
    rerender(<Subject />);
    expect(screen.getByTestId("realtime-state")).toHaveTextContent("true:");
    // The reconnect resync is staggered by a random 0-3s (1.5s for a 0.5 draw).
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(sendMock).toHaveBeenLastCalledWith(
      WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
      {
        access_tokens: ["reconnect-primary-jwt", "reconnect-secondary-jwt"],
      }
    );
    unmount();
  });

  describe("reconnect stagger", () => {
    const reconnect = (rerender: (ui: ReactNode) => void) => {
      webSocketStatus = WebSocketStatus.DISCONNECTED;
      rerender(<Subject />);
      webSocketStatus = WebSocketStatus.CONNECTED;
      rerender(<Subject />);
    };

    it("syncs immediately on the first connect of the session", () => {
      webSocketStatus = WebSocketStatus.DISCONNECTED;
      const { rerender, unmount } = render(<Subject />);
      expect(sendMock).not.toHaveBeenCalled();

      webSocketStatus = WebSocketStatus.CONNECTED;
      rerender(<Subject />);

      expect(sendMock).toHaveBeenCalledTimes(1);
      unmount();
    });

    it.each([
      ["lower", 0.0004, 1],
      ["middle", 0.5, 1500],
      ["upper", 0.999999, 2999],
    ])(
      "delays the reconnect sync within 0-3s (%s bound: %p -> %p ms)",
      (_bound, unit, delayMs) => {
        const { rerender, unmount } = render(<Subject />);
        sendMock.mockClear();
        randomUnitSpy.mockRestore();
        randomUnitSpy = mockRandomUnit(unit);

        reconnect(rerender);
        act(() => {
          jest.advanceTimersByTime(delayMs - 1);
        });
        expect(sendMock).not.toHaveBeenCalled();
        act(() => {
          jest.advanceTimersByTime(1);
        });

        expect(sendMock).toHaveBeenCalledTimes(1);
        unmount();
      }
    );

    it("reads the tokens when the staggered sync fires", () => {
      const { rerender, unmount } = render(<Subject />);
      sendMock.mockClear();

      reconnect(rerender);
      getAuthJwtMock.mockReturnValue("late-primary-jwt");
      getConnectedWalletAccountsMock.mockReturnValue([
        { jwt: "late-primary-jwt" },
      ]);
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(sendMock).toHaveBeenCalledWith(
        WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
        { access_tokens: ["late-primary-jwt"] }
      );
      unmount();
    });

    it("cancels the pending sync when the socket disconnects again", () => {
      const { rerender, unmount } = render(<Subject />);
      sendMock.mockClear();

      reconnect(rerender);
      webSocketStatus = WebSocketStatus.DISCONNECTED;
      rerender(<Subject />);
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(sendMock).not.toHaveBeenCalled();
      unmount();
    });

    it("cancels the pending sync on unmount", () => {
      const { rerender, unmount } = render(<Subject />);
      sendMock.mockClear();

      reconnect(rerender);
      unmount();
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(sendMock).not.toHaveBeenCalled();
    });

    it.each(["auth-token-changed", "wallet-accounts-updated"])(
      "syncs immediately on %s inside the stagger window, without a duplicate or a re-delay",
      (eventName) => {
        const { rerender, unmount } = render(<Subject />);
        sendMock.mockClear();

        reconnect(rerender);
        getAuthJwtMock.mockReturnValue("rotated-jwt");
        getConnectedWalletAccountsMock.mockReturnValue([
          { jwt: "rotated-jwt" },
        ]);
        act(() => {
          window.dispatchEvent(new Event(eventName));
        });

        // The change is not treated as another reconnect: no stagger delay.
        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenLastCalledWith(
          WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
          { access_tokens: ["rotated-jwt"] }
        );

        // The pending staggered sync was cancelled, so it never double-sends.
        act(() => {
          jest.advanceTimersByTime(3000);
        });
        expect(sendMock).toHaveBeenCalledTimes(1);

        // A later change is still immediate.
        getAuthJwtMock.mockReturnValue("rotated-again-jwt");
        getConnectedWalletAccountsMock.mockReturnValue([
          { jwt: "rotated-again-jwt" },
        ]);
        act(() => {
          window.dispatchEvent(new Event(eventName));
        });
        expect(sendMock).toHaveBeenCalledTimes(2);
        expect(sendMock).toHaveBeenLastCalledWith(
          WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
          { access_tokens: ["rotated-again-jwt"] }
        );
        unmount();
      }
    );
  });

  it("catches up the active profile when a sync ack omits it", () => {
    const { unmount } = render(<Subject />);
    invalidateQueriesMock.mockClear();

    act(() => {
      messageCallbacks.get(WsMessageType.NOTIFICATION_IDENTITIES_SYNCED)?.({
        profile_ids: ["profile-2"],
      });
    });

    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2);
    expect(invalidateQueriesMock).toHaveBeenCalledWith(
      {
        queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
      },
      {
        cancelRefetch: false,
      }
    );
    expect(invalidateQueriesMock).toHaveBeenCalledWith(
      {
        queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
      },
      {
        cancelRefetch: false,
      }
    );
    expect(screen.getByTestId("realtime-state")).toHaveTextContent(
      "true:profile-2"
    );
    unmount();
  });

  it("ignores malformed payloads and globally refreshes after an empty sync ack", () => {
    const { unmount } = render(<Subject />);
    invalidateQueriesMock.mockClear();

    act(() => {
      messageCallbacks.get(WsMessageType.NOTIFICATION_IDENTITIES_SYNCED)?.({
        profile_ids: ["profile-1", 2],
      });
      messageCallbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
        profile_id: 2,
      });
      jest.advanceTimersByTime(150);
    });
    expect(invalidateQueriesMock).not.toHaveBeenCalled();

    act(() => {
      messageCallbacks.get(WsMessageType.NOTIFICATION_IDENTITIES_SYNCED)?.({
        profile_ids: [],
      });
    });

    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2);
    expect(invalidateQueriesMock).toHaveBeenCalledWith(
      {
        queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
      },
      {
        cancelRefetch: false,
      }
    );
    expect(invalidateQueriesMock).toHaveBeenCalledWith(
      {
        queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
      },
      {
        cancelRefetch: false,
      }
    );
    unmount();
  });

  it("coalesces an in-flight refresh and still refreshes again when idle", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Number.POSITIVE_INFINITY,
          retry: false,
        },
      },
    });
    mockUseQueryClient.mockReturnValue(queryClient);
    queryClient.setQueryData(
      [QueryKey.IDENTITY_NOTIFICATIONS, "active-refresh"],
      { unread_count: 0 }
    );
    let resolveRefresh!: (value: { readonly unread_count: number }) => void;
    const refreshPromise = new Promise<{ readonly unread_count: number }>(
      (resolve) => {
        resolveRefresh = resolve;
      }
    );
    const queryFn = jest.fn(({ signal }: { readonly signal: AbortSignal }) => {
      expect(signal.aborted).toBe(false);
      return refreshPromise;
    });

    const { unmount } = render(
      createQueryClientWrapper(
        queryClient,
        <>
          <NotificationWebSocketSync />
          <ActiveNotificationsRefresh queryFn={queryFn} />
        </>
      )
    );
    await flushQueryWork();
    expect(queryFn).toHaveBeenCalledTimes(1);

    act(() => {
      messageCallbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
        profile_id: "profile-1",
      });
      jest.advanceTimersByTime(150);
    });
    await flushQueryWork();

    expect(queryFn).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveRefresh({ unread_count: 1 });
      await Promise.resolve();
    });
    await flushQueryWork();

    act(() => {
      messageCallbacks.get(WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED)?.({
        profile_id: "profile-1",
      });
      jest.advanceTimersByTime(150);
    });
    await flushQueryWork();
    expect(queryFn).toHaveBeenCalledTimes(2);

    unmount();
    queryClient.clear();
  });
});
