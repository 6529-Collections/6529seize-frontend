import { runInNewContext } from "node:vm";
import {
  isSmallWebStartupExpected,
  SMALL_WEB_STARTUP_SCRIPT,
} from "@/components/layout/smallWebStartup";
import * as touchFirst from "@/helpers/touch-first.helpers";

interface Device {
  readonly ua?: string;
  readonly width?: number;
  readonly touch?: number;
  readonly coarse?: boolean;
  readonly fine?: boolean;
  readonly hover?: boolean;
  readonly mobileHint?: boolean;
  readonly savedMouse?: boolean;
  readonly native?: boolean;
  readonly blockedStorage?: boolean;
}

function mediaMatches(device: Device): Record<string, boolean> {
  return {
    "(any-pointer: coarse)": device.coarse ?? false,
    "(any-pointer: fine)": device.fine ?? false,
    "(pointer: fine)": device.fine ?? false,
    "(any-hover: hover)": device.hover ?? false,
    "(hover: hover)": device.hover ?? false,
  };
}

function bootstrap(device: Device) {
  const setAttribute = jest.fn();
  const matches = mediaMatches(device);
  runInNewContext(SMALL_WEB_STARTUP_SCRIPT, {
    innerWidth: device.width ?? 390,
    navigator: {
      userAgent: device.ua ?? "Mozilla/5.0",
      userAgentData: { mobile: device.mobileHint },
      maxTouchPoints: device.touch ?? 0,
    },
    matchMedia: (query: string) => ({ matches: matches[query] ?? false }),
    localStorage: {
      getItem: () => {
        if (device.blockedStorage) throw new Error("Storage blocked");
        return device.savedMouse ? "1" : null;
      },
    },
    document: {
      documentElement: {
        hasAttribute: () => device.native ?? false,
        setAttribute,
      },
    },
  });
  return setAttribute;
}

const mobileDevices: readonly Device[] = [
  { ua: "iPhone", touch: 5 },
  { ua: "Android Mobile", touch: 5 },
  { mobileHint: true, fine: true, hover: true },
  { ua: "iPhone", fine: true, hover: true, savedMouse: true },
  { ua: "Macintosh", touch: 5, width: 900 },
  { coarse: true, width: 900 },
  { coarse: true, blockedStorage: true },
  { ua: "Android Mobile", width: 1023 },
];

const desktopAndNativeDevices: readonly Device[] = [
  {},
  { ua: "Windows", touch: 10, fine: true, hover: true },
  { ua: "Windows", coarse: true, savedMouse: true },
  { ua: "Macintosh", touch: 5, fine: true, hover: true },
  { ua: "Android", mobileHint: false, touch: 5, fine: true },
  { ua: "iPhone", width: 1024 },
  { ua: "iPhone", native: true },
];

it.each(mobileDevices)(
  "prepares mobile web before React loads: %j",
  (device) => {
    expect(bootstrap(device)).toHaveBeenCalledWith(
      "data-small-web-startup",
      "true"
    );
  }
);

it.each(desktopAndNativeDevices)(
  "preserves desktop and native layout choices: %j",
  (device) => {
    expect(bootstrap(device)).not.toHaveBeenCalled();
  }
);

it.each<Device>([
  ...mobileDevices,
  ...desktopAndNativeDevices.filter((device) => !device.native),
  { ua: "iPhone", mobileHint: false, touch: 5, fine: true },
  { ua: "Android", touch: 5, fine: true, hover: true },
  { ua: "Windows", coarse: true, savedMouse: true, blockedStorage: true },
])("keeps startup and actual hydrated classification aligned: %j", (device) => {
  const properties = {
    userAgent: device.ua ?? "Mozilla/5.0",
    userAgentData: { mobile: device.mobileHint },
    maxTouchPoints: device.touch ?? 0,
  };
  const descriptors = Object.keys(properties).map(
    (key) => [key, Object.getOwnPropertyDescriptor(navigator, key)] as const
  );
  const width = globalThis.innerWidth;
  const originalMatchMedia = globalThis.matchMedia;
  const matches = mediaMatches(device);
  const storage = jest
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation((key) => {
      if (device.blockedStorage) throw new Error("Storage blocked");
      return key === touchFirst.FINE_POINTER_STORAGE_KEY && device.savedMouse
        ? "1"
        : null;
    });
  try {
    for (const [key, value] of Object.entries(properties)) {
      Object.defineProperty(navigator, key, { configurable: true, value });
    }
    globalThis.innerWidth = device.width ?? 390;
    globalThis.matchMedia = jest.fn((query: string) => ({
      matches: matches[query] ?? false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: () => false,
    }));
    // Persisted mouse evidence is read at module initialization. Give each
    // device a fresh production helper rather than mocking touch-first rules.
    jest.isolateModules(() => {
      const startup = jest.requireActual<
        typeof import("@/components/layout/smallWebStartup")
      >("@/components/layout/smallWebStartup");
      expect(startup.isSmallWebStartupExpected()).toBe(
        bootstrap(device).mock.calls.length > 0
      );
    });
  } finally {
    storage.mockRestore();
    globalThis.innerWidth = width;
    globalThis.matchMedia = originalMatchMedia;
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(navigator, key, descriptor);
      else Reflect.deleteProperty(navigator, key);
    }
  }
});

it("keeps the server content available when browser detection fails", () => {
  const setAttribute = jest.fn();
  runInNewContext(SMALL_WEB_STARTUP_SCRIPT, {
    innerWidth: 390,
    document: { documentElement: { hasAttribute: () => false, setAttribute } },
  });
  expect(setAttribute).not.toHaveBeenCalled();
});

it.each([
  { ua: "iPhone", touchFirst: false, width: 390, expected: true },
  {
    ua: "Android",
    mobileHint: false,
    touchFirst: false,
    width: 900,
    expected: false,
  },
  { ua: "Macintosh", touchFirst: true, width: 900, expected: true },
  { ua: "Macintosh", touchFirst: false, width: 900, expected: false },
  { ua: "iPhone", touchFirst: true, width: 1024, expected: false },
])("uses current capabilities for the hydrated handoff: %j", (device) => {
  const ua = Object.getOwnPropertyDescriptor(navigator, "userAgent");
  const hints = Object.getOwnPropertyDescriptor(navigator, "userAgentData");
  const width = globalThis.innerWidth;
  const touch = jest
    .spyOn(touchFirst, "isTouchFirstEnvironment")
    .mockReturnValue(device.touchFirst);
  try {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: device.ua,
    });
    Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      value: { mobile: device.mobileHint },
    });
    globalThis.innerWidth = device.width;
    expect(isSmallWebStartupExpected()).toBe(device.expected);
  } finally {
    touch.mockRestore();
    globalThis.innerWidth = width;
    if (ua) Object.defineProperty(navigator, "userAgent", ua);
    else Reflect.deleteProperty(navigator, "userAgent");
    if (hints) Object.defineProperty(navigator, "userAgentData", hints);
    else Reflect.deleteProperty(navigator, "userAgentData");
  }
});
