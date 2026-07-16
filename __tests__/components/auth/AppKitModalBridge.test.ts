import { createAppKitModalBridgeStore } from "@/components/auth/AppKitModalBridge";

describe("AppKitModalBridge store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("bounds a pending modal-open waiter", async () => {
    const store = createAppKitModalBridgeStore();
    const waitForOpen = store.waitForOpen();
    const rejection = expect(waitForOpen).rejects.toThrow(
      "Timed out waiting for wallet connection services"
    );

    await jest.advanceTimersByTimeAsync(15_000);

    await rejection;
  });

  it("rejects current and future waiters after bootstrap failure", async () => {
    const store = createAppKitModalBridgeStore();
    const pendingWaiter = store.waitForOpen();
    const pendingRejection = expect(pendingWaiter).rejects.toThrow(
      "Wallet connection services failed to initialize"
    );

    store.failBootstrap();

    await pendingRejection;
    await expect(store.waitForOpen()).rejects.toThrow(
      "Wallet connection services failed to initialize"
    );
  });

  it("rejects current and future waiters after disposal", async () => {
    const store = createAppKitModalBridgeStore();
    const pendingWaiter = store.waitForOpen();
    const pendingRejection = expect(pendingWaiter).rejects.toThrow(
      "Wallet connection services became unavailable"
    );

    store.dispose();

    await pendingRejection;
    await expect(store.waitForOpen()).rejects.toThrow(
      "Wallet connection services became unavailable"
    );
  });

  it("invalidates a cached handle and state on bootstrap failure", async () => {
    const store = createAppKitModalBridgeStore();
    const openAppKit = jest.fn().mockResolvedValue(undefined);
    store.setOpen(openAppKit);
    store.setState({
      isOpen: true,
      walletName: "Test wallet",
      walletIcon: undefined,
      isSafeWallet: false,
    });

    store.failBootstrap();

    await expect(store.waitForOpen()).rejects.toThrow(
      "Wallet connection services failed to initialize"
    );
    expect(store.getSnapshot()).toEqual({
      isOpen: false,
      walletName: undefined,
      walletIcon: undefined,
      isSafeWallet: false,
    });

    store.setOpen(openAppKit);
    store.setState({
      isOpen: true,
      walletName: "Stale wallet",
      walletIcon: undefined,
      isSafeWallet: false,
    });
    await expect(store.waitForOpen()).rejects.toThrow(
      "Wallet connection services failed to initialize"
    );
    expect(store.getSnapshot().isOpen).toBe(false);
  });

  it("invalidates a cached handle on disposal", async () => {
    const store = createAppKitModalBridgeStore();
    const openAppKit = jest.fn().mockResolvedValue(undefined);
    store.setOpen(openAppKit);

    store.dispose();

    await expect(store.waitForOpen()).rejects.toThrow(
      "Wallet connection services became unavailable"
    );
    store.setOpen(openAppKit);
    await expect(store.waitForOpen()).rejects.toThrow(
      "Wallet connection services became unavailable"
    );
  });
});
