/**
 * Behavioral fine-pointer latch tests. Kept in their own file so the
 * module-level latch state cannot leak into the main helper suite.
 */
import {
  hasFinePointerCapability,
  hasHoverCapability,
  isTouchFirstEnvironment,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";

function defineMatchMedia(queryMatches: Record<string, boolean>) {
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn((query: string) => ({
      matches: queryMatches[query] ?? false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

function defineMaxTouchPoints(value: number) {
  Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
    configurable: true,
    value,
  });
}

function dispatchPointerEvent(type: string, pointerType: string) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  globalThis.dispatchEvent(event);
}

describe("behavioral fine-pointer latch", () => {
  // A browser that mis-reports capabilities: touch points present, no fine
  // pointer, no hover — like a convertible whose media queries lie while the
  // trackpad is in use.
  beforeEach(() => {
    defineMaxTouchPoints(10);
    defineMatchMedia({ "(any-pointer: coarse)": true });
  });

  afterEach(() => {
    defineMaxTouchPoints(0);
    document.body.removeAttribute("data-fine-pointer");
  });

  it("treats the device as touch-first until mouse evidence arrives, then flips", () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToTouchFirstChanges(onChange);

    expect(isTouchFirstEnvironment()).toBe(true);
    expect(hasHoverCapability()).toBe(false);

    // Touch events must not latch.
    dispatchPointerEvent("pointermove", "touch");
    expect(isTouchFirstEnvironment()).toBe(true);

    // The first mouse/trackpad event is ground truth.
    dispatchPointerEvent("pointermove", "mouse");

    expect(isTouchFirstEnvironment()).toBe(false);
    expect(hasFinePointerCapability()).toBe(true);
    expect(hasHoverCapability()).toBe(true);
    expect(onChange).toHaveBeenCalled();
    expect(document.body.getAttribute("data-fine-pointer")).toBe("true");

    unsubscribe();
  });

  it("keeps phones touch-first even after mouse evidence (UA override wins)", () => {
    Object.defineProperty(globalThis.navigator, "userAgentData", {
      configurable: true,
      value: { mobile: true },
    });

    try {
      // Latch is already set by the previous test's module state or set it now.
      dispatchPointerEvent("pointerdown", "mouse");
      const unsubscribe = subscribeToTouchFirstChanges(jest.fn());
      dispatchPointerEvent("pointerdown", "mouse");

      expect(isTouchFirstEnvironment()).toBe(true);
      unsubscribe();
    } finally {
      Reflect.deleteProperty(globalThis.navigator, "userAgentData");
    }
  });
});
