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
});
