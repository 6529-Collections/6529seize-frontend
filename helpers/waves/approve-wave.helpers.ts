import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

type ApprovalDropStatusKind =
  | "approved"
  | "reached_threshold"
  | "needs"
  | "closed";

interface ApprovalDropStatus {
  readonly kind: ApprovalDropStatusKind;
  readonly current: number;
  readonly threshold: number | null;
  readonly remaining: number | null;
}

export type ApprovalWaveCloseStatus = "max_reached" | "ended" | null;

const isValidCount = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const isApproveWave = (wave: ApiWave | null | undefined): boolean =>
  wave?.wave.type === ApiWaveType.Approve;

export const hasApprovalDecisionCounts = (
  wave: ApiWave | null | undefined
): boolean =>
  isValidCount(wave?.wave.no_of_decisions_done) ||
  isValidCount(wave?.wave.no_of_decisions_left);

export const isOfficiallyApprovedDrop = (
  drop: Pick<ApiDrop, "rank" | "winning_context"> | null | undefined
): boolean => {
  if (!drop) {
    return false;
  }

  return Boolean(drop.winning_context);
};

export const getApprovalDropStatus = ({
  drop,
  isClosed = false,
  winningThreshold,
}: {
  readonly drop: Pick<ApiDrop, "rating" | "rank" | "winning_context">;
  readonly isClosed?: boolean | undefined;
  readonly winningThreshold: number | null | undefined;
}): ApprovalDropStatus => {
  const current = Number.isFinite(drop.rating) ? drop.rating : 0;
  const threshold =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0
      ? winningThreshold
      : null;

  if (isOfficiallyApprovedDrop(drop)) {
    return {
      kind: "approved",
      current,
      threshold,
      remaining: null,
    };
  }

  if (threshold !== null && current >= threshold) {
    return {
      kind: "reached_threshold",
      current,
      threshold,
      remaining: 0,
    };
  }

  if (isClosed) {
    return {
      kind: "closed",
      current,
      threshold,
      remaining: null,
    };
  }

  return {
    kind: "needs",
    current,
    threshold,
    remaining: threshold === null ? null : Math.max(0, threshold - current),
  };
};

export const getApprovedDropsCount = ({
  areDecisionPointsComplete = false,
  decisionPoints,
  wave,
}: {
  readonly areDecisionPointsComplete?: boolean | undefined;
  readonly decisionPoints?: readonly ApiWaveDecision[] | undefined;
  readonly wave: ApiWave;
}): number | null => {
  const decisionsDone = wave.wave.no_of_decisions_done;
  if (isValidCount(decisionsDone)) {
    return decisionsDone;
  }

  const maxWinners = wave.wave.max_winners;
  const decisionsLeft = wave.wave.no_of_decisions_left;
  if (isValidCount(maxWinners) && isValidCount(decisionsLeft)) {
    return Math.max(0, maxWinners - decisionsLeft);
  }

  if (!areDecisionPointsComplete) {
    return null;
  }

  const approvedDropIds = new Set<string>();
  let winnersWithoutDropId = 0;

  (decisionPoints ?? []).forEach((decisionPoint) => {
    decisionPoint.winners.forEach((winner) => {
      const dropId = winner.drop.id;
      if (dropId) {
        approvedDropIds.add(dropId);
      } else {
        winnersWithoutDropId += 1;
      }
    });
  });

  return approvedDropIds.size + winnersWithoutDropId;
};

export const getApprovalWindowEndTime = (wave: ApiWave): number | null => {
  const votingEnd = wave.voting.period?.max;
  if (typeof votingEnd === "number" && Number.isFinite(votingEnd)) {
    return votingEnd;
  }

  const participationEnd = wave.participation.period?.max;
  if (
    typeof participationEnd === "number" &&
    Number.isFinite(participationEnd)
  ) {
    return participationEnd;
  }

  return null;
};

export const getApprovalWaveCloseStatus = ({
  approvedCount,
  now,
  wave,
}: {
  readonly approvedCount: number | null;
  readonly now: number;
  readonly wave: ApiWave;
}): ApprovalWaveCloseStatus => {
  const maxWinners = wave.wave.max_winners;
  const hasMaxWinners = isValidCount(maxWinners);
  const noDecisionsLeft = wave.wave.no_of_decisions_left;

  if (isValidCount(noDecisionsLeft) && noDecisionsLeft === 0) {
    return "max_reached";
  }

  if (hasMaxWinners && approvedCount !== null && approvedCount >= maxWinners) {
    return "max_reached";
  }

  const endTime = getApprovalWindowEndTime(wave);
  if (endTime !== null && now >= endTime) {
    return "ended";
  }

  return null;
};
