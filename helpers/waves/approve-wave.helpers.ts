import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

export type ApprovalDropStatusKind =
  | "approved"
  | "approving"
  | "reached_threshold"
  | "needs"
  | "closed";

export interface ApprovalDropStatus {
  readonly kind: ApprovalDropStatusKind;
  readonly current: number;
  readonly threshold: number | null;
  readonly remaining: number | null;
  readonly countdownMs: number | null;
}

export type ApprovalWaveCloseStatus = "max_reached" | "ended" | null;

export type ApprovalDropStatusDrop = Pick<
  ApiDrop,
  "rating" | "rank" | "winning_context"
> & {
  readonly over_threshold_since_ms?: number | null | undefined;
};

const MINUTE_MS = 60_000;
const HOUR_MINUTES = 60;

const isValidCount = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const getValidPositiveDuration = (
  durationMs: number | null | undefined
): number | null =>
  typeof durationMs === "number" &&
  Number.isFinite(durationMs) &&
  durationMs > 0
    ? durationMs
    : null;

const getValidTimestamp = (
  timestampMs: number | null | undefined,
  nowMs: number
): number | null =>
  typeof timestampMs === "number" &&
  Number.isFinite(timestampMs) &&
  timestampMs >= 0 &&
  timestampMs <= nowMs
    ? timestampMs
    : null;

const getApprovalCountdownMs = ({
  minDurationMs,
  nowMs,
  overThresholdSinceMs,
}: {
  readonly minDurationMs: number | null | undefined;
  readonly nowMs: number;
  readonly overThresholdSinceMs: number | null | undefined;
}): number | null => {
  const validMinDurationMs = getValidPositiveDuration(minDurationMs);
  const validSinceMs = getValidTimestamp(overThresholdSinceMs, nowMs);

  if (validMinDurationMs === null || validSinceMs === null) {
    return null;
  }

  const elapsedMs = nowMs - validSinceMs;
  const remainingMs = validMinDurationMs - elapsedMs;
  return remainingMs > 0 ? remainingMs : null;
};

const getWinnerDropId = (
  winner: ApiWaveDecision["winners"][number]
): string | null => {
  const drop = (winner as { readonly drop?: unknown }).drop;
  if (typeof drop !== "object" || drop === null) {
    return null;
  }

  const id = (drop as { readonly id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
};

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
  nowMs = Date.now(),
  winningThreshold,
  winningThresholdMinDurationMs,
}: {
  readonly drop: ApprovalDropStatusDrop;
  readonly isClosed?: boolean | undefined;
  readonly nowMs?: number | undefined;
  readonly winningThreshold: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
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
      countdownMs: null,
    };
  }

  if (threshold !== null && current >= threshold) {
    const countdownMs = getApprovalCountdownMs({
      minDurationMs: winningThresholdMinDurationMs,
      nowMs,
      overThresholdSinceMs: drop.over_threshold_since_ms,
    });

    if (!isClosed && countdownMs !== null) {
      return {
        kind: "approving",
        current,
        threshold,
        remaining: 0,
        countdownMs,
      };
    }

    return {
      kind: "reached_threshold",
      current,
      threshold,
      remaining: 0,
      countdownMs: null,
    };
  }

  if (isClosed) {
    return {
      kind: "closed",
      current,
      threshold,
      remaining: null,
      countdownMs: null,
    };
  }

  return {
    kind: "needs",
    current,
    threshold,
    remaining: threshold === null ? null : Math.max(0, threshold - current),
    countdownMs: null,
  };
};

export const formatApprovalCountdownTime = (timeLeftMs: number): string => {
  if (!Number.isFinite(timeLeftMs) || timeLeftMs <= 0) {
    return "<1m";
  }

  if (timeLeftMs < MINUTE_MS) {
    return "<1m";
  }

  const totalMinutes = Math.ceil(timeLeftMs / MINUTE_MS);
  if (totalMinutes < HOUR_MINUTES) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / HOUR_MINUTES);
  const minutes = totalMinutes % HOUR_MINUTES;
  return `${hours}h ${minutes}m`;
};

export const getApprovalCountdownDelayMs = (
  timeLeftMs: number
): number | null => {
  if (!Number.isFinite(timeLeftMs) || timeLeftMs <= 0) {
    return null;
  }

  if (timeLeftMs <= MINUTE_MS) {
    return timeLeftMs === MINUTE_MS ? 1 : timeLeftMs;
  }

  const remainderMs = timeLeftMs % MINUTE_MS;
  return remainderMs === 0 ? MINUTE_MS : remainderMs;
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
      const dropId = getWinnerDropId(winner);
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
