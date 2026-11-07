/**
 * Replays the gap-only chat sync timers over the times frames were sent, so
 * a browser test can compare the checks and read markers it observed with
 * what the product's rules allow for that exact burst.
 *
 * Checks (`useWaveRealtimeUpdater.gapSync.ts`): a window opens at the first
 * frame after the previous check; every frame re-arms the check to
 * min(frame + trailing delay, window start + max wait).
 *
 * Reads (`useMarkWaveNotificationsRead.debounce.ts`): the first post opens a
 * read window that sends once when it ends; later posts join it.
 *
 * A frame within `toleranceMs` of a pending deadline may land on either
 * side of it (delivery and timer jitter), so both outcomes are explored and
 * the result is a range.
 */
export interface GapSyncTiming {
  readonly trailingCheckMs: number;
  readonly maxWaitMs: number;
  readonly readWindowMs: number;
  readonly toleranceMs: number;
}

export const GAP_SYNC_TIMING: GapSyncTiming = {
  trailingCheckMs: 5_000,
  maxWaitMs: 15_000,
  readWindowMs: 3_000,
  toleranceMs: 1_000,
};

export interface Range {
  readonly min: number;
  readonly max: number;
}

export interface SimulatedGapSyncBurst {
  /** Every check, the one after the last frame included. */
  readonly checks: Range;
  /** When the check after the last frame runs. */
  readonly trailingCheckAt: Range;
  /** Reads the frames' posts send. */
  readonly readWindows: Range;
}

interface CheckState {
  readonly checks: number;
  readonly windowStartedAt: number | null;
  readonly deadline: number | null;
}

const toRange = (values: readonly number[]): Range =>
  values.length === 0
    ? { min: 0, max: 0 }
    : { min: Math.min(...values), max: Math.max(...values) };

function simulateChecks(
  frames: readonly number[],
  timing: GapSyncTiming
): { readonly checks: Range; readonly trailingCheckAt: Range } {
  const checks: number[] = [];
  const trailingCheckAt: number[] = [];
  const arm = (state: CheckState, at: number): CheckState => {
    const windowStartedAt = state.windowStartedAt ?? at;
    return {
      checks: state.checks,
      windowStartedAt,
      deadline: Math.max(
        at,
        Math.min(
          at + timing.trailingCheckMs,
          windowStartedAt + timing.maxWaitMs
        )
      ),
    };
  };
  const fire = (state: CheckState): CheckState => ({
    checks: state.checks + 1,
    windowStartedAt: null,
    deadline: null,
  });
  const visit = (state: CheckState, index: number): void => {
    const at = frames[index];
    if (at === undefined) {
      if (state.deadline === null) return;
      checks.push(state.checks + 1);
      trailingCheckAt.push(state.deadline);
      return;
    }
    const deadline = state.deadline;
    if (deadline === null) {
      visit(arm(state, at), index + 1);
      return;
    }
    const firesFirst = deadline < at - timing.toleranceMs;
    const frameFirst = deadline > at + timing.toleranceMs;
    if (!frameFirst) visit(arm(fire(state), at), index + 1);
    if (!firesFirst) visit(arm(state, at), index + 1);
  };
  visit({ checks: 0, windowStartedAt: null, deadline: null }, 0);
  return { checks: toRange(checks), trailingCheckAt: toRange(trailingCheckAt) };
}

function simulateReadWindows(
  frames: readonly number[],
  timing: GapSyncTiming
): Range {
  const windows: number[] = [];
  const visit = (count: number, endsAt: number | null, index: number) => {
    const at = frames[index];
    if (at === undefined) {
      windows.push(count);
      return;
    }
    if (endsAt === null) {
      visit(count + 1, at + timing.readWindowMs, index + 1);
      return;
    }
    const endsFirst = endsAt < at - timing.toleranceMs;
    const joins = endsAt > at + timing.toleranceMs;
    if (!joins) visit(count + 1, at + timing.readWindowMs, index + 1);
    if (!endsFirst) visit(count, endsAt, index + 1);
  };
  visit(0, null, 0);
  return toRange(windows);
}

/** The checks and reads the product's timers allow for frames sent at `frames`. */
export function simulateGapSyncBurst(
  frames: readonly number[],
  timing: GapSyncTiming = GAP_SYNC_TIMING
): SimulatedGapSyncBurst {
  const sorted = [...frames].sort((a, b) => a - b);
  return {
    ...simulateChecks(sorted, timing),
    readWindows: simulateReadWindows(sorted, timing),
  };
}
