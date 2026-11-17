import { getDesktopWallet } from "@/helpers/desktop-shell";

const KEYS = ["api", "nativeAuth", "desktopWallet"] as const;

const set = (key: (typeof KEYS)[number], value: unknown) =>
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });

const walletBridge = () => ({
  request: jest.fn(),
  cancel: jest.fn(),
  reopen: jest.fn(),
  status: jest.fn(),
  capabilities: jest.fn(),
  onStatusChange: jest.fn(),
});

describe("getDesktopWallet", () => {
  afterEach(() => {
    for (const key of KEYS) Reflect.deleteProperty(window, key);
  });

  it("is null on the web, even with a lookalike object", () => {
    set("desktopWallet", walletBridge());
    expect(getDesktopWallet()).toBeNull();
  });

  describe("inside 6529 Desktop", () => {
    beforeEach(() => {
      set("api", { openExternal: jest.fn() });
      set("nativeAuth", { sessionLogin: jest.fn() });
    });

    it("is null in a build without wallet forwarding", () => {
      expect(getDesktopWallet()).toBeNull();
    });

    it.each(["request", "status", "onStatusChange"])(
      "is null when %s is missing",
      (method) => {
        const bridge: Record<string, unknown> = walletBridge();
        delete bridge[method];
        set("desktopWallet", bridge);
        expect(getDesktopWallet()).toBeNull();
      }
    );

    it("returns the shell's bridge", () => {
      const bridge = walletBridge();
      set("desktopWallet", bridge);
      expect(getDesktopWallet()).toBe(bridge);
    });
  });
});
