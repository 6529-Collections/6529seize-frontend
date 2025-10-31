import { config } from "dotenv";
import { TextDecoder, TextEncoder } from "node:util";

// Load environment variables for tests
config({ path: ".env.development" });

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

require("@testing-library/jest-dom");

// Mock CSS parsing for react-bootstrap and other CSS-dependent components
Object.defineProperty(window, "getComputedStyle", {
  value: () => ({
    getPropertyValue: (prop) => {
      if (prop === "transition-duration" || prop === "animation-duration") {
        return "0s";
      }
      return "";
    },
    transitionDuration: "0s",
    animationDuration: "0s",
  }),
});

// Mock CSS module imports
globalThis.CSS = {
  supports: () => false,
  escape: (str) => str,
};

// Mock DOM methods that Bootstrap modals might use
Object.defineProperty(window, "scrollTo", {
  value: () => {},
  writable: true,
});

// Mock CSS functions that dom-helpers/css might use
globalThis.css = (element, property, value) => {
  if (arguments.length === 3) {
    return element;
  }
  if (typeof property === "string") {
    if (property.includes("duration") || property.includes("delay")) {
      return "0s";
    }
    if (property.includes("margin") || property.includes("padding")) {
      return "0px";
    }
    return "";
  }
  return "";
};

// Mock matchMedia for device detection
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * Provide a sane default PUBLIC_RUNTIME blob for tests that indirectly import config/env.
 * Individual tests can override by mocking `@/config/env` or by setting PUBLIC_RUNTIME themselves
 * before requiring modules under test.
 */
if (!process.env.PUBLIC_RUNTIME) {
  process.env.PUBLIC_RUNTIME = JSON.stringify({
    NODE_ENV: "test",
    VERSION: "test-version",
    API_ENDPOINT: "https://api.test.6529.io",
    BASE_ENDPOINT: "https://test.6529.io",
    ALLOWLIST_API_ENDPOINT: "https://allowlist-api.test.6529.io",
    ALCHEMY_API_KEY: "test-alchemy-api-key",
    NEXTGEN_CHAIN_ID: 1,
    MOBILE_APP_SCHEME: "testmobile6529",
    CORE_SCHEME: "testcore6529",
    IPFS_API_ENDPOINT: "https://api-ipfs.test.6529.io",
    IPFS_GATEWAY_ENDPOINT: "https://ipfs.test.6529.io",
    IPFS_MFS_PATH: "testfiles",
    TENOR_API_KEY: "test-tenor-api-key",
    WS_ENDPOINT: "wss://ws.test.6529.io",
    DEV_MODE_MEMES_WAVE_ID: "test-memes-wave-id",
  });
}

// Mock ResizeObserver for react-tooltip
globalThis.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {} // Intentionally empty - no actual observation needed in tests
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {} // Intentionally empty - no actual observation needed in tests
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {} // Intentionally empty - no actual observation needed in tests
};

if (globalThis.fetch === undefined) {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );
}

// Mock AbortController for Node.js environment - ensure it's available everywhere
class MockAbortController {
  constructor() {
    this.signal = {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      reason: undefined,
      throwIfAborted: jest.fn(),
    };
  }
  abort(reason) {
    this.signal.aborted = true;
    this.signal.reason = reason;
  }
}

// Set on all global objects to ensure it's available during module loading
globalThis.AbortController = MockAbortController;
if (globalThis.window !== undefined) {
  globalThis.window.AbortController = MockAbortController;
}

// Mock AbortSignal for Node.js environment
if (globalThis.AbortSignal === undefined) {
  globalThis.AbortSignal = class MockAbortSignal {
    constructor() {
      this.aborted = false;
      this.reason = undefined;
      this.addEventListener = jest.fn();
      this.removeEventListener = jest.fn();
      this.throwIfAborted = jest.fn();
    }

    reset() {
      this.aborted = false;
      this.reason = undefined;
      this.addEventListener.mockClear();
      this.removeEventListener.mockClear();
      this.throwIfAborted.mockClear();
    }
  };
}

if (globalThis.Request === undefined) {
  class TestRequest {
    constructor(input, init = {}) {
      this.url = typeof input === "string" ? input : input?.url ?? "";
      this.method = init.method ?? "GET";
      this.headers = init.headers ?? {};
      this.body = init.body ?? null;
      this.signal = init.signal ?? null;
    }

    clone() {
      return new TestRequest(this, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        signal: this.signal,
      });
    }
  }

  globalThis.Request = TestRequest;
  if (globalThis.window !== undefined) {
    globalThis.window.Request = TestRequest;
  }
}
