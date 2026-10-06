import { act, renderHook, waitFor } from "@testing-library/react";
import { useWaveWebSocket } from "@/hooks/useWaveWebSocket";

let mockAppActive = true;
jest.mock("@/hooks/useNativeAppActivity", () => ({
  useNativeAppActivity: () => mockAppActive,
}));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = MockWebSocket.CONNECTING;
  onopen = null as ((ev?: any) => any) | null;
  onclose = null as ((ev?: any) => any) | null;
  onerror = null as ((ev?: any) => any) | null;
  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose && this.onclose({});
  });
  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen && this.onopen({});
  }
  constructor(public url: string) {}
}

describe("useWaveWebSocket", () => {
  let originalWs: any;
  beforeEach(() => {
    mockAppActive = true;
    originalWs = global.WebSocket;
    (global as any).WebSocket = jest.fn(
      (url: string) => new MockWebSocket(url)
    );
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    (global as any).WebSocket = originalWs;
    jest.clearAllMocks();
  });

  it("connects and sends subscribe message", async () => {
    const { result } = renderHook(() => useWaveWebSocket("wave1"));
    const instance = (globalThis.WebSocket as jest.Mock).mock.results[0]
      ?.value as MockWebSocket;
    act(() => {
      instance.triggerOpen();
    });
    await waitFor(() =>
      expect(result.current.readyState).toBe(MockWebSocket.OPEN)
    );
    expect(instance.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "SUBSCRIBE_TO_WAVE", wave_id: "wave1" })
    );
  });

  it("schedules reconnect on close", () => {
    const spy = jest.spyOn(globalThis, "setTimeout");
    renderHook(() => useWaveWebSocket("wave1"));
    const instance = (globalThis.WebSocket as jest.Mock).mock.results[0]
      ?.value as MockWebSocket;
    act(() => {
      instance.onclose && instance.onclose({});
    });
    expect(spy).toHaveBeenCalled();
  });

  it("disconnect stops reconnecting", () => {
    const { result } = renderHook(() => useWaveWebSocket("wave1"));
    const instance = (globalThis.WebSocket as jest.Mock).mock.results[0]
      ?.value as MockWebSocket;
    act(() => {
      result.current.disconnect();
    });
    expect(instance.close).toHaveBeenCalled();
  });

  it("closes and cancels retries when inactive, then subscribes once on resume", () => {
    const { rerender } = renderHook(() => useWaveWebSocket("wave1"));
    const first = (globalThis.WebSocket as jest.Mock).mock.results[0]
      ?.value as MockWebSocket;
    act(() => first.onclose?.({}));
    expect(jest.getTimerCount()).toBe(1);
    mockAppActive = false;
    rerender();
    expect(first.close).toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(60_000));
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(1);
    mockAppActive = true;
    rerender();
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
    // An old close/open callback must not reconnect or subscribe after resume.
    act(() => {
      first.onclose?.({});
      first.triggerOpen();
    });
    act(() => jest.advanceTimersByTime(5000));
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
    expect(first.send).not.toHaveBeenCalled();
    const second = (globalThis.WebSocket as jest.Mock).mock.results[1]
      ?.value as MockWebSocket;
    act(() => second.triggerOpen());
    expect(second.send).toHaveBeenCalledTimes(1);
  });
});
