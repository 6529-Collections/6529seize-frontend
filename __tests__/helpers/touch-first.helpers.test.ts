import {
  hasFinePointerCapability,
  hasHoverCapability,
  hasTouchCapability,
  isTouchFirstEnvironment,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";

type QueryMatches = Record<string, boolean>;

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener?: jest.Mock;
  removeEventListener?: jest.Mock;
  addListener?: jest.Mock;
  removeListener?: jest.Mock;
}

const createdMqls: MockMediaQueryList[] = [];

function defineMatchMedia(queryMatches: QueryMatches) {
  createdMqls.length = 0;
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn((query: string) => {
      const mql: MockMediaQueryList = {
        matches: queryMatches[query] ?? false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      createdMqls.push(mql);
      return mql;
    }),
  });
}

function defineMaxTouchPoints(value: number) {
  Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
    configurable: true,
    value,
  });
}

function defineUserAgent(value: string) {
  Object.defineProperty(globalThis.navigator, "userAgent", {
    configurable: true,
    value,
  });
}

function defineUserAgentData(mobile: boolean | undefined) {
  if (mobile === undefined) {
    Reflect.deleteProperty(globalThis.navigator, "userAgentData");
    return;
  }
  Object.defineProperty(globalThis.navigator, "userAgentData", {
    configurable: true,
    value: { mobile },
  });
}

describe("touch-first helpers", () => {
  const originalMatchMedia = globalThis.matchMedia;
  const originalUserAgent = globalThis.navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(globalThis, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
    defineMaxTouchPoints(0);
    defineUserAgent(originalUserAgent);
    defineUserAgentData(undefined);
  });

  describe("isTouchFirstEnvironment", () => {
    it("is false on a Windows touch laptop (touch + trackpad + hover)", () => {
      // Surface-style hybrid: 10 touch points but a fine pointer and hover.
      defineMaxTouchPoints(10);
      defineMatchMedia({
        "(any-pointer: fine)": true,
        "(pointer: fine)": true,
        "(any-hover: hover)": true,
        "(hover: hover)": true,
        "(any-pointer: coarse)": true,
      });

      expect(isTouchFirstEnvironment()).toBe(false);
    });

    it("is false when the browser mis-reports a coarse primary pointer but a fine pointer exists", () => {
      // Known Chromium-on-Windows quirk (tablet posture): primary pointer
      // flips to coarse while the trackpad is still available.
      defineMaxTouchPoints(10);
      defineMatchMedia({
        "(any-pointer: fine)": true,
        "(pointer: fine)": false,
        "(any-hover: hover)": true,
        "(hover: hover)": false,
        "(any-pointer: coarse)": true,
      });

      expect(isTouchFirstEnvironment()).toBe(false);
    });

    it("is true on a phone (touch only, no hover)", () => {
      defineMaxTouchPoints(5);
      defineMatchMedia({ "(any-pointer: coarse)": true });

      expect(isTouchFirstEnvironment()).toBe(true);
    });

    it("is true on touch-only devices that expose only a coarse pointer", () => {
      defineMaxTouchPoints(0);
      defineMatchMedia({ "(any-pointer: coarse)": true });

      expect(isTouchFirstEnvironment()).toBe(true);
    });

    it("is false on a mouse-only desktop", () => {
      defineMaxTouchPoints(0);
      defineMatchMedia({
        "(any-pointer: fine)": true,
        "(any-hover: hover)": true,
      });

      expect(isTouchFirstEnvironment()).toBe(false);
    });

    it("keeps phones touch-first when a paired mouse adds hover and a fine pointer", () => {
      defineMaxTouchPoints(5);
      defineMatchMedia({
        "(any-pointer: fine)": true,
        "(any-hover: hover)": true,
        "(any-pointer: coarse)": true,
      });
      defineUserAgentData(true);

      expect(isTouchFirstEnvironment()).toBe(true);
    });

    it("keeps stylus phones touch-first via the user-agent fallback", () => {
      defineMaxTouchPoints(5);
      defineMatchMedia({
        "(any-hover: hover)": true,
        "(any-pointer: coarse)": true,
      });
      defineUserAgentData(undefined);
      defineUserAgent(
        "Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36"
      );

      expect(isTouchFirstEnvironment()).toBe(true);
    });

    it("keeps Android tablets on desktop via the UA fallback when client hints are unavailable", () => {
      // Tablet UAs omit "Mobile"; the phone fallback must not match them.
      defineMaxTouchPoints(5);
      defineMatchMedia({
        "(any-pointer: fine)": true,
        "(any-hover: hover)": true,
        "(any-pointer: coarse)": true,
      });
      defineUserAgentData(undefined);
      defineUserAgent(
        "Mozilla/5.0 (Linux; Android 15; Pixel Tablet) AppleWebKit/537.36 Chrome/126 Safari/537.36"
      );

      expect(isTouchFirstEnvironment()).toBe(false);
    });

    it("keeps tablets with a trackpad on desktop when client hints say not mobile", () => {
      // Android tablet UAs still contain "Android", but client hints report
      // mobile=false — the tablet+trackpad combo must stay desktop.
      defineMaxTouchPoints(5);
      defineMatchMedia({
        "(any-pointer: fine)": true,
        "(any-hover: hover)": true,
        "(any-pointer: coarse)": true,
      });
      defineUserAgentData(false);
      defineUserAgent(
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/126 Safari/537.36"
      );

      expect(isTouchFirstEnvironment()).toBe(false);
    });

    it("honors an observed touchstart when capabilities are hidden", () => {
      defineMaxTouchPoints(0);
      defineMatchMedia({});

      expect(isTouchFirstEnvironment()).toBe(false);
      expect(isTouchFirstEnvironment({ touchDetected: true })).toBe(true);
    });

    it("is false when matchMedia is unavailable and there is no touch", () => {
      defineMaxTouchPoints(0);
      Object.defineProperty(globalThis, "matchMedia", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      expect(isTouchFirstEnvironment()).toBe(false);
    });
  });

  describe("capability helpers", () => {
    it("detects fine pointers from either primary or any-pointer queries", () => {
      defineMatchMedia({ "(pointer: fine)": true });
      expect(hasFinePointerCapability()).toBe(true);

      defineMatchMedia({ "(any-pointer: fine)": true });
      expect(hasFinePointerCapability()).toBe(true);

      defineMatchMedia({});
      expect(hasFinePointerCapability()).toBe(false);
    });

    it("detects hover from either primary or any-hover queries", () => {
      defineMatchMedia({ "(hover: hover)": true });
      expect(hasHoverCapability()).toBe(true);

      defineMatchMedia({ "(any-hover: hover)": true });
      expect(hasHoverCapability()).toBe(true);

      defineMatchMedia({});
      expect(hasHoverCapability()).toBe(false);
    });

    it("detects touch via maxTouchPoints", () => {
      defineMatchMedia({});
      defineMaxTouchPoints(10);
      expect(hasTouchCapability()).toBe(true);

      defineMaxTouchPoints(0);
      expect(hasTouchCapability()).toBe(false);
    });
  });

  describe("subscribeToTouchFirstChanges", () => {
    it("subscribes and unsubscribes from capability media queries", () => {
      defineMatchMedia({});
      const onChange = jest.fn();

      const unsubscribe = subscribeToTouchFirstChanges(onChange);
      expect(createdMqls.length).toBeGreaterThan(0);
      for (const mql of createdMqls) {
        expect(mql.addEventListener).toHaveBeenCalledWith("change", onChange);
      }

      unsubscribe();
      for (const mql of createdMqls) {
        expect(mql.removeEventListener).toHaveBeenCalledWith(
          "change",
          onChange
        );
      }
    });

    it("is a no-op without matchMedia", () => {
      Object.defineProperty(globalThis, "matchMedia", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const unsubscribe = subscribeToTouchFirstChanges(jest.fn());
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
