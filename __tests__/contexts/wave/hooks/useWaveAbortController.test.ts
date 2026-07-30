import * as Sentry from "@sentry/nextjs";
import { act, renderHook } from "@testing-library/react";
import { useWaveAbortController } from "@/contexts/wave/hooks/useWaveAbortController";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

jest.mock("@sentry/nextjs", () => ({
  addBreadcrumb: jest.fn(),
}));

describe("useWaveAbortController", () => {
  const addBreadcrumbMock = jest.mocked(Sentry.addBreadcrumb);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates, cancels, and cleans up controllers", () => {
    const { result } = renderHook(() => useWaveAbortController("feed"));

    const controller = result.current.createController("w1");
    const abortSpy = jest.spyOn(controller, "abort");

    act(() => {
      result.current.cancelFetch("w1", "wave_deactivated");
    });
    expect(abortSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.cleanupController("w1", controller);
    });

    act(() => {
      result.current.cancelFetch("w1", "wave_deactivated");
    });
    expect(abortSpy).toHaveBeenCalledTimes(1);
  });

  it("records the feed request kind and cancellation trigger", () => {
    const { result } = renderHook(() => useWaveAbortController("feed"));

    result.current.createController("private-wave-id-newest-sync");

    act(() => {
      result.current.cancelFetch(
        "private-wave-id-newest-sync",
        "wave_deactivated"
      );
    });

    expect(addBreadcrumbMock).toHaveBeenCalledWith({
      category: "wave.request",
      level: "info",
      message: "wave_request_aborted",
      data: {
        request_kind: "background_sync",
        trigger: "wave_deactivated",
      },
    });
    expect(JSON.stringify(addBreadcrumbMock.mock.calls)).not.toContain(
      "private-wave-id"
    );
  });

  it("records replacement, pagination, and unmount triggers", () => {
    const feedHook = renderHook(() => useWaveAbortController("feed"));

    const replacedController = feedHook.result.current.createController(
      "w1-initial-backfill"
    );
    const replacedAbortSpy = jest.spyOn(replacedController, "abort");
    feedHook.result.current.createController("w1-initial-backfill");

    expect(replacedAbortSpy).toHaveBeenCalledTimes(1);
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          request_kind: "native_initial_backfill",
          trigger: "request_replaced",
        },
      })
    );

    const paginationHook = renderHook(() =>
      useWaveAbortController("pagination")
    );
    paginationHook.result.current.createController("w2-around");
    act(() => {
      paginationHook.result.current.cancelFetch(
        "w2-around",
        "pagination_cancelled"
      );
    });
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          request_kind: "pagination_around",
          trigger: "pagination_cancelled",
        },
      })
    );

    const unmountController = feedHook.result.current.createController("w3");
    const unmountAbortSpy = jest.spyOn(unmountController, "abort");
    act(() => {
      feedHook.unmount();
    });
    expect(unmountAbortSpy).toHaveBeenCalledTimes(1);
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          request_kind: "initial_visible",
          trigger: "hook_unmounted",
        },
      })
    );
  });

  it("still aborts when breadcrumb recording fails", () => {
    addBreadcrumbMock.mockImplementationOnce(() => {
      throw new Error("Sentry unavailable");
    });
    const { result } = renderHook(() => useWaveAbortController("feed"));
    const controller = result.current.createController("w1-newest-sync");
    const abortSpy = jest.spyOn(controller, "abort");

    expect(() => {
      act(() => {
        result.current.cancelFetch("w1-newest-sync", "wave_deactivated");
      });
    }).not.toThrow();
    expect(abortSpy).toHaveBeenCalledTimes(1);
  });

  it("aborts old-profile requests when the connected profile switches", () => {
    const { result } = renderHook(() => useWaveAbortController("feed"));
    const controller = result.current.createController("private-wave");
    const abortSpy = jest.spyOn(controller, "abort");

    act(() => {
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
    });

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          request_kind: "initial_visible",
          trigger: "profile_switched",
        },
      })
    );
  });

  it("keeps bulk cancellation stable across rerenders", () => {
    const { result, rerender } = renderHook(() =>
      useWaveAbortController("feed")
    );
    const initialCancelAllFetches = result.current.cancelAllFetches;

    rerender();

    expect(result.current.cancelAllFetches).toBe(initialCancelAllFetches);
  });
});
