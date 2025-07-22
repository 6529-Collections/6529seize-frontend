import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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
global.CSS = {
  supports: () => false,
  escape: (str) => str,
};

// Mock DOM methods that Bootstrap modals might use
Object.defineProperty(window, "scrollTo", {
  value: () => {},
  writable: true,
});

// Mock CSS functions that dom-helpers/css might use
global.css = (element, property, value) => {
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

// Provide ResizeObserver for components relying on it
if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = class {
    // no-op for test environment
    observe() {
      /* noop */
    }
    unobserve() {
      /* noop */
    }
    disconnect() {
      /* noop */
    }
  };
}

// Default API endpoint needed for service tests
process.env.API_ENDPOINT = process.env.API_ENDPOINT || "https://example.com";

// Mock ResizeObserver for react-tooltip
global.ResizeObserver = class ResizeObserver {
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

if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );
}
