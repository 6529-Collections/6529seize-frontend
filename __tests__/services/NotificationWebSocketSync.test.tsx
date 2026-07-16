import { act, render, screen } from "@testing-library/react";
import { WsMessageType } from "@/helpers/Types";
import {
  setNotificationRealtimeState,
  useNotificationRealtimeState,
} from "@/services/notifications/notification-realtime-state";
import { NotificationWebSocketSync } from "@/services/websocket/NotificationWebSocketSync";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

const invalidateQueriesMock = jest.fn();
const sendMock = jest.fn();
const messageCallbacks = new Map<WsMessageType, (value: unknown) => void>();
const getAuthJwtMock = jest.fn();
const getConnectedWalletAccountsMock = jest.fn();
let webSocketStatus = WebSocketStatus.CONNECTED;

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
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

describe("NotificationWebSocketSync", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
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
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS"],
    });
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

    expect(sendMock).toHaveBeenLastCalledWith(
      WsMessageType.SYNC_NOTIFICATION_IDENTITIES,
      {
        access_tokens: ["reconnect-primary-jwt", "reconnect-secondary-jwt"],
      }
    );
    expect(screen.getByTestId("realtime-state")).toHaveTextContent("true:");
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
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["IDENTITY_NOTIFICATIONS"],
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS"],
    });
    unmount();
  });
});
