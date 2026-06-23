import { act, renderHook } from "@testing-library/react";
import { useMemesQuickVoteDialogController } from "@/hooks/useMemesQuickVoteDialogController";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";

jest.mock("@/hooks/useMemesQuickVoteQueue", () => ({
  useMemesQuickVoteQueue: jest.fn(),
}));

const useMemesQuickVoteQueueMock =
  useMemesQuickVoteQueue as jest.MockedFunction<typeof useMemesQuickVoteQueue>;

describe("useMemesQuickVoteDialogController", () => {
  const retryDiscovery = jest.fn();
  const queueResult = {
    activeDrop: null,
    hasDiscoveryError: false,
    isExhausted: false,
    isLoading: false,
    isReady: false,
    isRestartingRound: false,
    leftThisRoundCount: 0,
    latestUsedAmount: null,
    nextDrop: null,
    recentAmounts: [],
    retryDiscovery,
    submitVote: jest.fn(),
    skipDrop: jest.fn(),
    uncastPower: null,
    unratedCount: 0,
    votingLabel: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useMemesQuickVoteQueueMock.mockReturnValue(queueResult);
  });

  it("reuses the prefetched queue session when quick vote opens", () => {
    const { result } = renderHook(() => useMemesQuickVoteDialogController());

    expect(useMemesQuickVoteQueueMock).toHaveBeenLastCalledWith({
      enabled: false,
      sessionId: 0,
    });

    act(() => {
      result.current.prefetchQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(1);
    expect(useMemesQuickVoteQueueMock).toHaveBeenLastCalledWith({
      enabled: true,
      sessionId: 1,
    });

    act(() => {
      result.current.openQuickVote();
    });

    expect(result.current.isQuickVoteOpen).toBe(true);
    expect(result.current.quickVoteSessionId).toBe(1);
    expect(retryDiscovery).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.closeQuickVote();
      result.current.openQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(1);
    expect(retryDiscovery).toHaveBeenCalledTimes(2);
  });

  it("retries discovery instead of creating a new session after prefetching", () => {
    const { result } = renderHook(() => useMemesQuickVoteDialogController());

    act(() => {
      result.current.prefetchQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(1);

    act(() => {
      result.current.prefetchQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(1);
    expect(retryDiscovery).toHaveBeenCalledTimes(1);
  });
});
