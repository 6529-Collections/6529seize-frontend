import {
  openFreshUserConnection,
  openUserConnectionSurfaceForRuntime,
} from "@/components/auth/capacitorConnectController";
import {
  closeDesktopConnectDialog,
  getDesktopConnectDialogOpener,
} from "@/services/desktop/desktopConnectDialog";

const setBridge = (key: "api" | "nativeAuth", value: unknown) => {
  Object.defineProperty(window, key, { configurable: true, value });
};

describe("openUserConnectionSurfaceForRuntime in 6529 Desktop", () => {
  const openWebConnection = jest.fn().mockResolvedValue(undefined);
  const setCapacitorView = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
    closeDesktopConnectDialog();
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  const open = () =>
    openUserConnectionSurfaceForRuntime({
      source: "test",
      isCapacitor: false,
      isSigningOutAll: false,
      openWebConnection,
      setCapacitorView,
    });

  it("opens the AppKit modal directly on the web", async () => {
    await open();

    expect(openWebConnection).toHaveBeenCalledWith("test");
    expect(getDesktopConnectDialogOpener()).toBeNull();
  });

  it("opens the desktop choice first, which can open WalletConnect", async () => {
    setBridge("api", { openExternal: jest.fn() });
    setBridge("nativeAuth", { sessionLogin: jest.fn() });

    await open();

    expect(openWebConnection).not.toHaveBeenCalled();
    const openWalletConnect = getDesktopConnectDialogOpener();
    expect(openWalletConnect).not.toBeNull();
    await openWalletConnect?.();
    expect(openWebConnection).toHaveBeenCalledWith(
      "test",
      expect.any(AbortSignal)
    );
  });

  it("keeps a live wallet connected when its setup was already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    const disconnect = jest.fn();
    const openUserConnectionSurface = jest.fn();

    await openFreshUserConnection({
      address: `0x${"a".repeat(40)}`,
      isConnected: true,
      isCapacitor: false,
      isActiveAppWalletConnector: false,
      isSigningOutAll: false,
      signal: controller.signal,
      disconnect,
      getSignOutAllGeneration: () => 0,
      hasSignOutAllGenerationChanged: () => false,
      isMounted: () => true,
      openUserConnectionSurface,
    });

    expect(disconnect).not.toHaveBeenCalled();
    expect(openUserConnectionSurface).not.toHaveBeenCalled();
  });
});
