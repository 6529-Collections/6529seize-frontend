import { Capacitor } from "@capacitor/core";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getSessionClientType,
  getSessionNonce,
} from "@/services/auth/session-v2.utils";

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

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const setBridge = (key: "api" | "nativeAuth", value: unknown) => {
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });
};

const installDesktopShell = () => {
  setBridge("api", { openExternal: jest.fn() });
  setBridge("nativeAuth", { sessionLogin: jest.fn() });
};

describe("getSessionClientType", () => {
  beforeEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    jest.mocked(commonApiFetch).mockResolvedValue({
      signable_message: "6529 Authentication",
      server_signature: "server-signature",
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    jest.clearAllMocks();
  });

  it("is web in a browser", () => {
    expect(getSessionClientType()).toBe("web");
  });

  it("is native in the mobile app", () => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    expect(getSessionClientType()).toBe("native");
  });

  it("stays web when only an unrelated window.api exists", () => {
    setBridge("api", { openExternal: jest.fn() });

    expect(getSessionClientType()).toBe("web");
  });

  it("is desktop inside the desktop shell", () => {
    installDesktopShell();

    expect(getSessionClientType()).toBe("desktop");
  });

  it("prefers desktop when a native platform is also reported", () => {
    installDesktopShell();
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    expect(getSessionClientType()).toBe("desktop");
  });

  it("requests a desktop nonce inside the desktop shell", async () => {
    installDesktopShell();

    await getSessionNonce({ signerAddress: "0xabc" });

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "auth/session-nonce",
      params: {
        signer_address: "0xabc",
        client_type: "desktop",
        chain_id: "1",
      },
      errorMode: "structured",
    });
  });

  it("keeps the web nonce request unchanged in a browser", async () => {
    await getSessionNonce({ signerAddress: "0xabc" });

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "auth/session-nonce",
      params: {
        signer_address: "0xabc",
        client_type: "web",
        chain_id: "1",
      },
      errorMode: "structured",
    });
  });
});
