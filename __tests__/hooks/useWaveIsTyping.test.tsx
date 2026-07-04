import { renderHook, act } from "@testing-library/react";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import { WsMessageType } from "@/helpers/Types";

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
