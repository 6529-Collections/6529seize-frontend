import { openUserConnectionSurfaceForRuntime } from "@/components/auth/capacitorConnectController";
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
    expect(openWebConnection).toHaveBeenCalledWith("test");
  });
});
