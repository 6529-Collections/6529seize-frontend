import { act, render, screen, waitFor } from "@testing-library/react";
import {
  DmUnreadStateProvider,
  useDmUnreadConversation,
  useDmUnreadSnapshotReady,
  useDmUnreadSummary,
} from "@/services/dm-unread/DmUnreadStateProvider";

const commonApiFetchMock = jest.fn();
const invalidateQueriesMock = jest.fn(() => Promise.resolve());
let connectedProfileId = "profile-1";
let jwt = "jwt-profile-1";
let isConnected = false;
let isCapacitor = false;
let isActive = true;
let websocketHandler: ((value: unknown) => void) | undefined;

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    activeProfileProxy: null,
    connectedProfile: connectedProfileId ? { id: connectedProfileId } : null,
    isAuthenticated: true,
  }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isActive, isCapacitor }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetchMock(...args),
}));

jest.mock("@/services/auth/auth-token-fingerprint", () => ({
  getAuthTokenFingerprint: (value: string | null) => value,
}));

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "auth-token-changed",
  PROFILE_SWITCHED_EVENT: "profile-switched",
  WALLET_ACCOUNTS_UPDATED_EVENT: "wallet-accounts-updated",
  getAuthJwt: () => jwt,
  isAuthJwtUsable: (value: string | null) => Boolean(value),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (_type: string, handler: (value: unknown) => void) => {
    websocketHandler = handler;
    return { isConnected };
  },
}));

const state = ({
  profileId = "profile-1",
  waveId = "wave-1",
  unreadCount = 1,
  version = 1,
}: {
  profileId?: string;
  waveId?: string;
  unreadCount?: number;
  version?: number;
} = {}) => ({
  profile_id: profileId,
  wave_id: waveId,
  unread_count: unreadCount,
  first_unread_drop_serial_no: unreadCount > 0 ? 10 : null,
  latest_drop_serial_no: 10,
  latest_read_serial_no: unreadCount > 0 ? 9 : 10,
  version,
});

const snapshot = (
  profileId: string,
  conversations = [state({ profileId })]
) => ({
  profile_id: profileId,
  count: conversations.reduce(
    (total, conversation) => total + conversation.unread_count,
    0
  ),
  conversations,
});

function Capture() {
  const summary = useDmUnreadSummary();
  const conversation = useDmUnreadConversation("wave-1");
  const isSnapshotReady = useDmUnreadSnapshotReady();
  return (
    <div>
      <span data-testid="messages">{summary.totalUnreadMessages}</span>
      <span data-testid="conversations">{summary.unreadConversationCount}</span>
      <span data-testid="wave">{conversation?.unread_count ?? 0}</span>
      <span data-testid="ready">{String(isSnapshotReady)}</span>
    </div>
  );
}

describe("DmUnreadStateProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectedProfileId = "profile-1";
    jwt = "jwt-profile-1";
    isConnected = false;
    isCapacitor = false;
    isActive = true;
    websocketHandler = undefined;
    commonApiFetchMock.mockResolvedValue(snapshot("profile-1"));
  });

  it("loads one initial snapshot and applies recipient-scoped websocket state", async () => {
    render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("messages")).toHaveTextContent("1")
    );
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "dm-drops/unread/snapshot",
      headers: { Authorization: "Bearer jwt-profile-1" },
      errorMode: "structured",
    });

    act(() => {
      websocketHandler?.(
        state({ profileId: "profile-1", unreadCount: 3, version: 2 })
      );
    });

    expect(screen.getByTestId("messages")).toHaveTextContent("3");
    expect(screen.getByTestId("conversations")).toHaveTextContent("1");
    expect(screen.getByTestId("wave")).toHaveTextContent("3");
    expect(screen.getByTestId("ready")).toHaveTextContent("true");
  });

  it("keeps canonical state unready until the first valid snapshot arrives", async () => {
    let resolveSnapshot!: (value: unknown) => void;
    commonApiFetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSnapshot = resolve;
        })
    );

    render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    expect(screen.getByTestId("ready")).toHaveTextContent("false");

    await act(async () => {
      resolveSnapshot(snapshot("profile-1"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("ready")).toHaveTextContent("true")
    );
  });

  it("keeps empty state and reports an initial snapshot failure", async () => {
    const error = new Error("snapshot failed");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    commonApiFetchMock.mockRejectedValueOnce(error);

    render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to synchronize DM unread state",
        error
      )
    );
    expect(screen.getByTestId("messages")).toHaveTextContent("0");
    expect(screen.getByTestId("wave")).toHaveTextContent("0");
    expect(screen.getByTestId("ready")).toHaveTextContent("false");
  });

  it("coalesces reconnect and browser recovery events", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    const { rerender } = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(1));

    isConnected = true;
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(2));

    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);

    nowSpy.mockReturnValue(11_501);
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(3));
    nowSpy.mockRestore();
  });

  it("coalesces DM wave-list invalidations for websocket bursts", async () => {
    render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("messages")).toHaveTextContent("1")
    );

    act(() => {
      websocketHandler?.(state({ unreadCount: 2, version: 2 }));
      websocketHandler?.(state({ unreadCount: 3, version: 3 }));
    });

    await waitFor(() => expect(invalidateQueriesMock).toHaveBeenCalledTimes(1));
  });

  it("does not let a stale profile snapshot bleed into the switched profile", async () => {
    let resolveProfileOne!: (value: unknown) => void;
    let resolveReturnedProfileOne!: (value: unknown) => void;
    commonApiFetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveProfileOne = resolve;
          })
      )
      .mockResolvedValueOnce(
        snapshot("profile-2", [
          state({ profileId: "profile-2", unreadCount: 4, version: 1 }),
        ])
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveReturnedProfileOne = resolve;
          })
      );
    const { rerender } = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    connectedProfileId = "profile-2";
    jwt = "jwt-profile-2";
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("messages")).toHaveTextContent("4")
    );

    await act(async () => {
      resolveProfileOne(
        snapshot("profile-1", [
          state({ profileId: "profile-1", unreadCount: 99, version: 99 }),
        ])
      );
    });

    expect(screen.getByTestId("messages")).toHaveTextContent("4");
    expect(screen.getByTestId("wave")).toHaveTextContent("4");
    expect(screen.getByTestId("ready")).toHaveTextContent("true");

    connectedProfileId = "profile-1";
    jwt = "jwt-profile-1";
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    expect(screen.getByTestId("messages")).toHaveTextContent("0");
    expect(screen.getByTestId("ready")).toHaveTextContent("false");
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(3));

    await act(async () => {
      resolveReturnedProfileOne(snapshot("profile-1"));
    });
  });

  it("ignores websocket state for an inactive profile", async () => {
    const { rerender } = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("messages")).toHaveTextContent("1")
    );

    commonApiFetchMock
      .mockResolvedValueOnce(
        snapshot("profile-2", [
          state({ profileId: "profile-2", unreadCount: 4, version: 1 }),
        ])
      )
      .mockImplementationOnce(() => new Promise(() => undefined));
    connectedProfileId = "profile-2";
    jwt = "jwt-profile-2";
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("messages")).toHaveTextContent("4")
    );

    act(() => {
      websocketHandler?.(
        state({ profileId: "profile-1", unreadCount: 99, version: 99 })
      );
    });

    connectedProfileId = "profile-1";
    jwt = "jwt-profile-1";
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    expect(screen.getByTestId("messages")).toHaveTextContent("0");
    expect(screen.getByTestId("ready")).toHaveTextContent("false");
  });

  it("takes one snapshot when the native app returns to the foreground", async () => {
    isCapacitor = true;
    isActive = false;
    const { rerender } = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(1));

    isActive = true;
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(2));
  });
});
