import { act, renderHook, waitFor } from "@testing-library/react";
import { useWaveWebSocket } from "@/hooks/useWaveWebSocket";

let mockAppActive = true;
jest.mock("@/hooks/useMobileAppActivity", () => ({
  ...jest.requireActual("@/hooks/useMobileAppActivity"),
  useMobileAppActivity: () => mockAppActive,
}));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose && this.onclose();
  });
  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen && this.onopen();
  }
  constructor(public url: string) {}
}

const socketFactory = jest.fn((url: string) => new MockWebSocket(url));
Object.assign(socketFactory, { CLOSED: MockWebSocket.CLOSED });
function getSocket(index = 0): MockWebSocket {
  const socket = socketFactory.mock.results[index]?.value;
  if (!socket) throw new Error("Expected a WebSocket connection");
  return socket;
}

describe("useWaveWebSocket", () => {
  let originalWs: typeof WebSocket;
  beforeEach(() => {
    mockAppActive = true;
    originalWs = globalThis.WebSocket;
    Object.defineProperty(globalThis, "WebSocket", {
      configurable: true,
      value: socketFactory,
      writable: true,
    });
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    globalThis.WebSocket = originalWs;
    jest.clearAllMocks();
  });

  it("connects and sends subscribe message", async () => {
    const { result } = renderHook(() => useWaveWebSocket("wave1"));
    const instance = getSocket();
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
    const instance = getSocket();
    act(() => {
      instance.onclose && instance.onclose();
    });
    expect(spy).toHaveBeenCalled();
  });

  it("disconnect stops reconnecting", () => {
    const { result } = renderHook(() => useWaveWebSocket("wave1"));
    const instance = getSocket();
    act(() => {
      result.current.disconnect();
    });
    expect(instance.close).toHaveBeenCalled();
  });

  it("closes and cancels retries when inactive, then subscribes once on resume", () => {
    const { rerender } = renderHook(() => useWaveWebSocket("wave1"));
    const first = getSocket();
    act(() => first.onclose?.());
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
      first.onclose?.();
      first.triggerOpen();
    });
    act(() => jest.advanceTimersByTime(5000));
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
    expect(first.send).not.toHaveBeenCalled();
    const second = getSocket(1);
    act(() => second.triggerOpen());
    expect(second.send).toHaveBeenCalledTimes(1);
  });

  it("keeps a manual disconnect across activity changes but permits a new wave", () => {
    const { result, rerender } = renderHook(
      ({ waveId }) => useWaveWebSocket(waveId),
      { initialProps: { waveId: "wave1" } }
    );
    act(() => result.current.disconnect());
    mockAppActive = false;
    rerender({ waveId: "wave1" });
    mockAppActive = true;
    rerender({ waveId: "wave1" });
    act(() => jest.advanceTimersByTime(60_000));
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(1);
    expect(result.current.readyState).toBe(MockWebSocket.CLOSED);
    expect(result.current.socket).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
    rerender({ waveId: "wave2" });
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(2);
    const second = getSocket(1);
    act(() => second.triggerOpen());
    expect(second.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "SUBSCRIBE_TO_WAVE", wave_id: "wave2" })
    );
    rerender({ waveId: "wave1" });
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(3);
  });
});
