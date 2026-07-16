import { act, render } from "@testing-library/react";
import { WsMessageType } from "@/helpers/Types";
import { NotificationWebSocketSync } from "@/services/websocket/NotificationWebSocketSync";

const invalidateQueriesMock = jest.fn();
const sendMock = jest.fn();
const messageCallbacks = new Map<WsMessageType, (value: unknown) => void>();
const getAuthJwtMock = jest.fn();
const getConnectedWalletAccountsMock = jest.fn();

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
    status: "connected",
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

describe("NotificationWebSocketSync", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    messageCallbacks.clear();
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
    const { unmount } = render(<NotificationWebSocketSync />);

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
});
