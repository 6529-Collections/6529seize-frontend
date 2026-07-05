import { config } from "dotenv";
import { TextDecoder, TextEncoder } from "node:util";
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { MessagePort } from "node:worker_threads";

class TestMessagePort {
  constructor() {
    this.onmessage = null;
    this.onmessageerror = null;
    this.target = null;
    this.listeners = new Set();
  }

  postMessage(data) {
    const timeout = setTimeout(() => {
      const event = { data, target: this.target };
      this.target?.onmessage?.(event);
      this.target?.listeners.forEach((listener) => listener(event));
    }, 0);
    timeout.unref?.();
  }

  addEventListener(type, listener) {
    if (type === "message") {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type, listener) {
    if (type === "message") {
      this.listeners.delete(listener);
    }
  }

  dispatchEvent(event) {
    this.listeners.forEach((listener) => listener(event));
    return true;
  }

  close() {
    this.listeners.clear();
    this.onmessage = null;
    this.onmessageerror = null;
  }

  start() {}

  ref() {}

  unref() {}
}

class TestMessageChannel {
  constructor() {
    this.port1 = new TestMessagePort();
    this.port2 = new TestMessagePort();
    this.port1.target = this.port2;
    this.port2.target = this.port1;
  }
}

// Load environment variables for tests
config({ path: ".env.development" });

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.ReadableStream = globalThis.ReadableStream ?? ReadableStream;
globalThis.TransformStream = globalThis.TransformStream ?? TransformStream;
globalThis.WritableStream = globalThis.WritableStream ?? WritableStream;
globalThis.MessageChannel = TestMessageChannel;
globalThis.MessagePort = globalThis.MessagePort ?? MessagePort;

require("@testing-library/jest-dom");

// Mock CSS module imports
globalThis.CSS = {
  supports: () => false,
  escape: (str) => str,
};

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

// Only set up window mocks in jsdom environment
if (globalThis.window !== undefined) {
  globalThis.window.MessageChannel = TestMessageChannel;
  globalThis.window.MessagePort = globalThis.window.MessagePort ?? MessagePort;

  // Mock CSS parsing for CSS-dependent components
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

  // Mock scroll methods jsdom does not implement
  Object.defineProperty(window, "scrollTo", {
    value: () => {},
    writable: true,
  });

  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: () => {},
    writable: true,
  });

  // Mock matchMedia for device detection
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  globalThis.matchMedia = window.matchMedia;
}

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
    NEXTGEN_CHAIN_ID: 1,
    MOBILE_APP_SCHEME: "testmobile6529",
    CORE_SCHEME: "testcore6529",
    IPFS_API_ENDPOINT: "https://api-ipfs.test.6529.io",
    IPFS_GATEWAY_ENDPOINT: "https://ipfs.test.6529.io",
    MEDIA_RESOLVER_ENDPOINT: "https://media.6529.io",
    IPFS_MFS_PATH: "testfiles",
    TENOR_API_KEY: "test-tenor-api-key",
    WS_ENDPOINT: "wss://ws.test.6529.io",
    DEV_MODE_MEMES_WAVE_ID: "test-memes-wave-id",
    DEV_MODE_CURATION_WAVE_ID: "test-curation-wave-id",
    DEV_MODE_QUORUM_WAVE_ID: "test-quorum-wave-id",
  });
}

if (!process.env.ALCHEMY_API_KEY) {
  process.env.ALCHEMY_API_KEY = "x";
}

// Mock ResizeObserver for react-tooltip
globalThis.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {} // Intentionally empty - no actual observation needed in tests

  unobserve() {} // Intentionally empty - no actual observation needed in tests

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

// Mock AbortController only when the runtime does not provide a real one.
if (globalThis.AbortController === undefined) {
  globalThis.AbortController = class MockAbortController {
    constructor() {
      this.signal = new globalThis.AbortSignal();
    }
    abort(reason) {
      this.signal.aborted = true;
      this.signal.reason = reason;
    }
  };
}

if (globalThis.window !== undefined) {
  globalThis.window.AbortSignal =
    globalThis.window.AbortSignal ?? globalThis.AbortSignal;
  globalThis.window.AbortController =
    globalThis.window.AbortController ?? globalThis.AbortController;
}

if (globalThis.Request === undefined) {
  class TestRequest {
    constructor(input, init = {}) {
      this.url = typeof input === "string" ? input : (input?.url ?? "");
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

if (globalThis.URL !== undefined) {
  globalThis.URL.createObjectURL =
    globalThis.URL.createObjectURL ?? jest.fn(() => "blob:mock-object-url");
  globalThis.URL.revokeObjectURL = globalThis.URL.revokeObjectURL ?? jest.fn();
}

jest.mock("@testing-library/react", () => {
  const React = require("react");
  const actual = jest.requireActual("@testing-library/react");
  const { QueryClient, QueryClientProvider } = jest.requireActual(
    "@tanstack/react-query"
  );
  const { SeizeSettingsProvider } = jest.requireActual(
    "@/contexts/SeizeSettingsContext"
  );
  const { SeizeSettingsMode } = jest.requireActual("@/types/enums");
  const { WagmiProvider } = jest.requireActual("wagmi");
  const { createConfig } = jest.requireActual("@wagmi/core");
  const { http } = jest.requireActual("viem");
  const { mainnet } = jest.requireActual("wagmi/chains");

  const wagmiConfig = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http("http://localhost:8545"),
    },
  });

  const createQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

  const createWrapper = (InnerWrapper) => {
    const queryClient = createQueryClient();

    return function TestProviders({ children }) {
      const wrappedChildren = InnerWrapper
        ? React.createElement(InnerWrapper, null, children)
        : children;

      return React.createElement(
        WagmiProvider,
        { config: wagmiConfig },
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            SeizeSettingsProvider,
            { mode: SeizeSettingsMode.LOCAL },
            wrappedChildren
          )
        )
      );
    };
  };

  return {
    ...actual,
    render: (ui, options = {}) => {
      const { wrapper, ...restOptions } = options;
      return actual.render(ui, {
        ...restOptions,
        wrapper: createWrapper(wrapper),
      });
    },
    renderHook: (callback, options = {}) => {
      const { wrapper, ...restOptions } = options;
      return actual.renderHook(callback, {
        ...restOptions,
        wrapper: createWrapper(wrapper),
      });
    },
  };
});
