import { act, renderHook } from "@testing-library/react";
import { useMemesQuickVoteDialogController } from "@/hooks/useMemesQuickVoteDialogController";
import { usePrefetchMemesQuickVote } from "@/hooks/usePrefetchMemesQuickVote";

jest.mock("@/hooks/usePrefetchMemesQuickVote", () => ({
  usePrefetchMemesQuickVote: jest.fn(),
}));

const usePrefetchMemesQuickVoteMock =
  usePrefetchMemesQuickVote as jest.MockedFunction<
    typeof usePrefetchMemesQuickVote
  >;

describe("useMemesQuickVoteDialogController", () => {
  const prefetchMemesQuickVote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    usePrefetchMemesQuickVoteMock.mockReturnValue(prefetchMemesQuickVote);
  });

  it("reuses the prefetched session id when quick vote opens", () => {
    const { result } = renderHook(() => useMemesQuickVoteDialogController());

    act(() => {
      result.current.prefetchQuickVote();
    });

    expect(prefetchMemesQuickVote).toHaveBeenCalledTimes(1);
    expect(prefetchMemesQuickVote).toHaveBeenCalledWith(1);

    act(() => {
      result.current.openQuickVote();
    });

    expect(result.current.isQuickVoteOpen).toBe(true);
    expect(result.current.quickVoteSessionId).toBe(1);

    act(() => {
      result.current.closeQuickVote();
      result.current.openQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(2);
  });

  it("does not re-prefetch the same reserved session more than once", () => {
    const { result } = renderHook(() => useMemesQuickVoteDialogController());

    act(() => {
      result.current.prefetchQuickVote();
      result.current.prefetchQuickVote();
    });

    expect(prefetchMemesQuickVote).toHaveBeenCalledTimes(1);
    expect(prefetchMemesQuickVote).toHaveBeenCalledWith(1);
  });
});
