import { act, render } from "@testing-library/react";
import { WsMessageType } from "@/helpers/Types";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { WebSocketRecoverySync } from "@/services/websocket/WebSocketRecoverySync";
import { mockRandomUnit } from "../../helpers/mockRandomUnit";

const mockInvalidate = jest.fn().mockResolvedValue(undefined);
const mockClient = { invalidateQueries: mockInvalidate };
const mockUnsubscribe = jest.fn();
let mockListener: () => void;
let mockStatus = WebSocketStatus.CONNECTED;
let mockActive = true;
const mockSubscribe = jest.fn((_type, callback) => {
  mockListener = callback;
  return mockUnsubscribe;
});
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockClient,
}));
jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: () => ({ status: mockStatus, subscribe: mockSubscribe }),
}));
jest.mock("@/hooks/useMobileAppActivity", () => ({
  useMobileAppActivity: () => mockActive,
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockStatus = WebSocketStatus.CONNECTED;
  mockActive = true;
  mockRandomUnit(0);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("combines recovery markers and refreshes active queries after a delay", () => {
  render(<WebSocketRecoverySync />);
  expect(mockSubscribe).toHaveBeenCalledWith(
    WsMessageType.RESYNC_REQUIRED,
    expect.any(Function)
  );
  act(() => {
    for (let i = 0; i < 20; i++) mockListener();
    jest.advanceTimersByTime(999);
  });
  expect(mockInvalidate).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
  expect(mockInvalidate).toHaveBeenCalledWith({ refetchType: "active" });
});
it("does not refetch on the initial connection", () => {
  mockStatus = WebSocketStatus.CONNECTING;
  const { rerender } = render(<WebSocketRecoverySync />);
  mockStatus = WebSocketStatus.CONNECTED;
  rerender(<WebSocketRecoverySync />);
  act(() => jest.advanceTimersByTime(10_000));
  expect(mockInvalidate).not.toHaveBeenCalled();
});
it("refreshes after reconnect even if no subsequent event arrives", () => {
  const { rerender } = render(<WebSocketRecoverySync />);
  act(() => jest.advanceTimersByTime(1000));
  mockStatus = WebSocketStatus.DISCONNECTED;
  rerender(<WebSocketRecoverySync />);
  mockStatus = WebSocketStatus.CONNECTED;
  rerender(<WebSocketRecoverySync />);
  act(() => jest.advanceTimersByTime(6000));
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
});
it("holds refreshes while the browser is hidden, then refetches on resume", () => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  render(<WebSocketRecoverySync />);
  act(() => {
    mockListener();
    jest.advanceTimersByTime(10_000);
  });
  expect(mockInvalidate).not.toHaveBeenCalled();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
    jest.advanceTimersByTime(1000);
  });
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
});
it("does not refetch while the native app is inactive and cancels work on unmount", () => {
  mockActive = false;
  const { rerender, unmount } = render(<WebSocketRecoverySync />);
  act(() => {
    mockListener();
    jest.advanceTimersByTime(10_000);
  });
  expect(mockInvalidate).not.toHaveBeenCalled();
  mockActive = true;
  rerender(<WebSocketRecoverySync />);
  unmount();
  act(() => jest.advanceTimersByTime(10_000));
  expect(mockInvalidate).not.toHaveBeenCalled();
  expect(mockUnsubscribe).toHaveBeenCalled();
});
it("does not refetch on window focus or a brief tab switch", () => {
  render(<WebSocketRecoverySync />);
  act(() => {
    window.dispatchEvent(new Event("focus"));
    jest.advanceTimersByTime(10_000);
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    jest.advanceTimersByTime(29_000);
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
    jest.advanceTimersByTime(10_000);
  });
  expect(mockInvalidate).not.toHaveBeenCalled();
});
it("refetches when a tab returns after being hidden long enough to miss updates", () => {
  render(<WebSocketRecoverySync />);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    jest.advanceTimersByTime(30_000);
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
    jest.advanceTimersByTime(1000);
  });
  expect(mockInvalidate).toHaveBeenCalledTimes(1);
  expect(mockInvalidate).toHaveBeenCalledWith({ refetchType: "active" });
});
