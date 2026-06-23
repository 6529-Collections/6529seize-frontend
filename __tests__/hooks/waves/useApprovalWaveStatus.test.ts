import { act, renderHook } from "@testing-library/react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import {
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
  useWaveDecisions,
} from "@/hooks/waves/useWaveDecisions";

jest.mock("@/hooks/waves/useWaveDecisions", () => ({
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE: 2000,
  useWaveDecisions: jest.fn(),
}));

const useWaveDecisionsMock = useWaveDecisions as jest.Mock;

const createWave = ({
  maxWinners = null,
  noOfDecisionsDone = 0,
  noOfDecisionsLeft = null,
  type = ApiWaveType.Approve,
  votingEnd = null,
  winningThreshold = 8,
  winningThresholdMinDurationMs = 0,
}: {
  readonly maxWinners?: number | null | undefined;
  readonly noOfDecisionsDone?: number | null | undefined;
  readonly noOfDecisionsLeft?: number | null | undefined;
  readonly type?: ApiWaveType | undefined;
  readonly votingEnd?: number | null | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
} = {}): ApiWave =>
  ({
    id: "wave-1",
    participation: { period: {} },
    voting: votingEnd === null ? {} : { period: { max: votingEnd } },
    wave: {
      type,
      winning_threshold: winningThreshold,
      winning_threshold_min_duration_ms: winningThresholdMinDurationMs,
      max_winners: maxWinners,
      no_of_decisions_done: noOfDecisionsDone,
      no_of_decisions_left: noOfDecisionsLeft,
    },
  }) as ApiWave;

const decisionPoints = [
  {
    decision_time: 1100,
    winners: [{ place: 1, awards: [], drop: { id: "drop-1" } }],
  },
  {
    decision_time: 1200,
    winners: [{ place: 1, awards: [], drop: { id: "drop-2" } }],
  },
] as ApiWaveDecision[];

describe("useApprovalWaveStatus", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(1000));
    useWaveDecisionsMock.mockReturnValue({
      decisionPoints: [],
      hasLoadedAllPages: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("starts open for a future end time and closes after the timeout", () => {
    const wave = createWave({ votingEnd: 2000 });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(false);
    expect(result.current.isApprovalStatusLoading).toBe(false);
    expect(result.current.isApprovalStatusError).toBe(false);
    expect(result.current.winningThreshold).toBe(8);
    expect(result.current.winningThresholdMinDurationMs).toBe(0);

    act(() => {
      jest.setSystemTime(new Date(2000));
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.closeStatus).toBe("ended");
    expect(result.current.isVotingClosed).toBe(true);
    expect(result.current.isVotingControlsLocked).toBe(true);
  });

  it("closes on first render when the approval voting end time has passed", () => {
    const wave = createWave({ votingEnd: 500 });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.closeStatus).toBe("ended");
    expect(result.current.isVotingClosed).toBe(true);
    expect(result.current.isVotingControlsLocked).toBe(true);
  });

  it("does not load full decisions for ended approve wave with missing counters", () => {
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 500,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      enabled: false,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
    expect(result.current.approvedCount).toBeNull();
    expect(result.current.closeStatus).toBe("ended");
    expect(result.current.isApprovalStatusLoading).toBe(false);
    expect(result.current.isVotingClosed).toBe(true);
    expect(result.current.isVotingControlsLocked).toBe(true);
  });

  it("does not load full decisions for approve waves without max winners", () => {
    const wave = createWave({
      maxWinners: null,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 2000,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      enabled: false,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
    expect(result.current.approvedCount).toBeNull();
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isApprovalStatusLoading).toBe(false);
    expect(result.current.isApprovalStatusError).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(false);
  });

  it("closes immediately when max approvals are reached", () => {
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: 2,
      votingEnd: 2000,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.approvedCount).toBe(2);
    expect(result.current.closeStatus).toBe("max_reached");
    expect(result.current.isVotingClosed).toBe(true);
    expect(result.current.isVotingControlsLocked).toBe(true);
  });

  it("keeps capped approval status unknown until complete decisions load", () => {
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 2000,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      enabled: true,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
    expect(result.current.approvedCount).toBeNull();
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isApprovalStatusLoading).toBe(true);
    expect(result.current.isApprovalStatusError).toBe(false);
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(true);
  });

  it("does not start an internal load when incomplete decision points are caller-owned", () => {
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 2000,
    });

    const { result } = renderHook(() =>
      useApprovalWaveStatus({
        wave,
        decisionPoints: decisionPoints.slice(0, 1),
        areDecisionPointsComplete: false,
      })
    );

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      enabled: false,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
    expect(result.current.approvedCount).toBeNull();
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isApprovalStatusLoading).toBe(true);
    expect(result.current.isApprovalStatusError).toBe(false);
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(true);
  });

  it("reports an error when the internal full-decision load fails", () => {
    const refetch = jest.fn();
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 2000,
    });
    useWaveDecisionsMock.mockReturnValue({
      decisionPoints: [],
      hasLoadedAllPages: false,
      isLoadingAllPages: false,
      isLoadingAllPagesError: true,
      refetch,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.approvedCount).toBeNull();
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isApprovalStatusLoading).toBe(false);
    expect(result.current.isApprovalStatusError).toBe(true);
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(true);

    result.current.retryApprovalStatus?.();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("reports an error when caller-owned decision loading fails", () => {
    const retry = jest.fn();
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 2000,
    });

    const { result } = renderHook(() =>
      useApprovalWaveStatus({
        wave,
        decisionPoints: decisionPoints.slice(0, 1),
        areDecisionPointsComplete: false,
        isDecisionPointsLoadError: true,
        onRetryDecisionPointsLoad: retry,
      })
    );

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      enabled: false,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
    expect(result.current.approvedCount).toBeNull();
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isApprovalStatusLoading).toBe(false);
    expect(result.current.isApprovalStatusError).toBe(true);
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(true);

    result.current.retryApprovalStatus?.();

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("closes when complete decision points reach max winners", () => {
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 2000,
    });

    const { result } = renderHook(() =>
      useApprovalWaveStatus({
        wave,
        decisionPoints,
        areDecisionPointsComplete: true,
      })
    );

    expect(result.current.approvedCount).toBe(2);
    expect(result.current.closeStatus).toBe("max_reached");
    expect(result.current.isVotingClosed).toBe(true);
    expect(result.current.isVotingControlsLocked).toBe(true);
    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      enabled: false,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
  });

  it("derives capped approval status from decisions left without loading decision pages", () => {
    const wave = createWave({
      maxWinners: 10,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: 3,
      votingEnd: 2000,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(useWaveDecisionsMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      enabled: false,
      loadAllPages: true,
      pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
    });
    expect(result.current.approvedCount).toBe(7);
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isApprovalStatusLoading).toBe(false);
    expect(result.current.isApprovalStatusError).toBe(false);
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(false);
  });

  it("closes immediately when no decisions are left", () => {
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: 0,
      votingEnd: 2000,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.approvedCount).toBe(2);
    expect(result.current.closeStatus).toBe("max_reached");
    expect(result.current.isVotingClosed).toBe(true);
    expect(result.current.isVotingControlsLocked).toBe(true);
    expect(result.current.isApprovalStatusLoading).toBe(false);
  });

  it("uses internally loaded complete decisions for capped approval status", () => {
    const wave = createWave({
      maxWinners: 2,
      noOfDecisionsDone: null,
      noOfDecisionsLeft: null,
      votingEnd: 2000,
    });
    useWaveDecisionsMock.mockReturnValue({
      decisionPoints,
      hasLoadedAllPages: true,
      isLoadingAllPages: false,
      isLoadingAllPagesError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.approvedCount).toBe(2);
    expect(result.current.closeStatus).toBe("max_reached");
    expect(result.current.isVotingClosed).toBe(true);
    expect(result.current.isVotingControlsLocked).toBe(true);
  });

  it("returns no approval threshold for non-approve waves", () => {
    const wave = createWave({
      type: ApiWaveType.Rank,
      winningThreshold: 8,
      winningThresholdMinDurationMs: 120_000,
      votingEnd: 500,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.winningThreshold).toBeNull();
    expect(result.current.winningThresholdMinDurationMs).toBeNull();
    expect(result.current.approvedCount).toBe(0);
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isApprovalStatusLoading).toBe(false);
    expect(result.current.isApprovalStatusError).toBe(false);
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.isVotingControlsLocked).toBe(false);
  });

  it("returns the approval min threshold duration for approve waves", () => {
    const wave = createWave({
      winningThreshold: 8,
      winningThresholdMinDurationMs: 120_000,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.winningThreshold).toBe(8);
    expect(result.current.winningThresholdMinDurationMs).toBe(120_000);
  });
});
