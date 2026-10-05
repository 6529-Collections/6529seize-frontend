import { act, renderHook } from "@testing-library/react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useSessionRecovery } from "@/components/auth/useSessionRecovery";
import { ensureActiveSession } from "@/services/auth/session-readiness";

jest.mock("@/services/auth/session-readiness", () => ({
  ensureActiveSession: jest.fn(),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "token-change",
  WALLET_ACCOUNTS_UPDATED_EVENT: "account-change",
}));
jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn(() => false) },
}));
jest.mock("@capacitor/app", () => ({ App: { addListener: jest.fn() } }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.mocked(ensureActiveSession).mockResolvedValue("token");
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});
afterEach(() => jest.useRealTimers());

it("recovers on cold start, focus and online, and removes listeners/timer on unmount", () => {
  const { unmount } = renderHook(() => useSessionRecovery(true));
  expect(ensureActiveSession).toHaveBeenCalledWith({ renewBeforeSeconds: 60 });
  act(() => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
  });
  expect(ensureActiveSession).toHaveBeenCalledTimes(3);
  act(() => {
    jest.advanceTimersByTime(30000);
  });
  expect(ensureActiveSession).toHaveBeenCalledTimes(4);
  unmount();
  act(() => {
    window.dispatchEvent(new Event("focus"));
    jest.advanceTimersByTime(30000);
  });
  expect(ensureActiveSession).toHaveBeenCalledTimes(4);
});

it("pauses renewal while hidden and retries a temporary failure when visible again", async () => {
  jest.mocked(ensureActiveSession).mockRejectedValueOnce(new Error("offline"));
  renderHook(() => useSessionRecovery(true));
  await act(async () => {
    await Promise.resolve();
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  act(() => {
    jest.advanceTimersByTime(60000);
  });
  expect(ensureActiveSession).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(ensureActiveSession).toHaveBeenCalledTimes(2);
});

it("does not proactively renew a newly persisted short-lived token again", () => {
  renderHook(() => useSessionRecovery(true));
  act(() => {
    window.dispatchEvent(new Event("token-change"));
    window.dispatchEvent(new Event("account-change"));
  });
  expect(ensureActiveSession).toHaveBeenNthCalledWith(1, {
    renewBeforeSeconds: 60,
  });
  expect(ensureActiveSession).toHaveBeenNthCalledWith(2, {
    renewBeforeSeconds: 0,
  });
  expect(ensureActiveSession).toHaveBeenNthCalledWith(3, {
    renewBeforeSeconds: 0,
  });
});

it("handles native foreground activation and removes the native subscription", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  const remove = jest.fn().mockResolvedValue(undefined);
  let onState!: (state: { isActive: boolean }) => void;
  // Select this overload explicitly; Jest otherwise uses the last (backButton).
  const addStateListener: (
    name: "appStateChange",
    listener: (state: { isActive: boolean }) => void
  ) => Promise<{ remove: () => Promise<void> }> = App.addListener;
  jest.mocked(addStateListener).mockImplementation((_name, listener) => {
    onState = listener;
    return Promise.resolve({ remove });
  });
  const { unmount } = renderHook(() => useSessionRecovery(true));
  act(() => {
    onState({ isActive: false });
    onState({ isActive: true });
  });
  expect(ensureActiveSession).toHaveBeenCalledTimes(2);
  unmount();
  await act(async () => {
    await Promise.resolve();
  });
  expect(remove).toHaveBeenCalledTimes(1);
});
