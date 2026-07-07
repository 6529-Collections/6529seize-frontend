import { renderHook, act, waitFor } from "@testing-library/react";
import useCapacitor from "@/hooks/useCapacitor";
import { __resetNativeDeviceStoresForTests } from "@/hooks/nativeDeviceStore";

const listeners: Record<string, Function> = {};
const mockRemoveListener = jest.fn();

jest.mock("@capacitor/core", () => ({
  registerPlugin: jest.fn(),
  WebPlugin: class {},
  Capacitor: {
    isNativePlatform: jest.fn(),
    getPlatform: jest.fn(),
  },
}));

jest.mock("@capacitor/app", () => ({
  App: {
    getState: jest.fn(),
    addListener: jest.fn((event: string, cb: any) => {
      listeners[event] = cb;
      return Promise.resolve({ remove: mockRemoveListener });
    }),
    removeAllListeners: jest.fn(),
  },
}));

const { Capacitor } = require("@capacitor/core");
const { App } = require("@capacitor/app");

beforeEach(() => {
  __resetNativeDeviceStoresForTests();
  jest.clearAllMocks();
  listeners["appStateChange"] = () => {};
  (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
  (Capacitor.getPlatform as jest.Mock).mockReturnValue("ios");
  (App.getState as jest.Mock).mockResolvedValue({ isActive: false });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
});

afterEach(() => {
  __resetNativeDeviceStoresForTests();
});

describe("useCapacitor", () => {
  it("provides platform info and reacts to events", async () => {
    const { result } = renderHook(() => useCapacitor());
    await waitFor(() => {
      expect(App.addListener).toHaveBeenCalledTimes(1);
      expect(result.current.isIos).toBe(true);
      expect(result.current.isAndroid).toBe(false);
      expect(result.current.isActive).toBe(false);
    });

    act(() => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });
      window.dispatchEvent(new Event("orientationchange"));
    });
    expect(result.current.orientation).toBe(1); // LANDSCAPE

    act(() => {
      listeners["appStateChange"]({ isActive: true });
    });
    expect(result.current.isActive).toBe(true);
  });

  it("ignores repeated orientationchange events with the same orientation", async () => {
    const renderSpy = jest.fn();
    const { result } = renderHook(() => {
      renderSpy();
      return useCapacitor();
    });

    await waitFor(() => {
      expect(result.current.orientation).toBe(0); // PORTRAIT
    });

    const renderCountAfterInitialSync = renderSpy.mock.calls.length;

    act(() => {
      window.dispatchEvent(new Event("orientationchange"));
      window.dispatchEvent(new Event("orientationchange"));
    });

    expect(result.current.orientation).toBe(0); // PORTRAIT
    expect(renderSpy).toHaveBeenCalledTimes(renderCountAfterInitialSync);
  });

  it("shares native listeners across multiple hook callers", async () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => {
      const first = useCapacitor();
      const second = useCapacitor();

      return { first, second };
    });

    await waitFor(() => {
      expect(App.addListener).toHaveBeenCalledTimes(1);
    });

    expect(
      addEventListenerSpy.mock.calls.filter(
        ([event]) => event === "orientationchange"
      )
    ).toHaveLength(1);

    unmount();

    await waitFor(() => {
      expect(mockRemoveListener).toHaveBeenCalledTimes(1);
    });

    expect(
      removeEventListenerSpy.mock.calls.filter(
        ([event]) => event === "orientationchange"
      )
    ).toHaveLength(1);
  });
});
