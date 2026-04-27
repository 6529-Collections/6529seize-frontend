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

  if (isClosed) {
    return {
      kind: "closed",
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

  return {
    kind: "needs",
    current,
    threshold,
    remaining: threshold === null ? null : Math.max(0, threshold - current),
  };
};

export const getApprovedDropsCount = ({
  decisionPoints,
  wave,
}: {
  readonly decisionPoints?: readonly ApiWaveDecision[] | undefined;
  readonly wave: ApiWave;
}): number => {
  const decisionsDone = wave.wave.no_of_decisions_done;
  if (isValidCount(decisionsDone)) {
    return decisionsDone;
  }

  if (!decisionPoints) {
    return 0;
  }

  const approvedDropIds = new Set<string>();
  let winnersWithoutDropId = 0;

  decisionPoints.forEach((decisionPoint) => {
    decisionPoint.winners.forEach((winner) => {
      if (winner.drop.id) {
        approvedDropIds.add(winner.drop.id);
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
  readonly approvedCount: number;
  readonly now: number;
  readonly wave: ApiWave;
}): ApprovalWaveCloseStatus => {
  const maxWinners = wave.wave.max_winners;
  const hasMaxWinners = isValidCount(maxWinners);
  const noDecisionsLeft = wave.wave.no_of_decisions_left;

  if (isValidCount(noDecisionsLeft) && noDecisionsLeft === 0) {
    return "max_reached";
  }

  if (hasMaxWinners && approvedCount >= maxWinners) {
    return "max_reached";
  }

  const endTime = getApprovalWindowEndTime(wave);
  if (endTime !== null && now >= endTime) {
    return "ended";
  }

  return null;
};
