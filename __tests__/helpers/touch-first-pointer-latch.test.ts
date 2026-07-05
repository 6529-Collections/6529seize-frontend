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
  readonly sourceCapabilities?: { readonly firesTouchEvents?: boolean };
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

  const getSentinel = (eventType: "pointermove" | "pointerdown" = "pointermove") =>
    addSpy.mock.calls.find(([type]) => type === eventType)?.[1] as
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
    localStorage.removeItem("6529-fine-pointer");
  });

  it("hydrates the latch from a previous session at module load", () => {
    localStorage.setItem("6529-fine-pointer", "1");

    const { helpers, restore } = loadHelpersWithSentinel();

    // Desktop from the very first read — no events required, no flicker.
    expect(helpers.hasFinePointerCapability()).toBe(true);
    expect(helpers.hasHoverCapability()).toBe(true);
    expect(helpers.isTouchFirstEnvironment()).toBe(false);
    expect(document.body.getAttribute("data-fine-pointer")).toBe("true");

    restore();
  });

  it("ignores a stored latch on mobile user agents (synced/inherited flags)", () => {
    localStorage.setItem("6529-fine-pointer", "1");
    Object.defineProperty(globalThis.navigator, "userAgentData", {
      configurable: true,
      value: { mobile: true },
    });

    try {
      const { helpers, restore } = loadHelpersWithSentinel();

      expect(helpers.isTouchFirstEnvironment()).toBe(true);
      expect(helpers.hasFinePointerCapability()).toBe(false);
      expect(helpers.hasHoverCapability()).toBe(false);
      expect(document.body.hasAttribute("data-fine-pointer")).toBe(false);

      restore();
    } finally {
      Reflect.deleteProperty(globalThis.navigator, "userAgentData");
    }
  });

  it("persists the latch for future sessions", () => {
    const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
    const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
    const sentinel = getSentinel();

    sentinel!({ isTrusted: true, pointerType: "mouse" });
    sentinel!({ isTrusted: true, pointerType: "mouse" });
    sentinel!({ isTrusted: true, pointerType: "mouse" });

    expect(localStorage.getItem("6529-fine-pointer")).toBe("1");

    unsubscribe();
    restore();
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

  it("never latches on mouse events synthesized from touch (firesTouchEvents)", () => {
    const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
    const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
    const sentinel = getSentinel();
    expect(sentinel).toBeDefined();

    // Windows 8-era compatibility mouse events: trusted, pointerType "mouse",
    // but flagged as originating from a touch input device.
    for (let i = 0; i < 6; i++) {
      sentinel!({
        isTrusted: true,
        pointerType: "mouse",
        sourceCapabilities: { firesTouchEvents: true },
      });
    }

    expect(helpers.isTouchFirstEnvironment()).toBe(true);
    expect(document.body.hasAttribute("data-fine-pointer")).toBe(false);

    unsubscribe();
    restore();
  });

  it("suppresses mouse evidence arriving right after trusted touch input", () => {
    const nowSpy = jest.spyOn(Date, "now");
    try {
      const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
      const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
      const sentinel = getSentinel();
      expect(sentinel).toBeDefined();

      // A tap, then OS-synthesized mouse moves a few ms later — the classic
      // legacy Windows touch emulation sequence. Repeated taps must never
      // accumulate into a latch.
      let clock = 100_000;
      for (let tap = 0; tap < 4; tap++) {
        nowSpy.mockReturnValue(clock);
        sentinel!({ isTrusted: true, pointerType: "touch" });
        for (let i = 0; i < 3; i++) {
          clock += 50;
          nowSpy.mockReturnValue(clock);
          sentinel!({ isTrusted: true, pointerType: "mouse" });
        }
        clock += 5_000; // user pauses between taps
      }

      expect(helpers.isTouchFirstEnvironment()).toBe(true);
      expect(document.body.hasAttribute("data-fine-pointer")).toBe(false);

      // A genuine cursor glide well clear of any touch still latches.
      for (let i = 0; i < 3; i++) {
        clock += 100;
        nowSpy.mockReturnValue(clock);
        sentinel!({ isTrusted: true, pointerType: "mouse" });
      }
      expect(helpers.isTouchFirstEnvironment()).toBe(false);
      expect(document.body.getAttribute("data-fine-pointer")).toBe("true");

      unsubscribe();
      restore();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("resets accumulated mouse evidence when touch input arrives", () => {
    const nowSpy = jest.spyOn(Date, "now");
    try {
      const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
      const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
      const sentinel = getSentinel();
      expect(sentinel).toBeDefined();

      let clock = 200_000;
      nowSpy.mockReturnValue(clock);

      // Two stray mouse moves (below threshold), then a touch: the counter
      // must reset rather than carry across the interaction.
      sentinel!({ isTrusted: true, pointerType: "mouse" });
      sentinel!({ isTrusted: true, pointerType: "mouse" });
      sentinel!({ isTrusted: true, pointerType: "touch" });

      // Two more mouse moves after the suppression window — still only two.
      clock += 10_000;
      nowSpy.mockReturnValue(clock);
      sentinel!({ isTrusted: true, pointerType: "mouse" });
      sentinel!({ isTrusted: true, pointerType: "mouse" });
      expect(helpers.isTouchFirstEnvironment()).toBe(true);

      // The third contiguous move completes a real glide and latches.
      sentinel!({ isTrusted: true, pointerType: "mouse" });
      expect(helpers.isTouchFirstEnvironment()).toBe(false);

      unsubscribe();
      restore();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("arms the suppression window from a plain tap (pointerdown, no move)", () => {
    const nowSpy = jest.spyOn(Date, "now");
    try {
      const { helpers, getSentinel, restore } = loadHelpersWithSentinel();
      const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
      const pointerDownSentinel = getSentinel("pointerdown");
      const pointerMoveSentinel = getSentinel("pointermove");
      expect(pointerDownSentinel).toBeDefined();
      expect(pointerMoveSentinel).toBeDefined();

      // A plain tap: touch pointerdown, NO touch pointermove — followed
      // milliseconds later by the OS's synthesized mouse moves. This is the
      // exact Win 8 sequence the pointerdown listener exists for.
      let clock = 300_000;
      nowSpy.mockReturnValue(clock);
      pointerDownSentinel!({ isTrusted: true, pointerType: "touch" });
      for (let i = 0; i < 3; i++) {
        clock += 40;
        nowSpy.mockReturnValue(clock);
        pointerMoveSentinel!({ isTrusted: true, pointerType: "mouse" });
      }

      expect(helpers.isTouchFirstEnvironment()).toBe(true);
      expect(document.body.hasAttribute("data-fine-pointer")).toBe(false);

      unsubscribe();
      restore();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("uninstalls the sentinel when the last subscriber leaves", () => {
    const removeSpy = jest.spyOn(globalThis, "removeEventListener");
    const { helpers, getSentinel, restore } = loadHelpersWithSentinel();

    const unsubscribe = helpers.subscribeToTouchFirstChanges(jest.fn());
    const sentinel = getSentinel();
    const pointerDownSentinel = getSentinel("pointerdown");
    expect(sentinel).toBeDefined();
    expect(pointerDownSentinel).toBeDefined();

    unsubscribe();

    const sentinelRemoved = removeSpy.mock.calls.some(
      ([type, handler]) => type === "pointermove" && handler === sentinel
    );
    expect(sentinelRemoved).toBe(true);
    const pointerDownRemoved = removeSpy.mock.calls.some(
      ([type, handler]) =>
        type === "pointerdown" && handler === pointerDownSentinel
    );
    expect(pointerDownRemoved).toBe(true);

    restore();
    removeSpy.mockRestore();
  });
});
