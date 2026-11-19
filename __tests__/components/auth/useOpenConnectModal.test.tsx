import { act, renderHook } from "@testing-library/react";
import { createAppKitModalBridgeStore } from "@/components/auth/AppKitModalBridge";
import { useOpenConnectModal } from "@/components/auth/useOpenConnectModal";
import * as walletChunkRecovery from "@/components/providers/walletChunkRecovery";

function createHarness(isAppKitReady = true) {
  const store = createAppKitModalBridgeStore();
  const open = jest.fn().mockResolvedValue(undefined);
  const close = jest.fn().mockResolvedValue(undefined);
  store.setOpen(open);
  store.setClose(close);
  const waitForAppKitReady = jest.fn<Promise<void>, []>().mockResolvedValue();
  const options = {
    appKitModalBridgeStore: store,
    clearConnectIntentHandoffTimeout: jest.fn(),
    clearConnectIntentWaitingForAppKit: jest.fn(),
    getSignOutAllGeneration: () => 0,
    hasSignOutAllGenerationChanged: () => false,
    isAppKitReady,
    isMountedRef: { current: true },
    isSigningOutAllRef: { current: false },
    scheduleConnectIntentHandoffFallback: jest.fn(),
    setIsConnectIntentWaitingForAppKit: jest.fn(),
    waitForAppKitReady,
  };
  const hook = renderHook(() => useOpenConnectModal(options));
  return { ...hook, open, close, waitForAppKitReady, options };
}

describe("wallet modal handoff lifetime", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("bounds an AppKit readiness wait that never resolves", async () => {
    jest.useFakeTimers();
    const reload = jest
      .spyOn(walletChunkRecovery, "reloadToRetryWalletChunks")
      .mockReturnValue(true);
    const harness = createHarness(false);
    harness.waitForAppKitReady.mockReturnValueOnce(
      new Promise(() => undefined)
    );
    let result: Promise<unknown> | undefined;
    await act(async () => {
      result = harness.result.current("test").catch((error: unknown) => error);
      await jest.advanceTimersByTimeAsync(30_000);
    });

    expect(await result).toMatchObject({
      message: "Failed to open wallet connection modal",
    });
    expect(harness.open).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("closes an open that is cancelled in its completion microtask", async () => {
    const harness = createHarness();
    const controller = new AbortController();
    harness.open.mockImplementationOnce(async () => {
      queueMicrotask(() => controller.abort());
    });

    await act(async () => {
      await harness.result.current("test", undefined, controller.signal);
    });

    expect(harness.close).toHaveBeenCalledTimes(1);
    expect(
      harness.options.scheduleConnectIntentHandoffFallback
    ).not.toHaveBeenCalled();
  });

  it("leaves AppKit open after a successful transfer releases the setup", async () => {
    const harness = createHarness();
    const controller = new AbortController();
    await act(async () => {
      await harness.result.current("test", undefined, controller.signal);
      controller.abort();
    });

    expect(harness.open).toHaveBeenCalledTimes(1);
    expect(harness.close).not.toHaveBeenCalled();
  });
});
