import { renderHook, act, waitFor } from "@testing-library/react";
import useCapacitor from "@/hooks/useCapacitor";

const listeners: Record<string, Function> = {};

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
      return Promise.resolve({ remove: jest.fn() });
    }),
    removeAllListeners: jest.fn(),
  },
}));

const { Capacitor } = require("@capacitor/core");
const { App } = require("@capacitor/app");

beforeEach(() => {
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

describe("useCapacitor", () => {
  it("provides platform info and reacts to events", async () => {
    const { result } = renderHook(() => useCapacitor());
    await waitFor(() => {
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
});
