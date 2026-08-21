import { act, render, screen, waitFor } from "@testing-library/react";
import {
  DmUnreadStateProvider,
  useDmUnreadConversation,
  useOptionalDmUnreadActions,
  useDmUnreadSummary,
} from "@/services/dm-unread/DmUnreadStateProvider";

const commonApiFetchMock = jest.fn();
let connectedProfileId = "profile-1";
let jwt = "jwt-profile-1";
let isConnected = false;
let isCapacitor = false;
let isActive = true;
const websocketHandlers = new Map<string, (value: unknown) => void>();
let capturedDmUnreadActions: ReturnType<typeof useOptionalDmUnreadActions> =
  null;

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
  useWebSocketMessage: (type: string, handler: (value: unknown) => void) => {
    websocketHandlers.set(type, handler);
    return { isConnected };
  },
}));

const state = ({
  profileId = "profile-1",
  waveId = "wave-1",
  unreadCount = 1,
  version = 1,
  latestDropSerialNo = 10,
  firstUnreadDropSerialNo =
    unreadCount > 0 ? latestDropSerialNo : null,
  latestReadSerialNo =
    unreadCount > 0 ? latestDropSerialNo - 1 : latestDropSerialNo,
}: {
  profileId?: string;
  waveId?: string;
  unreadCount?: number;
  version?: number;
  latestDropSerialNo?: number;
  firstUnreadDropSerialNo?: number | null;
  latestReadSerialNo?: number;
} = {}) => ({
  profile_id: profileId,
  wave_id: waveId,
  unread_count: unreadCount,
  first_unread_drop_serial_no: firstUnreadDropSerialNo,
  latest_drop_serial_no: latestDropSerialNo,
  latest_read_serial_no: latestReadSerialNo,
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

const dropUpdate = ({
  authorId = "profile-2",
  serialNo = 11,
  waveId = "wave-1",
}: {
  authorId?: string;
  serialNo?: number;
  waveId?: string;
} = {}) => ({
  author: { id: authorId },
  serial_no: serialNo,
  wave: { id: waveId },
});

const dropUpdateRef = ({
  authorId = "profile-2",
  serialNo = 11,
  waveId = "wave-1",
}: {
  authorId?: string;
  serialNo?: number;
  waveId?: string;
} = {}) => ({
  author_id: authorId,
  serial_no: serialNo,
  update_type: "DROP_UPDATE",
  wave_id: waveId,
});

function Capture() {
  const summary = useDmUnreadSummary();
  const conversation = useDmUnreadConversation("wave-1");
  return (
    <div>
      <span data-testid="messages">{summary.totalUnreadMessages}</span>
      <span data-testid="conversations">{summary.unreadConversationCount}</span>
      <span data-testid="wave">{conversation?.unread_count ?? 0}</span>
    </div>
  );
}

function CaptureActions() {
  capturedDmUnreadActions = useOptionalDmUnreadActions();
  return null;
}

describe("DmUnreadStateProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectedProfileId = "profile-1";
    jwt = "jwt-profile-1";
    isConnected = false;
    isCapacitor = false;
    isActive = true;
    websocketHandlers.clear();
    capturedDmUnreadActions = null;
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
      websocketHandlers.get("DM_UNREAD_STATE_CHANGED")?.(
        state({ profileId: "profile-1", unreadCount: 3, version: 2 })
      );
    });

    expect(screen.getByTestId("messages")).toHaveTextContent("3");
    expect(screen.getByTestId("conversations")).toHaveTextContent("1");
    expect(screen.getByTestId("wave")).toHaveTextContent("3");
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("recovers a missed unread event after an incoming DM drop update", async () => {
    jest.useFakeTimers();
    commonApiFetchMock
      .mockResolvedValueOnce(
        snapshot("profile-1", [state({ unreadCount: 0, version: 1 })])
      )
      .mockResolvedValueOnce(
        snapshot("profile-1", [
          state({ unreadCount: 1, version: 2, latestDropSerialNo: 11 }),
        ])
      );

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);

      act(() => {
        websocketHandlers.get("DROP_UPDATE")?.(dropUpdate());
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1_499);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
  });

  it("recovers an incoming DM when the conversation is absent from the snapshot", async () => {
    jest.useFakeTimers();
    commonApiFetchMock
      .mockResolvedValueOnce(snapshot("profile-1", []))
      .mockResolvedValueOnce(
        snapshot("profile-1", [
          state({ unreadCount: 1, version: 1, latestDropSerialNo: 11 }),
        ])
      );

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);

      act(() => {
        websocketHandlers.get("DROP_UPDATE")?.(dropUpdate());
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1_500);
      });

      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
  });

  it("does not satisfy drop recovery with a snapshot started before the drop", async () => {
    jest.useFakeTimers();
    let resolvePreDropSnapshot!: (value: unknown) => void;
    commonApiFetchMock
      .mockResolvedValueOnce(
        snapshot("profile-1", [state({ unreadCount: 0, version: 1 })])
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePreDropSnapshot = resolve;
          })
      )
      .mockResolvedValueOnce(
        snapshot("profile-1", [
          state({ unreadCount: 1, version: 2, latestDropSerialNo: 11 }),
        ])
      );

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      act(() => window.dispatchEvent(new Event("focus")));
      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);

      act(() => {
        websocketHandlers.get("DROP_UPDATE")?.(dropUpdate());
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1_500);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);

      await act(async () => {
        resolvePreDropSnapshot(
          snapshot("profile-1", [state({ unreadCount: 0, version: 1 })])
        );
      });

      expect(commonApiFetchMock).toHaveBeenCalledTimes(3);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
  });

  it("recovers a missed unread event after a compact DM drop reference", async () => {
    jest.useFakeTimers();
    commonApiFetchMock
      .mockResolvedValueOnce(
        snapshot("profile-1", [state({ unreadCount: 0, version: 1 })])
      )
      .mockResolvedValueOnce(
        snapshot("profile-1", [
          state({ unreadCount: 1, version: 2, latestDropSerialNo: 11 }),
        ])
      );

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      act(() => {
        websocketHandlers.get("DROP_UPDATE_REF")?.(dropUpdateRef());
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1_500);
      });

      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
  });

  it("does not fetch when canonical unread state catches up in the grace period", async () => {
    jest.useFakeTimers();
    commonApiFetchMock.mockResolvedValueOnce(
      snapshot("profile-1", [state({ unreadCount: 0, version: 1 })])
    );

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      act(() => {
        websocketHandlers.get("DROP_UPDATE")?.(dropUpdate());
        websocketHandlers.get("DM_UNREAD_STATE_CHANGED")?.(
          state({ unreadCount: 1, version: 2, latestDropSerialNo: 11 })
        );
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1_500);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
  });

  it("recovers when an optimistic read still suppresses the incoming DM", async () => {
    jest.useFakeTimers();
    commonApiFetchMock
      .mockResolvedValueOnce(
        snapshot("profile-1", [
          state({
            unreadCount: 1,
            firstUnreadDropSerialNo: 10,
            latestDropSerialNo: 10,
            latestReadSerialNo: 9,
            version: 1,
          }),
        ])
      )
      .mockResolvedValueOnce(
        snapshot("profile-1", [
          state({
            unreadCount: 1,
            firstUnreadDropSerialNo: 11,
            latestDropSerialNo: 11,
            latestReadSerialNo: 10,
            version: 3,
          }),
        ])
      );

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
        <CaptureActions />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      act(() => {
        capturedDmUnreadActions?.beginRead("wave-1", 10);
      });
      expect(screen.getByTestId("messages")).toHaveTextContent("0");

      act(() => {
        websocketHandlers.get("DROP_UPDATE")?.(dropUpdate());
        websocketHandlers.get("DM_UNREAD_STATE_CHANGED")?.(
          state({
            unreadCount: 1,
            firstUnreadDropSerialNo: 10,
            latestDropSerialNo: 11,
            latestReadSerialNo: 9,
            version: 2,
          })
        );
      });
      expect(screen.getByTestId("messages")).toHaveTextContent("0");

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1_500);
      });

      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
  });

  it("retries a transient snapshot failure through the jittered recovery policy", async () => {
    jest.useFakeTimers();
    const error = new Error("snapshot failed");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    commonApiFetchMock
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(snapshot("profile-1"));

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("messages")).toHaveTextContent("0");

      await act(async () => {
        await jest.advanceTimersByTimeAsync(3_999);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(2_001);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      rendered.unmount();
      consoleError.mockRestore();
      jest.useRealTimers();
    }
  });

  it("stops retrying terminal snapshot failures for the current activation", async () => {
    jest.useFakeTimers();
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    commonApiFetchMock.mockRejectedValue({ status: 403 });

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledTimes(1);

      await act(async () => {
        window.dispatchEvent(new Event("focus"));
        window.dispatchEvent(new Event("online"));
        await jest.advanceTimersByTimeAsync(10 * 60 * 1_000);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    } finally {
      rendered.unmount();
      consoleError.mockRestore();
      jest.useRealTimers();
    }
  });

  it("periodically reconciles state after a missed server event", async () => {
    jest.useFakeTimers();
    commonApiFetchMock
      .mockResolvedValueOnce(snapshot("profile-1"))
      .mockResolvedValueOnce(snapshot("profile-1", []));

    const rendered = render(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("messages")).toHaveTextContent("1");

      await act(async () => {
        await jest.advanceTimersByTimeAsync(5 * 60 * 1_000);
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("messages")).toHaveTextContent("0");
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
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

    connectedProfileId = "profile-1";
    jwt = "jwt-profile-1";
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    expect(screen.getByTestId("messages")).toHaveTextContent("0");
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(3));

    await act(async () => {
      resolveReturnedProfileOne(snapshot("profile-1"));
    });
  });

  it("does not reuse an old in-flight snapshot after A to B to A", async () => {
    let resolveOldProfileOne!: (value: unknown) => void;
    commonApiFetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOldProfileOne = resolve;
          })
      )
      .mockResolvedValueOnce(snapshot("profile-2"))
      .mockResolvedValueOnce(
        snapshot("profile-1", [
          state({ profileId: "profile-1", unreadCount: 7, version: 2 }),
        ])
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
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(2));

    connectedProfileId = "profile-1";
    jwt = "jwt-profile-1";
    rerender(
      <DmUnreadStateProvider>
        <Capture />
      </DmUnreadStateProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("messages")).toHaveTextContent("7")
    );
    expect(commonApiFetchMock).toHaveBeenCalledTimes(3);

    await act(async () => {
      resolveOldProfileOne(
        snapshot("profile-1", [
          state({ profileId: "profile-1", unreadCount: 99, version: 99 }),
        ])
      );
    });
    expect(screen.getByTestId("messages")).toHaveTextContent("7");
  });

  it("rejects an HTTP callback captured before A to B to A", async () => {
    const { rerender } = render(
      <DmUnreadStateProvider>
        <Capture />
        <CaptureActions />
      </DmUnreadStateProvider>
    );
    await waitFor(() => expect(capturedDmUnreadActions).not.toBeNull());
    const oldProfileOneActions = capturedDmUnreadActions;

    connectedProfileId = "profile-2";
    jwt = "jwt-profile-2";
    commonApiFetchMock.mockResolvedValueOnce(snapshot("profile-2"));
    rerender(
      <DmUnreadStateProvider>
        <Capture />
        <CaptureActions />
      </DmUnreadStateProvider>
    );
    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalledTimes(2));

    connectedProfileId = "profile-1";
    jwt = "jwt-profile-1";
    commonApiFetchMock.mockResolvedValueOnce(snapshot("profile-1"));
    rerender(
      <DmUnreadStateProvider>
        <Capture />
        <CaptureActions />
      </DmUnreadStateProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("messages")).toHaveTextContent("1")
    );

    act(() => {
      oldProfileOneActions?.applyServerState(
        state({ profileId: "profile-1", unreadCount: 99, version: 99 })
      );
    });
    expect(screen.getByTestId("messages")).toHaveTextContent("1");
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
      websocketHandlers.get("DM_UNREAD_STATE_CHANGED")?.(
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
