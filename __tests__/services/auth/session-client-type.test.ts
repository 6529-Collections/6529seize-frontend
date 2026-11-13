import { Capacitor } from "@capacitor/core";
import { getSessionClientType } from "@/services/auth/session-v2.utils";

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
  WebPlugin: class {
    readonly pluginName = "mock";
  },
  registerPlugin: jest.fn(),
}));

jest.mock("@/services/notifications/push-installation", () => ({
  queueNativePushLogout: jest.fn().mockResolvedValue(undefined),
}));

const setBridge = (key: "api" | "nativeAuth", value: unknown) => {
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });
};

describe("getSessionClientType", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it("is web in a browser", () => {
    expect(getSessionClientType()).toBe("web");
  });

  it("is native in the mobile app", () => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    expect(getSessionClientType()).toBe("native");
  });

  // Sign-in, refresh and logout do not route through window.nativeAuth yet.
  // Until they do, the desktop bridge must not change the session client type,
  // so no half-wired desktop session can start.
  it("ignores the desktop bridge until desktop sign-in is routed", () => {
    setBridge("api", { openExternal: jest.fn() });
    setBridge("nativeAuth", { sessionLogin: jest.fn() });

    expect(getSessionClientType()).toBe("web");
  });
});
