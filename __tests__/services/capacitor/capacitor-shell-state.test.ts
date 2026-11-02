type Store = typeof import("@/services/capacitor/capacitor-shell-state");
type StateCallback = (state: { isActive: boolean }) => void;

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

const flushPromises = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe("capacitor shell state", () => {
  let store: Store;
  let App: { getState: jest.Mock; addListener: jest.Mock };
  let Capacitor: { isNativePlatform: jest.Mock };
  let stateCallback: StateCallback | undefined;
  let removeHandle: jest.Mock;

  beforeEach(() => {
    // The stores keep module-level state, so every test loads a fresh copy.
    jest.resetModules();
    store = require("@/services/capacitor/capacitor-shell-state");
    ({ App } = require("@capacitor/app"));
    ({ Capacitor } = require("@capacitor/core"));
    stateCallback = undefined;
    removeHandle = jest.fn();
    Capacitor.isNativePlatform.mockReturnValue(true);
    App.getState.mockResolvedValue({ isActive: true });
    App.addListener.mockImplementation(
      (_event: string, callback: StateCallback) => {
        stateCallback = callback;
        return Promise.resolve({ remove: removeHandle });
      }
    );
  });

  describe("app state", () => {
    it("shares one native read and listener, notifying every subscriber", async () => {
      const subscribers = Array.from({ length: 10 }, () => jest.fn());
      const unsubscribers = subscribers.map((subscriber) =>
        store.subscribeCapacitorAppState(subscriber)
      );
      await flushPromises();

      expect(App.getState).toHaveBeenCalledTimes(1);
      expect(App.addListener).toHaveBeenCalledTimes(1);
      expect(store.getCapacitorAppActive()).toBe(true);
      for (const subscriber of subscribers) {
        expect(subscriber).toHaveBeenCalledTimes(1);
      }

      stateCallback?.({ isActive: false });
      expect(store.getCapacitorAppActive()).toBe(false);
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
      App.getState.mockReturnValue(
        new Promise((resolve) => {
          resolveState = resolve;
        })
      );
      const unsubscribe = store.subscribeCapacitorAppState(jest.fn());
      await flushPromises();

      stateCallback?.({ isActive: true });
      resolveState?.({ isActive: false });
      await flushPromises();

      expect(store.getCapacitorAppActive()).toBe(true);
      unsubscribe();
    });

    it("keeps the session when a subscriber replaces the last one in the same tick", async () => {
      const onChange = jest.fn();
      const unsubscribe = store.subscribeCapacitorAppState(jest.fn());
      await flushPromises();
      expect(store.getCapacitorAppActive()).toBe(true);

      // React runs a commit's unsubscribes before its subscribes.
      unsubscribe();
      const unsubscribeReplacement = store.subscribeCapacitorAppState(onChange);
      expect(store.getCapacitorAppActive()).toBe(true);
      await flushPromises();

      expect(store.getCapacitorAppActive()).toBe(true);
      expect(App.getState).toHaveBeenCalledTimes(1);
      expect(App.addListener).toHaveBeenCalledTimes(1);
      expect(removeHandle).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();

      // The surviving session still delivers events to the replacement.
      stateCallback?.({ isActive: false });
      expect(onChange).toHaveBeenCalledTimes(1);
      unsubscribeReplacement();
    });

    it("keeps the last known state after teardown and refreshes it on the next session", async () => {
      const unsubscribe = store.subscribeCapacitorAppState(jest.fn());
      await flushPromises();
      unsubscribe();
      await flushPromises();
      expect(removeHandle).toHaveBeenCalledTimes(1);
      expect(store.getCapacitorAppActive()).toBe(true);

      App.getState.mockResolvedValue({ isActive: false });
      const onChange = jest.fn();
      const unsubscribeAgain = store.subscribeCapacitorAppState(onChange);
      expect(store.getCapacitorAppActive()).toBe(true);
      await flushPromises();

      expect(App.getState).toHaveBeenCalledTimes(2);
      expect(App.addListener).toHaveBeenCalledTimes(2);
      expect(store.getCapacitorAppActive()).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(1);
      unsubscribeAgain();
    });

    it("removes a listener that finishes registering after the last subscriber left", async () => {
      let resolveListener:
        | ((handle: { remove: jest.Mock }) => void)
        | undefined;
      App.addListener.mockReturnValue(
        new Promise((resolve) => {
          resolveListener = resolve;
        })
      );
      const unsubscribe = store.subscribeCapacitorAppState(jest.fn());
      unsubscribe();
      await flushPromises();

      resolveListener?.({ remove: removeHandle });
      await flushPromises();

      expect(removeHandle).toHaveBeenCalledTimes(1);
    });

    it("ignores events and a late initial read after teardown", async () => {
      let resolveState: ((state: { isActive: boolean }) => void) | undefined;
      App.getState.mockReturnValue(
        new Promise((resolve) => {
          resolveState = resolve;
        })
      );
      const onChange = jest.fn();
      store.subscribeCapacitorAppState(onChange)();
      await flushPromises();

      stateCallback?.({ isActive: true });
      resolveState?.({ isActive: true });
      await flushPromises();

      expect(store.getCapacitorAppActive()).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("logs and stays inactive when the initial read fails", async () => {
      const failure = new Error("unavailable");
      App.getState.mockRejectedValue(failure);
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      const unsubscribe = store.subscribeCapacitorAppState(jest.fn());
      await flushPromises();

      expect(store.getCapacitorAppActive()).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(
        "Capacitor app state error:",
        failure
      );
      unsubscribe();
      consoleError.mockRestore();
    });

    it("never touches the native plugin outside a native platform", async () => {
      Capacitor.isNativePlatform.mockReturnValue(false);

      const unsubscribe = store.subscribeCapacitorAppState(jest.fn());
      await flushPromises();
      unsubscribe();

      expect(App.getState).not.toHaveBeenCalled();
      expect(App.addListener).not.toHaveBeenCalled();
      expect(store.getCapacitorAppActive()).toBe(false);
    });
  });

  describe("orientation", () => {
    let matches: boolean;
    let matchMedia: jest.Mock;

    const orientationCalls = (spy: jest.SpyInstance) =>
      spy.mock.calls.filter(([type]) => type === "orientationchange");

    beforeEach(() => {
      matches = true;
      matchMedia = jest.fn(() => ({ matches }));
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: matchMedia,
      });
    });

    it("shares one orientationchange listener across subscribers", async () => {
      const addSpy = jest.spyOn(window, "addEventListener");
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const subscribers = Array.from({ length: 10 }, () => jest.fn());
      const unsubscribers = subscribers.map((subscriber) =>
        store.subscribeCapacitorOrientation(subscriber)
      );

      expect(orientationCalls(addSpy)).toHaveLength(1);
      expect(store.getCapacitorIsPortrait()).toBe(true);

      matches = false;
      window.dispatchEvent(new Event("orientationchange"));
      expect(store.getCapacitorIsPortrait()).toBe(false);
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
      await flushPromises();
      expect(orientationCalls(removeSpy)).toHaveLength(0);
      unsubscribers.at(-1)?.();
      await flushPromises();
      expect(orientationCalls(removeSpy)).toHaveLength(1);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("keeps its listener when a subscriber replaces the last one in the same tick", async () => {
      const addSpy = jest.spyOn(window, "addEventListener");
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const unsubscribe = store.subscribeCapacitorOrientation(jest.fn());
      const onChange = jest.fn();

      unsubscribe();
      const unsubscribeReplacement =
        store.subscribeCapacitorOrientation(onChange);
      await flushPromises();

      expect(orientationCalls(addSpy)).toHaveLength(1);
      expect(orientationCalls(removeSpy)).toHaveLength(0);
      matches = false;
      window.dispatchEvent(new Event("orientationchange"));
      expect(onChange).toHaveBeenCalledTimes(1);

      unsubscribeReplacement();
      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("answers reads made before the first subscription with one lookup", () => {
      for (let read = 0; read < 25; read += 1) {
        expect(store.getCapacitorIsPortrait()).toBe(true);
      }

      expect(matchMedia).toHaveBeenCalledTimes(1);
    });

    it("returns a stable snapshot across a microtask boundary until the subscription refreshes it", async () => {
      expect(store.getCapacitorIsPortrait()).toBe(true);

      // The orientation changes between the render read and the commit re-read.
      matches = false;
      await Promise.resolve();
      expect(store.getCapacitorIsPortrait()).toBe(true);
      await flushPromises();
      expect(store.getCapacitorIsPortrait()).toBe(true);
      expect(matchMedia).toHaveBeenCalledTimes(1);

      // Subscribing refreshes it; React re-checks the snapshot right after.
      const onChange = jest.fn();
      const unsubscribe = store.subscribeCapacitorOrientation(onChange);
      expect(store.getCapacitorIsPortrait()).toBe(false);
      expect(store.getCapacitorIsPortrait()).toBe(false);

      unsubscribe();
    });

    it("keeps its snapshot until orientationchange notifies subscribers", async () => {
      const onChange = jest.fn();
      const unsubscribe = store.subscribeCapacitorOrientation(onChange);
      expect(store.getCapacitorIsPortrait()).toBe(true);

      matches = false;
      await Promise.resolve();
      await flushPromises();
      expect(store.getCapacitorIsPortrait()).toBe(true);
      expect(onChange).not.toHaveBeenCalled();

      window.dispatchEvent(new Event("orientationchange"));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(store.getCapacitorIsPortrait()).toBe(false);

      unsubscribe();
    });

    it("reads the orientation afresh once the last subscriber has gone", async () => {
      const unsubscribe = store.subscribeCapacitorOrientation(jest.fn());
      expect(store.getCapacitorIsPortrait()).toBe(true);
      unsubscribe();
      await flushPromises();

      matches = false;

      expect(store.getCapacitorIsPortrait()).toBe(false);
      expect(store.getCapacitorIsPortrait()).toBe(false);
    });

    it("stops looking up the orientation once subscribed", () => {
      const unsubscribe = store.subscribeCapacitorOrientation(jest.fn());
      const lookupsAfterSubscribe = matchMedia.mock.calls.length;

      for (let read = 0; read < 25; read += 1) {
        expect(store.getCapacitorIsPortrait()).toBe(true);
      }

      expect(matchMedia).toHaveBeenCalledTimes(lookupsAfterSubscribe);
      unsubscribe();
    });

    it("is always portrait and never listens outside a native platform", () => {
      Capacitor.isNativePlatform.mockReturnValue(false);
      matches = false;
      const addSpy = jest.spyOn(window, "addEventListener");

      const unsubscribe = store.subscribeCapacitorOrientation(jest.fn());

      expect(store.getCapacitorIsPortrait()).toBe(true);
      expect(matchMedia).not.toHaveBeenCalled();
      expect(orientationCalls(addSpy)).toHaveLength(0);
      unsubscribe();
      addSpy.mockRestore();
    });
  });
});
