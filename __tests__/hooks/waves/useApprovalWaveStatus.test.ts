import { act, renderHook } from "@testing-library/react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";

const createWave = ({
  maxWinners = null,
  noOfDecisionsDone = 0,
  noOfDecisionsLeft = null,
  type = ApiWaveType.Approve,
  votingEnd = null,
  winningThreshold = 8,
}: {
  readonly maxWinners?: number | null | undefined;
  readonly noOfDecisionsDone?: number | null | undefined;
  readonly noOfDecisionsLeft?: number | null | undefined;
  readonly type?: ApiWaveType | undefined;
  readonly votingEnd?: number | null | undefined;
  readonly winningThreshold?: number | null | undefined;
} = {}): ApiWave =>
  ({
    id: "wave-1",
    participation: { period: {} },
    voting: votingEnd === null ? {} : { period: { max: votingEnd } },
    wave: {
      type,
      winning_threshold: winningThreshold,
      max_winners: maxWinners,
      no_of_decisions_done: noOfDecisionsDone,
      no_of_decisions_left: noOfDecisionsLeft,
    },
  }) as ApiWave;

describe("useApprovalWaveStatus", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(1000));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts open for a future end time and closes after the timeout", () => {
    const wave = createWave({ votingEnd: 2000 });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isVotingClosed).toBe(false);
    expect(result.current.winningThreshold).toBe(8);

    act(() => {
      jest.setSystemTime(new Date(2000));
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.closeStatus).toBe("ended");
    expect(result.current.isVotingClosed).toBe(true);
  });

  it("closes on first render when the approval voting end time has passed", () => {
    const wave = createWave({ votingEnd: 500 });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.closeStatus).toBe("ended");
    expect(result.current.isVotingClosed).toBe(true);
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
  });

  it("returns no approval threshold for non-approve waves", () => {
    const wave = createWave({
      type: ApiWaveType.Rank,
      winningThreshold: 8,
      votingEnd: 500,
    });

    const { result } = renderHook(() => useApprovalWaveStatus({ wave }));

    expect(result.current.winningThreshold).toBeNull();
    expect(result.current.approvedCount).toBe(0);
    expect(result.current.closeStatus).toBeNull();
    expect(result.current.isVotingClosed).toBe(false);
  });
});
