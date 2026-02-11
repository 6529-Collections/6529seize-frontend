import { act, renderHook } from "@testing-library/react";
import { useClosingDropId } from "@/hooks/useClosingDropId";

describe("useClosingDropId", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("hides immediately and allows reopening after searchParams catches up", () => {
    const { result, rerender } = renderHook(
      ({ dropId }: { readonly dropId: string | undefined }) =>
        useClosingDropId(dropId),
      {
        initialProps: { dropId: "drop-1" },
      }
    );

    expect(result.current.effectiveDropId).toBe("drop-1");

    // Begin closing — modal should hide immediately
    act(() => {
      result.current.beginClosingDrop("drop-1");
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    // React searchParams catches up (dropId becomes undefined)
    act(() => {
      rerender({ dropId: undefined });
    });
    // closingDropId cleared, effectiveDropId still undefined (no drop in URL)
    expect(result.current.effectiveDropId).toBeUndefined();

    // Drop re-opened via URL
    act(() => {
      rerender({ dropId: "drop-1" });
    });
    expect(result.current.effectiveDropId).toBe("drop-1");
  });

  it("stays hidden while searchParams hasn't caught up yet", () => {
    const { result } = renderHook(
      ({ dropId }: { readonly dropId: string | undefined }) =>
        useClosingDropId(dropId),
      {
        initialProps: { dropId: "drop-1" },
      }
    );

    act(() => {
      result.current.beginClosingDrop("drop-1");
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    // Time passes but searchParams still shows old drop — must stay hidden
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.effectiveDropId).toBeUndefined();
  });

  it("falls back to reopening after safety timeout when URL does not update", () => {
    const { result } = renderHook(() => useClosingDropId("drop-1"));

    act(() => {
      result.current.beginClosingDrop("drop-1");
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    // Safety timeout fires — re-show the modal since the URL never changed
    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current.effectiveDropId).toBe("drop-1");
  });

  it("cancels safety timer when searchParams catches up before timeout", () => {
    const { result, rerender } = renderHook(
      ({ dropId }: { readonly dropId: string | undefined }) =>
        useClosingDropId(dropId),
      {
        initialProps: { dropId: "drop-1" },
      }
    );

    act(() => {
      result.current.beginClosingDrop("drop-1");
    });

    // React catches up before timeout
    act(() => {
      jest.advanceTimersByTime(100);
      rerender({ dropId: undefined });
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    // Safety timer fires — should be a no-op, modal stays closed
    act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(result.current.effectiveDropId).toBeUndefined();
  });

  it("handles rapid close-reopen correctly", () => {
    const { result, rerender } = renderHook(
      ({ dropId }: { readonly dropId: string | undefined }) =>
        useClosingDropId(dropId),
      {
        initialProps: { dropId: "drop-1" },
      }
    );

    // Close
    act(() => {
      result.current.beginClosingDrop("drop-1");
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    // React catches up
    act(() => {
      rerender({ dropId: undefined });
    });

    // Immediately reopen with different drop
    act(() => {
      rerender({ dropId: "drop-2" });
    });
    expect(result.current.effectiveDropId).toBe("drop-2");
  });
});
