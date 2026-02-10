import { act, renderHook, waitFor } from "@testing-library/react";
import { useWaveWebSocket } from "@/hooks/useWaveWebSocket";

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
});
