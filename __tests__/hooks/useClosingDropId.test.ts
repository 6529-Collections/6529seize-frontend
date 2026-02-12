import { act, renderHook } from "@testing-library/react";
import { useClosingDropId } from "@/hooks/useClosingDropId";

describe("useClosingDropId", () => {
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
    expect(result.current.effectiveDropId).toBeUndefined();

    // Re-render without URL change — must stay hidden.
    act(() => {
      rerender({ dropId: "drop-1" });
    });
    expect(result.current.effectiveDropId).toBeUndefined();
  });

  it("keeps hidden if URL never updates", () => {
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
    expect(result.current.effectiveDropId).toBeUndefined();

    // Keep rendering with same URL drop id; should remain hidden.
    act(() => {
      rerender({ dropId: "drop-1" });
      rerender({ dropId: "drop-1" });
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
