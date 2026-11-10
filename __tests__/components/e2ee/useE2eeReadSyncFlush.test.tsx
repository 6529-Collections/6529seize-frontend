import { renderHook } from "@testing-library/react";
import { useE2eeReadSyncFlush } from "@/components/e2ee/useE2eeReadSyncFlush";
import type { E2eeEngine } from "@/lib/e2ee/types";

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useE2eeReadSyncFlush (D175, P60 §4)", () => {
  afterEach(() => setVisibility("visible"));

  it("sends waiting read positions when the page is hidden or unloaded", () => {
    const flushReadSync = jest.fn(() => Promise.resolve());
    const engine = { flushReadSync } as unknown as E2eeEngine;
    const { unmount } = renderHook(() => useE2eeReadSyncFlush(engine));

    setVisibility("visible");
    expect(flushReadSync).not.toHaveBeenCalled();
    setVisibility("hidden");
    expect(flushReadSync).toHaveBeenCalledTimes(1);
    globalThis.dispatchEvent(new Event("pagehide"));
    expect(flushReadSync).toHaveBeenCalledTimes(2);

    unmount();
    setVisibility("hidden");
    expect(flushReadSync).toHaveBeenCalledTimes(2);
  });

  it("does nothing without an engine or with one that cannot flush", () => {
    renderHook(() => useE2eeReadSyncFlush(null));
    renderHook(() => useE2eeReadSyncFlush({} as E2eeEngine));
    expect(() => setVisibility("hidden")).not.toThrow();
  });

  it("ignores a failed flush", async () => {
    const flushReadSync = jest.fn(() => Promise.reject(new Error("offline")));
    renderHook(() =>
      useE2eeReadSyncFlush({ flushReadSync } as unknown as E2eeEngine)
    );
    setVisibility("hidden");
    await Promise.resolve();
    expect(flushReadSync).toHaveBeenCalledTimes(1);
  });
});
