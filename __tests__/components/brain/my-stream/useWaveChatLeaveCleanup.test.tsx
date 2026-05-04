import { useWaveChatLeaveCleanup } from "@/components/brain/my-stream/useWaveChatLeaveCleanup";
import { act, renderHook, waitFor } from "@testing-library/react";

type CleanupCallbacks = {
  readonly setUnreadDividerSerialNo: jest.Mock;
  readonly removeWaveDeliveredNotifications: jest.Mock;
  readonly markWaveNotificationsRead: jest.Mock;
};

type HookProps = CleanupCallbacks & {
  readonly enabled: boolean;
  readonly waveId: string;
};

let documentVisibilityState: DocumentVisibilityState = "visible";

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  documentVisibilityState = state;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => documentVisibilityState,
  });
};

const createCallbacks = (): CleanupCallbacks => ({
  setUnreadDividerSerialNo: jest.fn(),
  removeWaveDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
  markWaveNotificationsRead: jest.fn().mockResolvedValue(undefined),
});

const renderLeaveCleanupHook = (props: HookProps) =>
  renderHook((hookProps: HookProps) => useWaveChatLeaveCleanup(hookProps), {
    initialProps: props,
  });

describe("useWaveChatLeaveCleanup", () => {
  beforeEach(() => {
    setDocumentVisibilityState("visible");
  });

  it("does not clean up when only callbacks change", async () => {
    const firstCallbacks = createCallbacks();
    const nextCallbacks = createCallbacks();
    const { rerender } = renderLeaveCleanupHook({
      enabled: true,
      waveId: "wave-1",
      ...firstCallbacks,
    });

    await act(async () => {
      rerender({
        enabled: true,
        waveId: "wave-1",
        ...nextCallbacks,
      });
      await Promise.resolve();
    });

    expect(firstCallbacks.setUnreadDividerSerialNo).not.toHaveBeenCalled();
    expect(
      firstCallbacks.removeWaveDeliveredNotifications
    ).not.toHaveBeenCalled();
    expect(firstCallbacks.markWaveNotificationsRead).not.toHaveBeenCalled();
    expect(nextCallbacks.setUnreadDividerSerialNo).not.toHaveBeenCalled();
    expect(
      nextCallbacks.removeWaveDeliveredNotifications
    ).not.toHaveBeenCalled();
    expect(nextCallbacks.markWaveNotificationsRead).not.toHaveBeenCalled();
  });

  it("cleans up the old wave with the latest callbacks on wave id change", async () => {
    const firstCallbacks = createCallbacks();
    const latestCallbacks = createCallbacks();
    const { rerender } = renderLeaveCleanupHook({
      enabled: true,
      waveId: "wave-1",
      ...firstCallbacks,
    });

    await act(async () => {
      rerender({
        enabled: true,
        waveId: "wave-1",
        ...latestCallbacks,
      });
    });

    await act(async () => {
      rerender({
        enabled: true,
        waveId: "wave-2",
        ...latestCallbacks,
      });
    });

    expect(latestCallbacks.setUnreadDividerSerialNo).toHaveBeenCalledWith(null);
    await waitFor(() => {
      expect(
        latestCallbacks.removeWaveDeliveredNotifications
      ).toHaveBeenCalledWith("wave-1");
      expect(latestCallbacks.markWaveNotificationsRead).toHaveBeenCalledWith(
        "wave-1"
      );
    });
    expect(firstCallbacks.setUnreadDividerSerialNo).not.toHaveBeenCalled();
    expect(
      firstCallbacks.removeWaveDeliveredNotifications
    ).not.toHaveBeenCalled();
    expect(firstCallbacks.markWaveNotificationsRead).not.toHaveBeenCalled();
  });

  it("cleans up when enabled changes from true to false", async () => {
    const callbacks = createCallbacks();
    const { rerender } = renderLeaveCleanupHook({
      enabled: true,
      waveId: "wave-1",
      ...callbacks,
    });

    await act(async () => {
      rerender({
        enabled: false,
        waveId: "wave-1",
        ...callbacks,
      });
    });

    expect(callbacks.setUnreadDividerSerialNo).toHaveBeenCalledWith(null);
    await waitFor(() => {
      expect(callbacks.removeWaveDeliveredNotifications).toHaveBeenCalledWith(
        "wave-1"
      );
      expect(callbacks.markWaveNotificationsRead).toHaveBeenCalledWith(
        "wave-1"
      );
    });
  });

  it("clears the divider but skips notification calls when hidden", async () => {
    setDocumentVisibilityState("hidden");
    const callbacks = createCallbacks();
    const { unmount } = renderLeaveCleanupHook({
      enabled: true,
      waveId: "wave-1",
      ...callbacks,
    });

    await act(async () => {
      unmount();
      await Promise.resolve();
    });

    expect(callbacks.setUnreadDividerSerialNo).toHaveBeenCalledWith(null);
    expect(callbacks.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(callbacks.markWaveNotificationsRead).not.toHaveBeenCalled();
  });
});
