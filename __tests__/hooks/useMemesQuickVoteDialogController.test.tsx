import { act, renderHook } from "@testing-library/react";
import { useMemesQuickVoteDialogController } from "@/hooks/useMemesQuickVoteDialogController";
import {
  useMemesQuickVoteQueue,
  type UseMemesQuickVoteQueueResult,
} from "@/hooks/useMemesQuickVoteQueue";

jest.mock("@/hooks/useMemesQuickVoteQueue", () => ({
  useMemesQuickVoteQueue: jest.fn(),
}));

const useMemesQuickVoteQueueMock =
  useMemesQuickVoteQueue as jest.MockedFunction<typeof useMemesQuickVoteQueue>;

describe("useMemesQuickVoteDialogController", () => {
  const retryDiscovery = jest.fn();

  const createQueueResult = (): UseMemesQuickVoteQueueResult => ({
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
    skipDrop: jest.fn(),
    submitVote: jest.fn(),
    uncastPower: null,
    unratedCount: 0,
    votingLabel: null,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useMemesQuickVoteQueueMock.mockReturnValue(createQueueResult());
  });

  it("starts the reserved quick-vote session when prefetch runs", () => {
    const { result } = renderHook(() => useMemesQuickVoteDialogController());

    expect(useMemesQuickVoteQueueMock).toHaveBeenLastCalledWith({
      enabled: false,
      sessionId: 0,
    });

    act(() => {
      result.current.prefetchQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(1);
    expect(result.current.isQuickVoteOpen).toBe(false);
    expect(useMemesQuickVoteQueueMock).toHaveBeenLastCalledWith({
      enabled: true,
      sessionId: 1,
    });
    expect(retryDiscovery).not.toHaveBeenCalled();
  });

  it("opens an already prefetched session and retries discovery", () => {
    const { result } = renderHook(() => useMemesQuickVoteDialogController());

    act(() => {
      result.current.prefetchQuickVote();
    });

    act(() => {
      result.current.openQuickVote();
    });

    expect(result.current.isQuickVoteOpen).toBe(true);
    expect(result.current.quickVoteSessionId).toBe(1);
    expect(retryDiscovery).toHaveBeenCalledTimes(1);
    expect(result.current.dialogState.sessionId).toBe(1);

    act(() => {
      result.current.closeQuickVote();
      result.current.openQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(1);
    expect(retryDiscovery).toHaveBeenCalledTimes(2);
  });

  it("does not reserve a new session for repeated same-tick prefetches", () => {
    const { result } = renderHook(() => useMemesQuickVoteDialogController());

    act(() => {
      result.current.prefetchQuickVote();
      result.current.prefetchQuickVote();
    });

    expect(result.current.quickVoteSessionId).toBe(1);
    expect(useMemesQuickVoteQueueMock).toHaveBeenLastCalledWith({
      enabled: true,
      sessionId: 1,
    });
  });
});
