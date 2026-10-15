import {
  getCapacitorAppActive,
  getCapacitorIsPortrait,
  subscribeCapacitorAppState,
  subscribeCapacitorOrientation,
} from "@/services/capacitor/capacitor-shell-state";

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
    addListener: jest.fn(),
  },
}));

const { Capacitor } = require("@capacitor/core");
const { App } = require("@capacitor/app");

type StateCallback = (state: { isActive: boolean }) => void;

const flushPromises = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe("capacitor shell state", () => {
  let stateCallback: StateCallback | undefined;
  let removeHandle: jest.Mock;

  beforeEach(() => {
    stateCallback = undefined;
    removeHandle = jest.fn();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (App.getState as jest.Mock).mockReset().mockResolvedValue({
      isActive: true,
    });
    (App.addListener as jest.Mock)
      .mockReset()
      .mockImplementation((_event: string, callback: StateCallback) => {
        stateCallback = callback;
        return Promise.resolve({ remove: removeHandle });
      });
  });

  describe("app state", () => {
    it("shares one native read and listener, notifying every subscriber", async () => {
      const subscribers = Array.from({ length: 10 }, () => jest.fn());
      const unsubscribers = subscribers.map(subscribeCapacitorAppState);
      await flushPromises();

      expect(App.getState).toHaveBeenCalledTimes(1);
      expect(App.addListener).toHaveBeenCalledTimes(1);
      expect(getCapacitorAppActive()).toBe(true);
      for (const subscriber of subscribers) {
        expect(subscriber).toHaveBeenCalledTimes(1);
      }

      stateCallback?.({ isActive: false });
      expect(getCapacitorAppActive()).toBe(false);
      for (const subscriber of subscribers) {
        expect(subscriber).toHaveBeenCalledTimes(2);
      }

      for (const unsubscribe of unsubscribers.slice(0, -1)) {
        unsubscribe();
      }
      await flushPromises();
      expect(removeHandle).not.toHaveBeenCalled();

      unsubscribers.at(-1)?.();
      await flushPromises();
      expect(removeHandle).toHaveBeenCalledTimes(1);
    });

    it("lets a newer lifecycle event win over a slower initial read", async () => {
      let resolveState: ((state: { isActive: boolean }) => void) | undefined;
      (App.getState as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveState = resolve;
        })
      );
      const unsubscribe = subscribeCapacitorAppState(jest.fn());
      await flushPromises();

      stateCallback?.({ isActive: true });
      resolveState?.({ isActive: false });
      await flushPromises();

      expect(getCapacitorAppActive()).toBe(true);
      unsubscribe();
    });

    it("resets to inactive when the last subscriber leaves", async () => {
      const unsubscribe = subscribeCapacitorAppState(jest.fn());
      await flushPromises();
      expect(getCapacitorAppActive()).toBe(true);

      unsubscribe();
      expect(getCapacitorAppActive()).toBe(false);
    });

    it("removes a listener that finishes registering after the last subscriber left", async () => {
      let resolveListener:
        | ((handle: { remove: jest.Mock }) => void)
        | undefined;
      (App.addListener as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveListener = resolve;
        })
      );
      const unsubscribe = subscribeCapacitorAppState(jest.fn());
      unsubscribe();

      resolveListener?.({ remove: removeHandle });
      await flushPromises();

      expect(removeHandle).toHaveBeenCalledTimes(1);
    });

    it("ignores events and a late initial read after teardown", async () => {
      let resolveState: ((state: { isActive: boolean }) => void) | undefined;
      (App.getState as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveState = resolve;
        })
      );
      const onChange = jest.fn();
      subscribeCapacitorAppState(onChange)();
      await flushPromises();

      stateCallback?.({ isActive: true });
      resolveState?.({ isActive: true });
      await flushPromises();

      expect(getCapacitorAppActive()).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("logs and stays inactive when the initial read fails", async () => {
      const failure = new Error("unavailable");
      (App.getState as jest.Mock).mockRejectedValue(failure);
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const unsubscribe = subscribeCapacitorAppState(jest.fn());
      await flushPromises();

      expect(getCapacitorAppActive()).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(
        "Capacitor app state error:",
        failure
      );
      unsubscribe();
      consoleError.mockRestore();
    });

    it("never touches the native plugin outside a native platform", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const unsubscribe = subscribeCapacitorAppState(jest.fn());
      await flushPromises();
      unsubscribe();

      expect(App.getState).not.toHaveBeenCalled();
      expect(App.addListener).not.toHaveBeenCalled();
      expect(getCapacitorAppActive()).toBe(false);
    });
  });

  describe("orientation", () => {
    let matches: boolean;

    beforeEach(() => {
      matches = true;
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: jest.fn(() => ({ matches })),
      });
    });

    it("shares one orientationchange listener across subscribers", () => {
      const addSpy = jest.spyOn(window, "addEventListener");
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const subscribers = Array.from({ length: 10 }, () => jest.fn());
      const unsubscribers = subscribers.map(subscribeCapacitorOrientation);
      const orientationCalls = (spy: jest.SpyInstance) =>
        spy.mock.calls.filter(([type]) => type === "orientationchange");

      expect(orientationCalls(addSpy)).toHaveLength(1);
      expect(getCapacitorIsPortrait()).toBe(true);

      matches = false;
      window.dispatchEvent(new Event("orientationchange"));
      expect(getCapacitorIsPortrait()).toBe(false);
      for (const subscriber of subscribers) {
        expect(subscriber).toHaveBeenCalledTimes(1);
      }

      // An unchanged orientation does not notify anyone.
      window.dispatchEvent(new Event("orientationchange"));
      for (const subscriber of subscribers) {
        expect(subscriber).toHaveBeenCalledTimes(1);
      }

      for (const unsubscribe of unsubscribers.slice(0, -1)) {
        unsubscribe();
      }
      expect(orientationCalls(removeSpy)).toHaveLength(0);
      unsubscribers.at(-1)?.();
      expect(orientationCalls(removeSpy)).toHaveLength(1);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("reads the live orientation while nobody is subscribed", () => {
      expect(getCapacitorIsPortrait()).toBe(true);
      matches = false;
      expect(getCapacitorIsPortrait()).toBe(false);
    });

    it("is always portrait and never listens outside a native platform", () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      matches = false;
      const addSpy = jest.spyOn(window, "addEventListener");

      const unsubscribe = subscribeCapacitorOrientation(jest.fn());

      expect(getCapacitorIsPortrait()).toBe(true);
      expect(
        addSpy.mock.calls.filter(([type]) => type === "orientationchange")
      ).toHaveLength(0);
      unsubscribe();
      addSpy.mockRestore();
    });
  });
});
