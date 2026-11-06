import { renderHook, act } from "@testing-library/react";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import { WsMessageType } from "@/helpers/Types";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

let mockAppActive = true;
jest.mock("@/hooks/useMobileAppActivity", () => ({
  ...jest.requireActual("@/hooks/useMobileAppActivity"),
  useMobileAppActivity: () => mockAppActive,
}));

const listeners: any[] = [];
const mockAddEventListener = jest.fn((_: string, cb: any) =>
  listeners.push(cb)
);
const mockRemoveEventListener = jest.fn();
let mockSocket = {
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
};
let mockConnected = true;
const mockUseWaveWebSocket = jest.fn((waveId: string) => ({
  socket: waveId && mockConnected ? mockSocket : null,
}));

jest.mock("@/hooks/useWaveWebSocket", () => ({
  useWaveWebSocket: (waveId: string) => mockUseWaveWebSocket(waveId),
}));

// Drop frames reach the hook through the app socket.
const mockAppSocketCallbacks = new Map<string, (data: unknown) => void>();
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (type: string, callback: (data: unknown) => void) => {
    mockAppSocketCallbacks.set(type, callback);
    return { isConnected: true };
  },
}));

const appSocketFrame = (type: WsMessageType, data: unknown) => {
  const callback = mockAppSocketCallbacks.get(type);
  if (!callback) throw new Error(`No app socket handler for ${type}`);
  callback(data);
};

const typingFrom = (handle: string, waveId = "wave") => ({
  data: JSON.stringify({
    type: WsMessageType.USER_IS_TYPING,
    data: { wave_id: waveId, profile: { handle, level: 1 } },
  }),
});

beforeEach(() => {
  mockAppActive = true;
  mockConnected = true;
  listeners.length = 0;
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();
  mockUseWaveWebSocket.mockClear();
  mockAppSocketCallbacks.clear();
});

test("has no typing timer while idle and stops after the final typer expires", () => {
  jest.useFakeTimers();
  const { result, unmount } = renderHook(() => useWaveIsTyping("wave", null));
  expect(jest.getTimerCount()).toBe(0);
  act(() =>
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.USER_IS_TYPING,
        data: { wave_id: "wave", profile: { handle: "A", level: 1 } },
      }),
    })
  );
  expect(result.current).toContain("A is typing");
  expect(jest.getTimerCount()).toBe(1);
  act(() => jest.advanceTimersByTime(5000));
  expect(result.current).toBe("");
  expect(jest.getTimerCount()).toBe(0);
  unmount();
});

test("extends typing expiry when a new event arrives", () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useWaveIsTyping("wave", null));
  const event = {
    data: JSON.stringify({
      type: WsMessageType.USER_IS_TYPING,
      data: { wave_id: "wave", profile: { handle: "A", level: 1 } },
    }),
  };
  act(() => listeners[0](event));
  act(() => jest.advanceTimersByTime(4000));
  act(() => listeners[0](event));
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toContain("A is typing");
  act(() => jest.advanceTimersByTime(4000));
  expect(result.current).toBe("");
  expect(jest.getTimerCount()).toBe(0);
});

test("clears timers and subscriptions while the native app is inactive", () => {
  jest.useFakeTimers();
  const { result, rerender } = renderHook(() => useWaveIsTyping("wave", null));
  act(() =>
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.USER_IS_TYPING,
        data: { wave_id: "wave", profile: { handle: "A", level: 1 } },
      }),
    })
  );
  mockAppActive = false;
  rerender();
  expect(result.current).toBe("");
  expect(mockUseWaveWebSocket).toHaveBeenLastCalledWith("");
  expect(jest.getTimerCount()).toBe(0);
  mockAppActive = true;
  mockUseWaveWebSocket.mockReturnValueOnce({ socket: null });
  rerender();
  expect(result.current).toBe("");
});

afterEach(() => {
  jest.useRealTimers();
});

test("reports typing status and clears after timeout", () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useWaveIsTyping("wave", null));

  act(() => {
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.USER_IS_TYPING,
        data: { wave_id: "wave", profile: { handle: "A", level: 1 } },
      }),
    });
  });
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toContain("A is typing");

  act(() => jest.advanceTimersByTime(6000));
  expect(result.current).toBe("");
});

test("clears typing status when a compact content update arrives", () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useWaveIsTyping("wave", null));

  act(() => {
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.USER_IS_TYPING,
        data: { wave_id: "wave", profile: { handle: "A", level: 1 } },
      }),
    });
  });
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toContain("A is typing");

  act(() => {
    appSocketFrame(WsMessageType.DROP_UPDATE_REF, {
      author_id: "author-1",
      drop_id: "drop-1",
      wave_id: "wave",
      serial_no: 1,
      update_type: WsMessageType.DROP_UPDATE,
    });
  });

  expect(result.current).toBe("");
});

test("clears a typer when their drop arrives on the app socket", () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useWaveIsTyping("wave", null));

  act(() => {
    listeners[0](typingFrom("A"));
    listeners[0](typingFrom("B"));
  });
  expect(result.current).toBe("A, B are typing");

  // A drop by A in another wave, and a drop without an author, change nothing.
  act(() => {
    appSocketFrame(WsMessageType.DROP_UPDATE, {
      wave: { id: "other-wave" },
      author: { handle: "A" },
    });
    appSocketFrame(WsMessageType.DROP_UPDATE, { wave: { id: "wave" } });
  });
  expect(result.current).toBe("A, B are typing");

  act(() => {
    appSocketFrame(WsMessageType.DROP_UPDATE, {
      wave: { id: "wave" },
      author: { handle: "A" },
    });
  });
  expect(result.current).toBe("B is typing");
});

test("ignores drop frames on the typing socket", () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useWaveIsTyping("wave", null));

  act(() => {
    listeners[0](typingFrom("A"));
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.DROP_UPDATE,
        data: { wave: { id: "wave" }, author: { handle: "A" } },
      }),
    });
  });

  // Typing-purpose sockets get no drops; the app socket's frame clears A.
  expect(result.current).toBe("A is typing");
});

test("ignores app socket drops while paused", () => {
  jest.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ enabled }: { enabled: boolean }) =>
      useWaveIsTyping("wave", null, false, { enabled }),
    { initialProps: { enabled: true } }
  );
  act(() => listeners[0](typingFrom("A")));
  rerender({ enabled: false });

  expect(() =>
    act(() =>
      appSocketFrame(WsMessageType.DROP_UPDATE, {
        wave: { id: "wave" },
        author: { handle: "A" },
      })
    )
  ).not.toThrow();
  expect(result.current).toBe("");
});

test("skips websocket work while the deferred typing gate is disabled", () => {
  jest.useFakeTimers();
  const { result } = renderHook(() =>
    useWaveIsTyping("wave", null, false, { enabled: false })
  );

  expect(mockUseWaveWebSocket).toHaveBeenLastCalledWith("");
  expect(mockAddEventListener).not.toHaveBeenCalled();

  act(() => jest.advanceTimersByTime(2000));

  expect(result.current).toBe("");
  expect(listeners).toHaveLength(0);
});

test("clears labels immediately while the authenticated listener reconnects", () => {
  jest.useFakeTimers();
  const { result, rerender } = renderHook(() => useWaveIsTyping("wave", null));
  act(() => {
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.USER_IS_TYPING,
        data: { wave_id: "wave", profile: { handle: "A", level: 1 } },
      }),
    });
    jest.advanceTimersByTime(1000);
  });
  expect(result.current).toBe("A is typing");
  mockConnected = false;
  rerender();
  expect(result.current).toBe("");
  mockSocket = {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  };
  mockConnected = true;
  rerender();
  expect(result.current).toBe("");
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toBe("");
});

test("clears profile typing immediately even when the socket is unchanged", () => {
  jest.useFakeTimers();
  const removeListener = jest.spyOn(globalThis, "removeEventListener");
  const { result, unmount } = renderHook(() => useWaveIsTyping("wave", null));
  const receiveTyping = () => {
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.USER_IS_TYPING,
        data: { wave_id: "wave", profile: { handle: "A", level: 1 } },
      }),
    });
    jest.advanceTimersByTime(1000);
  };

  act(receiveTyping);
  expect(result.current).toBe("A is typing");
  act(() => globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT)));
  expect(result.current).toBe("");
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toBe("");
  expect(mockAddEventListener).toHaveBeenCalledTimes(1);

  act(receiveTyping);
  expect(result.current).toBe("A is typing");
  unmount();
  expect(removeListener).toHaveBeenCalledWith(
    PROFILE_SWITCHED_EVENT,
    expect.any(Function)
  );
  removeListener.mockRestore();
});
