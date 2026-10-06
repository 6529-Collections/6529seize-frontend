import { renderHook, act } from "@testing-library/react";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import { WsMessageType } from "@/helpers/Types";

let mockAppActive = true;
jest.mock("@/hooks/useNativeAppActivity", () => ({
  useNativeAppActivity: () => mockAppActive,
}));

const listeners: any[] = [];
const mockAddEventListener = jest.fn((_: string, cb: any) =>
  listeners.push(cb)
);
const mockRemoveEventListener = jest.fn();
const mockUseWaveWebSocket = jest.fn((waveId: string) => ({
  socket: waveId
    ? {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      }
    : null,
}));

jest.mock("@/hooks/useWaveWebSocket", () => ({
  useWaveWebSocket: (waveId: string) => mockUseWaveWebSocket(waveId),
}));

beforeEach(() => {
  mockAppActive = true;
  listeners.length = 0;
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();
  mockUseWaveWebSocket.mockClear();
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
