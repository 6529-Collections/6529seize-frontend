import { act, renderHook, waitFor } from "@testing-library/react";
import {
  __resetNativeKeyboardForTests,
  useNativeKeyboard,
} from "@/hooks/useNativeKeyboard";

const mockAddListener = jest.fn();
const mockSetAccessoryBarVisible = jest.fn();
const mockIsPluginAvailable = jest.fn();
const mockIsNativePlatform = jest.fn();
const mockGetPlatform = jest.fn();

type KeyboardListener = (info?: { keyboardHeight?: number | null }) => void;
type DeferredHandle = {
  readonly promise: Promise<{ remove: jest.Mock }>;
  readonly resolve: (handle: { remove: jest.Mock }) => void;
};

const listeners: Partial<Record<string, KeyboardListener>> = {};

function createDeferredHandle(): DeferredHandle {
  let resolveDeferred: (handle: { remove: jest.Mock }) => void = () => {};
  const promise = new Promise<{ remove: jest.Mock }>((resolve) => {
    resolveDeferred = resolve;
  });

  return {
    promise,
    resolve: resolveDeferred,
  };
}

jest.mock("@capacitor/core", () => ({
  registerPlugin: jest.fn(),
  WebPlugin: class {},
  Capacitor: {
    getPlatform: () => mockGetPlatform(),
    isNativePlatform: () => mockIsNativePlatform(),
    isPluginAvailable: (name: string) => mockIsPluginAvailable(name),
  },
}));

jest.mock("@capacitor/keyboard", () => ({
  Keyboard: {
    addListener: (event: string, callback: KeyboardListener) =>
      mockAddListener(event, callback),
    setAccessoryBarVisible: (options: { isVisible: boolean }) =>
      mockSetAccessoryBarVisible(options),
  },
}));

describe("useNativeKeyboard", () => {
  const renderNativeKeyboardHook = async () => {
    const renderedHook = renderHook(() => useNativeKeyboard());

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledTimes(4);
    });

    return renderedHook;
  };

  beforeEach(() => {
    __resetNativeKeyboardForTests();
    jest.clearAllMocks();
    Object.keys(listeners).forEach((eventName) => {
      delete listeners[eventName];
    });

    mockGetPlatform.mockReturnValue("ios");
    mockIsNativePlatform.mockReturnValue(true);
    mockIsPluginAvailable.mockReturnValue(true);
    mockSetAccessoryBarVisible.mockResolvedValue(undefined);
    mockAddListener.mockImplementation(
      (event: string, callback: KeyboardListener) => {
        listeners[event] = callback;
        return Promise.resolve({ remove: jest.fn() });
      }
    );
  });

  afterEach(() => {
    __resetNativeKeyboardForTests();
  });

  it("initializes native iOS state and sets the accessory bar", async () => {
    const { result } = await renderNativeKeyboardHook();

    expect(result.current.isNative).toBe(true);
    expect(result.current.isIos).toBe(true);
    expect(result.current.isAndroid).toBe(false);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.phase).toBe("hidden");
    expect(mockSetAccessoryBarVisible).toHaveBeenCalledWith({
      isVisible: true,
    });
  });

  it("updates immediately on iOS keyboard will-show and reconciles on did-show", async () => {
    const { result } = await renderNativeKeyboardHook();

    act(() => {
      listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(320);
    expect(result.current.phase).toBe("showing");
    expect(
      document.documentElement.style.getPropertyValue(
        "--native-keyboard-inset-bottom"
      )
    ).toBe("320px");
    expect(document.documentElement.dataset["nativeKeyboardVisible"]).toBe(
      "true"
    );

    act(() => {
      listeners["keyboardDidShow"]?.({ keyboardHeight: 336 });
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(336);
    expect(result.current.phase).toBe("visible");
  });

  it("publishes only the keyboard inset not already removed by layout viewport resize", async () => {
    mockGetPlatform.mockReturnValue("android");
    const originalInnerHeight = globalThis.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 800,
    });
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
    window.cancelAnimationFrame = jest.fn();

    try {
      await renderNativeKeyboardHook();

      act(() => {
        listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
      });

      expect(
        document.documentElement.style.getPropertyValue(
          "--native-keyboard-inset-bottom"
        )
      ).toBe("320px");

      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: 600,
      });

      act(() => {
        globalThis.dispatchEvent(new Event("resize"));
      });

      expect(
        document.documentElement.style.getPropertyValue(
          "--native-keyboard-inset-bottom"
        )
      ).toBe("120px");
    } finally {
      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: originalInnerHeight,
      });
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  });

  describe("Android viewport and native event ordering", () => {
    const viewportProperties = [
      "innerHeight",
      "innerWidth",
      "visualViewport",
    ] as const;
    let originalDescriptors: PropertyDescriptorMap;
    let layoutHeight: number;
    let visualHeight: number;
    let visualTop: number;
    let viewportWidth: number;
    let viewport: EventTarget;
    let pendingFrame: FrameRequestCallback | null;
    let input: HTMLInputElement;

    const flushViewportResize = (layout: number, visual = layout, top = 0) => {
      act(() => {
        layoutHeight = layout;
        visualHeight = visual;
        visualTop = top;
        globalThis.dispatchEvent(new Event("resize"));
        viewport.dispatchEvent(new Event("resize"));
        const callback = pendingFrame;
        pendingFrame = null;
        callback?.(0);
      });
    };
    const readInset = () =>
      document.documentElement.style.getPropertyValue(
        "--native-keyboard-inset-bottom"
      );

    beforeEach(() => {
      mockGetPlatform.mockReturnValue("android");
      originalDescriptors = Object.getOwnPropertyDescriptors(globalThis);
      layoutHeight = 800;
      visualHeight = 800;
      visualTop = 0;
      viewportWidth = 400;
      pendingFrame = null;
      viewport = new EventTarget();
      Object.defineProperties(viewport, {
        height: { get: () => visualHeight },
        width: { get: () => viewportWidth },
        offsetTop: { get: () => visualTop },
      });
      Object.defineProperties(globalThis, {
        innerHeight: { configurable: true, get: () => layoutHeight },
        innerWidth: { configurable: true, get: () => viewportWidth },
        visualViewport: { configurable: true, value: viewport },
      });
      jest
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback) => {
          pendingFrame = callback;
          return 1;
        });
      jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
        pendingFrame = null;
      });
      input = document.createElement("input");
      document.body.appendChild(input);
    });

    afterEach(() => {
      __resetNativeKeyboardForTests();
      input.remove();
      jest.restoreAllMocks();
      for (const property of viewportProperties) {
        const descriptor = originalDescriptors[property];
        if (descriptor) Object.defineProperty(globalThis, property, descriptor);
        else Reflect.deleteProperty(globalThis, property);
      }
    });

    it.each(["resize-first", "native-first"])(
      "avoids a second keyboard gap with %s delivery",
      async (order) => {
        const { result } = await renderNativeKeyboardHook();
        act(() => input.focus());
        if (order === "native-first") {
          act(() => listeners["keyboardWillShow"]?.({ keyboardHeight: 320 }));
        }
        flushViewportResize(480);
        act(() => {
          listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
          listeners["keyboardDidShow"]?.({ keyboardHeight: 320 });
        });
        expect(result.current.isVisible).toBe(true);
        expect(readInset()).toBe("0px");
        flushViewportResize(480);
        expect(readInset()).toBe("0px");
        expect(result.current.keyboardHeight).toBe(320);
      }
    );

    it.each([
      { layout: 800, inset: "320px" },
      { layout: 600, inset: "120px" },
      { layout: 480, inset: "0px" },
    ])(
      "subtracts layout shrink once at layout height $layout",
      async ({ layout, inset }) => {
        const { result } = await renderNativeKeyboardHook();
        act(() => input.focus());
        flushViewportResize(layout, 480);
        expect(result.current.isVisible).toBe(true);
        expect(result.current.keyboardHeight).toBe(320);
        expect(readInset()).toBe(inset);
      }
    );

    it.each(["viewport-first", "native-first"])(
      "keeps a fully panned keyboard visible without adding another inset with %s delivery",
      async (order) => {
        const { result } = await renderNativeKeyboardHook();
        act(() => input.focus());
        if (order === "native-first") {
          act(() => listeners["keyboardWillShow"]?.({ keyboardHeight: 320 }));
        }
        flushViewportResize(800, 480, 320);
        expect(result.current.isVisible).toBe(true);
        expect(result.current.keyboardHeight).toBe(320);
        expect(readInset()).toBe("0px");
        act(() => listeners["keyboardDidShow"]?.({ keyboardHeight: 320 }));
        expect(readInset()).toBe("0px");
        act(() => {
          listeners["keyboardWillHide"]?.();
          listeners["keyboardDidHide"]?.();
        });
        flushViewportResize(800);
        expect(result.current.isVisible).toBe(false);
        expect(readInset()).toBe("0px");
      }
    );

    it("keeps the inset in the same frame as Android viewport panning", async () => {
      await renderNativeKeyboardHook();
      act(() => input.focus());
      flushViewportResize(800, 480);

      for (const top of [20, 100, 260, 320]) {
        act(() => {
          visualTop = top;
          viewport.dispatchEvent(new Event("scroll"));
        });
        // Android has already panned the rendered viewport. Waiting for another
        // animation frame leaves the previous inset applied on top of that pan.
        expect(readInset()).toBe(`${320 - top}px`);
      }
    });

    it.each([
      { layout: 800, top: 100, inset: "220px" },
      { layout: 600, top: 60, inset: "60px" },
    ])(
      "subtracts viewport panning and layout resize once at $layout/$top",
      async ({ layout, top, inset }) => {
        const { result } = await renderNativeKeyboardHook();
        act(() => input.focus());
        flushViewportResize(layout, 480, top);
        expect(result.current.keyboardHeight).toBe(320);
        expect(readInset()).toBe(inset);
        act(() => listeners["keyboardDidShow"]?.({ keyboardHeight: 320 }));
        expect(readInset()).toBe(inset);
      }
    );

    it("tracks keyboard height changes and repeated close/reopen without losing the baseline", async () => {
      const { result } = await renderNativeKeyboardHook();
      act(() => input.focus());
      for (const height of [320, 380, 280]) {
        flushViewportResize(800 - height);
        act(() => listeners["keyboardDidShow"]?.({ keyboardHeight: height }));
        expect(result.current.keyboardHeight).toBe(height);
        expect(readInset()).toBe("0px");
        act(() => {
          listeners["keyboardWillHide"]?.();
          listeners["keyboardDidHide"]?.();
        });
        flushViewportResize(800);
        expect(result.current.isVisible).toBe(false);
        expect(readInset()).toBe("0px");
      }
    });

    it("resets rotation geometry without treating a focused field as an open keyboard", async () => {
      const { result } = await renderNativeKeyboardHook();
      act(() => input.focus());
      viewportWidth = 800;
      flushViewportResize(400);
      expect(result.current.isVisible).toBe(false);
      viewportWidth = 400;
      flushViewportResize(800);
      flushViewportResize(480);
      act(() => listeners["keyboardDidShow"]?.({ keyboardHeight: 320 }));
      expect(result.current.isVisible).toBe(true);
      expect(readInset()).toBe("0px");
    });
  });

  it("keeps native iOS geometry authoritative through the hide lifecycle", async () => {
    const originalInnerHeight = globalThis.innerHeight;
    const originalVisualViewport = globalThis.visualViewport;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    let visualViewportHeight = 800;
    const visualViewport = new EventTarget();
    Object.defineProperties(visualViewport, {
      height: { get: () => visualViewportHeight },
      offsetTop: { value: 0 },
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
    window.cancelAnimationFrame = jest.fn();

    try {
      const { result } = await renderNativeKeyboardHook();

      act(() => {
        listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
      });

      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: 600,
      });

      act(() => {
        globalThis.dispatchEvent(new Event("resize"));
      });

      expect(result.current.phase).toBe("showing");
      expect(
        document.documentElement.style.getPropertyValue(
          "--native-keyboard-inset-bottom"
        )
      ).toBe("320px");

      act(() => {
        listeners["keyboardDidShow"]?.({ keyboardHeight: 336 });
      });

      visualViewportHeight = 620;

      act(() => {
        visualViewport.dispatchEvent(new Event("resize"));
      });

      expect(result.current.phase).toBe("visible");
      expect(result.current.keyboardHeight).toBe(336);
      expect(
        document.documentElement.style.getPropertyValue(
          "--native-keyboard-inset-bottom"
        )
      ).toBe("336px");

      act(() => {
        listeners["keyboardWillHide"]?.();
      });

      visualViewportHeight = 500;

      act(() => {
        visualViewport.dispatchEvent(new Event("resize"));
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.phase).toBe("hiding");
      expect(result.current.keyboardHeight).toBe(0);
      expect(
        document.documentElement.style.getPropertyValue(
          "--native-keyboard-inset-bottom"
        )
      ).toBe("0px");
    } finally {
      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: originalInnerHeight,
      });
      Object.defineProperty(globalThis, "visualViewport", {
        configurable: true,
        value: originalVisualViewport,
      });
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  });

  it("does not mistake portrait-to-landscape rotation for a keyboard", async () => {
    const originalInnerHeight = globalThis.innerHeight;
    const originalInnerWidth = globalThis.innerWidth;
    const originalVisualViewport = globalThis.visualViewport;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    let visualViewportHeight = 900;
    let visualViewportWidth = 420;
    const visualViewport = new EventTarget();
    Object.defineProperties(visualViewport, {
      height: { get: () => visualViewportHeight },
      offsetTop: { value: 0 },
      width: { get: () => visualViewportWidth },
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      value: 420,
    });
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
    window.cancelAnimationFrame = jest.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    try {
      const { result } = await renderNativeKeyboardHook();

      visualViewportHeight = 420;
      visualViewportWidth = 900;
      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: 420,
      });
      Object.defineProperty(globalThis, "innerWidth", {
        configurable: true,
        value: 900,
      });

      act(() => {
        globalThis.dispatchEvent(new Event("orientationchange"));
        visualViewport.dispatchEvent(new Event("resize"));
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.phase).toBe("hidden");
      expect(document.documentElement.dataset["nativeKeyboardVisible"]).toBe(
        undefined
      );
    } finally {
      input.remove();
      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: originalInnerHeight,
      });
      Object.defineProperty(globalThis, "innerWidth", {
        configurable: true,
        value: originalInnerWidth,
      });
      Object.defineProperty(globalThis, "visualViewport", {
        configurable: true,
        value: originalVisualViewport,
      });
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  });

  it("keeps viewport keyboard fallback for a focused field", async () => {
    const originalInnerHeight = globalThis.innerHeight;
    const originalInnerWidth = globalThis.innerWidth;
    const originalVisualViewport = globalThis.visualViewport;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    let visualViewportHeight = 900;
    let visualViewportWidth = 420;
    const visualViewport = new EventTarget();
    Object.defineProperties(visualViewport, {
      height: { get: () => visualViewportHeight },
      offsetTop: { value: 0 },
      width: { get: () => visualViewportWidth },
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      value: 420,
    });
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
    window.cancelAnimationFrame = jest.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    try {
      const { result } = await renderNativeKeyboardHook();
      visualViewportHeight = 620;
      visualViewportWidth = 450;

      act(() => {
        visualViewport.dispatchEvent(new Event("resize"));
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.keyboardHeight).toBe(280);
      expect(result.current.phase).toBe("showing");
      expect(document.documentElement.dataset["nativeKeyboardVisible"]).toBe(
        "true"
      );
    } finally {
      input.remove();
      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: originalInnerHeight,
      });
      Object.defineProperty(globalThis, "innerWidth", {
        configurable: true,
        value: originalInnerWidth,
      });
      Object.defineProperty(globalThis, "visualViewport", {
        configurable: true,
        value: originalVisualViewport,
      });
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  });

  it("publishes the complete closed layout on will-hide", async () => {
    const { result } = await renderNativeKeyboardHook();

    act(() => {
      listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
    });

    expect(result.current.isVisible).toBe(true);
    expect(
      document.documentElement.style.getPropertyValue(
        "--native-keyboard-layout-transition-easing"
      )
    ).toBe("cubic-bezier(0.1, 0.8, 0.2, 1)");

    act(() => {
      listeners["keyboardWillHide"]?.();
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
    expect(result.current.phase).toBe("hiding");
    expect(
      document.documentElement.style.getPropertyValue(
        "--native-keyboard-inset-bottom"
      )
    ).toBe("0px");
    expect(document.documentElement.dataset["nativeKeyboardVisible"]).toBe(
      undefined
    );

    act(() => {
      listeners["keyboardDidHide"]?.();
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
    expect(result.current.phase).toBe("hidden");
    expect(document.documentElement.dataset["nativeKeyboardVisible"]).toBe(
      undefined
    );
  });

  it("disables keyboard layout transitions for reduced motion", async () => {
    const originalMatchMedia = globalThis.matchMedia;
    Object.defineProperty(globalThis, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: true }),
    });

    try {
      await renderNativeKeyboardHook();

      act(() => {
        listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
      });

      expect(
        document.documentElement.style.getPropertyValue(
          "--native-keyboard-layout-transition-duration"
        )
      ).toBe("0ms");

      act(() => {
        listeners["keyboardWillHide"]?.();
      });

      expect(
        document.documentElement.style.getPropertyValue(
          "--native-keyboard-layout-transition-duration"
        )
      ).toBe("0ms");
    } finally {
      Object.defineProperty(globalThis, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

  it.each([
    { platform: "android", duration: "0ms" },
    { platform: "ios", duration: "250ms" },
  ])(
    "uses $duration for $platform native keyboard events",
    async ({ platform, duration }) => {
      mockGetPlatform.mockReturnValue(platform);
      const originalMatchMedia = globalThis.matchMedia;
      Object.defineProperty(globalThis, "matchMedia", {
        configurable: true,
        value: jest.fn().mockReturnValue({ matches: false }),
      });
      try {
        await renderNativeKeyboardHook();
        for (const event of ["keyboardWillShow", "keyboardWillHide"]) {
          act(() => listeners[event]?.({ keyboardHeight: 320 }));
          expect(
            document.documentElement.style.getPropertyValue(
              "--native-keyboard-layout-transition-duration"
            )
          ).toBe(duration);
        }
      } finally {
        Object.defineProperty(globalThis, "matchMedia", {
          configurable: true,
          value: originalMatchMedia,
        });
      }
    }
  );

  it("finishes hiding from the focus fallback when did-hide is missing", async () => {
    const { result } = await renderNativeKeyboardHook();
    jest.useFakeTimers();

    try {
      act(() => {
        listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
        listeners["keyboardWillHide"]?.();
        document.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      });

      expect(result.current.phase).toBe("hiding");

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.phase).toBe("hidden");
    } finally {
      jest.useRealTimers();
    }
  });

  it("finishes hiding from the native fallback when later hide events are missing", async () => {
    const { result } = await renderNativeKeyboardHook();
    jest.useFakeTimers();

    try {
      act(() => {
        listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
        listeners["keyboardWillHide"]?.();
      });

      expect(result.current.phase).toBe("hiding");

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
      expect(result.current.phase).toBe("hidden");
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps a rapid reopen visible after a pending hide fallback", async () => {
    const { result } = await renderNativeKeyboardHook();
    jest.useFakeTimers();

    try {
      act(() => {
        listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
        listeners["keyboardWillHide"]?.();
        document.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        listeners["keyboardWillShow"]?.({ keyboardHeight: 300 });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.keyboardHeight).toBe(300);
      expect(result.current.phase).toBe("showing");
    } finally {
      jest.useRealTimers();
    }
  });

  it("supports Android without iOS accessory bar calls", async () => {
    mockGetPlatform.mockReturnValue("android");

    const { result } = await renderNativeKeyboardHook();

    expect(result.current.isIos).toBe(false);
    expect(result.current.isAndroid).toBe(true);
    expect(mockSetAccessoryBarVisible).not.toHaveBeenCalled();

    act(() => {
      listeners["keyboardWillShow"]?.({ keyboardHeight: 280 });
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(280);
    expect(result.current.phase).toBe("showing");
    expect(
      document.documentElement.style.getPropertyValue(
        "--native-keyboard-layout-transition-easing"
      )
    ).toBe("ease-out");
  });

  it("does not set up listeners outside native app mode", () => {
    mockGetPlatform.mockReturnValue("web");
    mockIsNativePlatform.mockReturnValue(false);

    const { result } = renderHook(() => useNativeKeyboard());

    expect(result.current.isNative).toBe(false);
    expect(result.current.isVisible).toBe(false);
    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it("does not set up listeners when the Keyboard plugin is unavailable", () => {
    mockIsPluginAvailable.mockReturnValue(false);

    renderHook(() => useNativeKeyboard());

    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it("shares one native listener set across multiple consumers", async () => {
    const firstHook = renderHook(() => useNativeKeyboard());
    const secondHook = renderHook(() => useNativeKeyboard());

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledTimes(4);
    });

    act(() => {
      listeners["keyboardWillShow"]?.({ keyboardHeight: 300 });
    });

    expect(firstHook.result.current.isVisible).toBe(true);
    expect(secondHook.result.current.isVisible).toBe(true);
  });

  it("removes listeners on unmount", async () => {
    const removeFns = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
    mockAddListener.mockImplementation(
      (event: string, callback: KeyboardListener) => {
        listeners[event] = callback;
        return Promise.resolve({
          remove: removeFns[mockAddListener.mock.calls.length - 1],
        });
      }
    );

    const { unmount } = await renderNativeKeyboardHook();

    unmount();

    await waitFor(() => {
      removeFns.forEach((remove) => expect(remove).toHaveBeenCalled());
    });
  });

  it("retries listener setup when a new subscriber arrives during teardown", async () => {
    const staleSetupHandles = [
      { remove: jest.fn() },
      { remove: jest.fn() },
      { remove: jest.fn() },
      { remove: jest.fn() },
    ];
    const pendingStaleHandles: DeferredHandle[] = [];

    mockAddListener.mockImplementation(
      (event: string, callback: KeyboardListener) => {
        listeners[event] = callback;

        if (pendingStaleHandles.length < staleSetupHandles.length) {
          const deferredHandle = createDeferredHandle();
          pendingStaleHandles.push(deferredHandle);
          return deferredHandle.promise;
        }

        return Promise.resolve({ remove: jest.fn() });
      }
    );

    const firstHook = renderHook(() => useNativeKeyboard());

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledTimes(4);
    });

    firstHook.unmount();
    renderHook(() => useNativeKeyboard());

    staleSetupHandles.forEach((handle, index) => {
      pendingStaleHandles[index]?.resolve(handle);
    });

    await waitFor(() => {
      staleSetupHandles.forEach((handle) =>
        expect(handle.remove).toHaveBeenCalled()
      );
    });

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledTimes(8);
    });
  });
});
