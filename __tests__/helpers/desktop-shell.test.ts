import {
  getDesktopNativeAuth,
  getDesktopNotifications,
  getDesktopShellApi,
  getDesktopStore,
  getDesktopUpdater,
  isDesktopShell,
} from "@/helpers/desktop-shell";

const BRIDGE_KEYS = [
  "api",
  "nativeAuth",
  "notifications",
  "updater",
  "store",
] as const;

type BridgeKey = (typeof BRIDGE_KEYS)[number];

const setBridge = (key: BridgeKey, value: unknown) => {
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });
};

const clearBridges = () => {
  for (const key of BRIDGE_KEYS) {
    Reflect.deleteProperty(window, key);
  }
};

const installDesktopBridges = () => {
  const bridges = {
    api: { openExternal: jest.fn(), getInfo: jest.fn() },
    nativeAuth: { sessionLogin: jest.fn() },
    notifications: { setBadge: jest.fn() },
    updater: { checkUpdates: jest.fn() },
    store: { get: jest.fn() },
  };
  for (const key of BRIDGE_KEYS) {
    setBridge(key, bridges[key]);
  }
  return bridges;
};

describe("desktop-shell", () => {
  afterEach(() => {
    clearBridges();
  });

  it("is false in a plain browser and every accessor returns null", () => {
    expect(isDesktopShell()).toBe(false);
    expect(getDesktopShellApi()).toBeNull();
    expect(getDesktopNativeAuth()).toBeNull();
    expect(getDesktopNotifications()).toBeNull();
    expect(getDesktopUpdater()).toBeNull();
    expect(getDesktopStore()).toBeNull();
  });

  it("ignores an Electron user agent without the bridge", () => {
    const userAgent = jest
      .spyOn(window.navigator, "userAgent", "get")
      .mockReturnValue("Mozilla/5.0 Electron/38.0.0");

    expect(isDesktopShell()).toBe(false);
    userAgent.mockRestore();
  });

  it("is false when only window.api exists, such as from an extension", () => {
    setBridge("api", { openExternal: jest.fn() });

    expect(isDesktopShell()).toBe(false);
    expect(getDesktopShellApi()).toBeNull();
  });

  it("is false when only the native sign-in bridge exists", () => {
    setBridge("nativeAuth", { sessionLogin: jest.fn() });

    expect(isDesktopShell()).toBe(false);
    expect(getDesktopNativeAuth()).toBeNull();
  });

  it("is false when the bridge values are not objects", () => {
    setBridge("api", null);
    setBridge("nativeAuth", "desktop");

    expect(isDesktopShell()).toBe(false);
  });

  it("is false when stray globals are arrays or empty objects", () => {
    setBridge("api", []);
    setBridge("nativeAuth", []);
    expect(isDesktopShell()).toBe(false);

    setBridge("api", {});
    setBridge("nativeAuth", {});
    expect(isDesktopShell()).toBe(false);
  });

  it("is false when the expected bridge methods are not functions", () => {
    setBridge("api", { openExternal: "https://example.com" });
    setBridge("nativeAuth", { sessionLogin: jest.fn() });
    expect(isDesktopShell()).toBe(false);

    setBridge("api", { openExternal: jest.fn() });
    setBridge("nativeAuth", { sessionLogin: true });
    expect(isDesktopShell()).toBe(false);
  });

  it("is true inside the desktop shell and returns each bridge", () => {
    const bridges = installDesktopBridges();

    expect(isDesktopShell()).toBe(true);
    expect(getDesktopShellApi()).toBe(bridges.api);
    expect(getDesktopNativeAuth()).toBe(bridges.nativeAuth);
    expect(getDesktopNotifications()).toBe(bridges.notifications);
    expect(getDesktopUpdater()).toBe(bridges.updater);
    expect(getDesktopStore()).toBe(bridges.store);
  });

  it("reads the bridge live instead of caching the first answer", () => {
    expect(isDesktopShell()).toBe(false);
    const bridges = installDesktopBridges();
    expect(getDesktopShellApi()).toBe(bridges.api);

    clearBridges();
    expect(isDesktopShell()).toBe(false);
    expect(getDesktopShellApi()).toBeNull();
  });

  it("returns null for an optional bridge the shell does not provide", () => {
    installDesktopBridges();
    setBridge("updater", undefined);

    expect(isDesktopShell()).toBe(true);
    expect(getDesktopUpdater()).toBeNull();
  });
});
