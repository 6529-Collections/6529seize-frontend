import { renderHook, act } from "@testing-library/react";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import { WsMessageType } from "@/helpers/Types";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

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

beforeEach(() => {
  mockConnected = true;
  listeners.length = 0;
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();
  mockUseWaveWebSocket.mockClear();
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
    listeners[0]({
      data: JSON.stringify({
        type: WsMessageType.DROP_UPDATE_REF,
        data: {
          author_id: "author-1",
          drop_id: "drop-1",
          wave_id: "wave",
          serial_no: 1,
          update_type: WsMessageType.DROP_UPDATE,
        },
      }),
    });
  });
  act(() => jest.advanceTimersByTime(1000));

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
