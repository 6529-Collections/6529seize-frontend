/**
 * Behavioral fine-pointer latch tests. Each case loads a fresh module via
 * jest.isolateModules so the module-level latch cannot leak between tests.
 *
 * jsdom cannot dispatch trusted events (isTrusted is spec-unforgeable), so
 * the sentinel handler is captured through an addEventListener spy and
 * invoked directly with duck-typed pointer events — exercising the real
 * handler, latch, notification, and <body> tagging paths.
 */

type Helpers = typeof import("@/helpers/touch-first.helpers");

type SentinelHandler = (event: {
  readonly isTrusted: boolean;
  readonly pointerType: string;
}) => void;

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

function loadHelpersWithSentinel(): {
  helpers: Helpers;
  getSentinel: () => SentinelHandler | undefined;
  restore: () => void;
} {
  const addSpy = jest.spyOn(globalThis, "addEventListener");

  let helpers: Helpers | undefined;
  jest.isolateModules(() => {
    helpers = require("@/helpers/touch-first.helpers") as Helpers;
  });
  if (!helpers) {
    throw new Error("failed to load touch-first helpers");
  }

  const getSentinel = () =>
    addSpy.mock.calls.find(([type]) => type === "pointermove")?.[1] as
      | SentinelHandler
      | undefined;

  return { helpers, getSentinel, restore: () => addSpy.mockRestore() };
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

  it("flips to desktop after a stream of trusted mouse moves", () => {
    const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
    const onChange = jest.fn();
    const unsubscribe = helpers.subscribeToTouchFirstChanges(onChange);
    const sentinel = getSentinel();
    expect(sentinel).toBeDefined();

    expect(helpers.isTouchFirstEnvironment()).toBe(true);
    expect(helpers.hasHoverCapability()).toBe(false);

    sentinel!({ isTrusted: true, pointerType: "mouse" });
    sentinel!({ isTrusted: true, pointerType: "mouse" });
    expect(helpers.isTouchFirstEnvironment()).toBe(true);

    sentinel!({ isTrusted: true, pointerType: "mouse" });

    expect(helpers.isTouchFirstEnvironment()).toBe(false);
    expect(helpers.hasFinePointerCapability()).toBe(true);
    expect(helpers.hasHoverCapability()).toBe(true);
    expect(onChange).toHaveBeenCalled();
    expect(document.body.getAttribute("data-fine-pointer")).toBe("true");

    unsubscribe();
    restore();
  });

  it("ignores untrusted and touch pointer events", () => {
    const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
    const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
    const sentinel = getSentinel();
    expect(sentinel).toBeDefined();

    for (let i = 0; i < 5; i++) {
      sentinel!({ isTrusted: false, pointerType: "mouse" });
      sentinel!({ isTrusted: true, pointerType: "touch" });
      sentinel!({ isTrusted: true, pointerType: "pen" });
    }

    expect(helpers.isTouchFirstEnvironment()).toBe(true);
    expect(document.body.hasAttribute("data-fine-pointer")).toBe(false);

    unsubscribe();
    restore();
  });

  it("keeps phones touch-first even after trusted mouse evidence", () => {
    Object.defineProperty(globalThis.navigator, "userAgentData", {
      configurable: true,
      value: { mobile: true },
    });

    try {
      const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
      const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
      const sentinel = getSentinel();

      sentinel!({ isTrusted: true, pointerType: "mouse" });
      sentinel!({ isTrusted: true, pointerType: "mouse" });
      sentinel!({ isTrusted: true, pointerType: "mouse" });

      expect(helpers.hasFinePointerCapability()).toBe(true);
      expect(helpers.isTouchFirstEnvironment()).toBe(true);

      unsubscribe();
      restore();
    } finally {
      Reflect.deleteProperty(globalThis.navigator, "userAgentData");
    }
  });

  it("uninstalls the sentinel when the last subscriber leaves", () => {
    const removeSpy = jest.spyOn(globalThis, "removeEventListener");
    const { helpers, getSentinel, restore } = loadHelpersWithSentinel();

    const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
    const sentinel = getSentinel();
    expect(sentinel).toBeDefined();

    unsubscribe();

    const sentinelRemoved = removeSpy.mock.calls.some(
      ([type, handler]) => type === "pointermove" && handler === sentinel
    );
    expect(sentinelRemoved).toBe(true);

    restore();
    removeSpy.mockRestore();
  });
});
