import { act, renderHook } from "@testing-library/react";
import { useVotingModalState } from "@/components/voting/useVotingModalState";

describe("useVotingModalState", () => {
  it("opens the modal when voting is unlocked", () => {
    const { result } = renderHook(() => useVotingModalState(false));

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("does not open the modal when voting is locked", () => {
    const { result } = renderHook(() => useVotingModalState(true));

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("closes the modal when voting becomes locked", () => {
    const { result, rerender } = renderHook(
      ({ isVotingClosed }: { readonly isVotingClosed: boolean }) =>
        useVotingModalState(isVotingClosed),
      {
        initialProps: { isVotingClosed: false },
      }
    );

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      rerender({ isVotingClosed: true });
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("does not reopen by itself when voting becomes unlocked again", () => {
    const { result, rerender } = renderHook(
      ({ isVotingClosed }: { readonly isVotingClosed: boolean }) =>
        useVotingModalState(isVotingClosed),
      {
        initialProps: { isVotingClosed: false },
      }
    );

    act(() => {
      result.current.open();
    });

    act(() => {
      rerender({ isVotingClosed: true });
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      rerender({ isVotingClosed: false });
    });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });
});
