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
    expect(document.documentElement.dataset.nativeKeyboardVisible).toBe("true");

    act(() => {
      listeners["keyboardDidShow"]?.({ keyboardHeight: 336 });
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(336);
    expect(result.current.phase).toBe("visible");
  });

  it("publishes only the keyboard inset not already removed by layout viewport resize", async () => {
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

  it("updates immediately on iOS keyboard will-hide and reconciles on did-hide", async () => {
    const { result } = await renderNativeKeyboardHook();

    act(() => {
      listeners["keyboardWillShow"]?.({ keyboardHeight: 320 });
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      listeners["keyboardWillHide"]?.();
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(0);
    expect(result.current.phase).toBe("hiding");
    expect(
      document.documentElement.style.getPropertyValue(
        "--native-keyboard-inset-bottom"
      )
    ).toBe("0px");
    expect(document.documentElement.dataset.nativeKeyboardVisible).toBe("true");

    act(() => {
      listeners["keyboardDidHide"]?.();
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
    expect(result.current.phase).toBe("hidden");
    expect(document.documentElement.dataset.nativeKeyboardVisible).toBe(
      undefined
    );
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

    pendingStaleHandles.forEach((deferredHandle, index) => {
      deferredHandle.resolve(staleSetupHandles[index]);
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
