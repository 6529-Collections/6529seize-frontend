import { act, renderHook } from "@testing-library/react";
import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { useNativeAppActivity } from "@/hooks/useNativeAppActivity";

jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: { isNativePlatform: jest.fn(() => true) },
}));
jest.mock("@capacitor/app", () => ({
  App: { addListener: jest.fn(), getState: jest.fn() },
}));

let sendState: (state: { isActive: boolean }) => void;
const mockAddListener = App.addListener as jest.Mock;
const remove = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  jest.mocked(App.getState).mockResolvedValue({ isActive: true });
  mockAddListener.mockImplementation(
    (_event: string, listener: typeof sendState) => {
      sendState = listener;
      return Promise.resolve({ remove });
    }
  );
});

async function flushState(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

it("shares one native listener/state read and removes it after the final consumer", async () => {
  const first = renderHook(useNativeAppActivity);
  const second = renderHook(useNativeAppActivity);
  await flushState();
  expect(App.addListener).toHaveBeenCalledTimes(1);
  expect(App.getState).toHaveBeenCalledTimes(1);

  act(() => sendState({ isActive: false }));
  expect(first.result.current).toBe(false);
  expect(second.result.current).toBe(false);
  first.unmount();
  expect(remove).not.toHaveBeenCalled();
  second.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

it("does not let a stale initial state overwrite a newer pause event", async () => {
  let resolveState: ((state: { isActive: boolean }) => void) | undefined;
  jest.mocked(App.getState).mockReturnValue(
    new Promise((resolve) => {
      resolveState = resolve;
    })
  );
  const { result } = renderHook(useNativeAppActivity);
  act(() => sendState({ isActive: false }));
  await act(async () => resolveState?.({ isActive: true }));
  expect(result.current).toBe(false);
  act(() => sendState({ isActive: true }));
  expect(result.current).toBe(true);
});

it("removes a native listener whose registration resolves after unmount", async () => {
  let resolveListener: ((handle: PluginListenerHandle) => void) | undefined;
  mockAddListener.mockReturnValue(
    new Promise((resolve) => {
      resolveListener = resolve;
    })
  );
  const { unmount } = renderHook(useNativeAppActivity);
  unmount();
  await act(async () => resolveListener?.({ remove }));
  expect(remove).toHaveBeenCalledTimes(1);
});

it("requires both document visibility and native activity", async () => {
  const { result } = renderHook(useNativeAppActivity);
  await flushState();
  act(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(result.current).toBe(false);
  act(() => {
    sendState({ isActive: false });
    Object.defineProperty(document, "visibilityState", { value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(result.current).toBe(false);
  act(() => sendState({ isActive: true }));
  expect(result.current).toBe(true);
});

it("preserves browser behavior without registering native listeners", () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  Object.defineProperty(document, "visibilityState", { value: "hidden" });
  const { result } = renderHook(useNativeAppActivity);
  expect(result.current).toBe(true);
  expect(App.addListener).not.toHaveBeenCalled();
  expect(App.getState).not.toHaveBeenCalled();
});
