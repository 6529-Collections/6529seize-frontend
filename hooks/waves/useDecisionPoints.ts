import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { DecisionPoint } from "@/helpers/waves/time.types";
import {
  calculateLastDecisionTime,
  FALLBACK_END_TIME,
} from "@/helpers/waves/time.utils";
import { Time } from "@/helpers/time";

const DEFAULT_PAST_WINDOW = 6;
const DEFAULT_FUTURE_WINDOW = 10;
const DEFAULT_WINDOW_STEP = 6;

interface UseDecisionPointsOptions {
  readonly initialPastWindow?: number | undefined;
  readonly initialFutureWindow?: number | undefined;
  readonly windowStep?: number | undefined;
}

interface DecisionWindowResult {
  readonly decisions: DecisionPoint[];
  readonly hasMorePast: boolean;
  readonly hasMoreFuture: boolean;
  readonly nextDecisionTimestamp: number | null;
  readonly remainingPastCount: number | null;
  readonly remainingFutureCount: number | null;
}

export const useDecisionPoints = (
  wave: ApiWave,
  options?: UseDecisionPointsOptions
) => {
  const {
    initialPastWindow = DEFAULT_PAST_WINDOW,
    initialFutureWindow = DEFAULT_FUTURE_WINDOW,
    windowStep = DEFAULT_WINDOW_STEP,
  } = options ?? {};

  const step = Math.max(1, windowStep);
  const sanitizedPast = Math.max(0, initialPastWindow);
  const sanitizedFuture = Math.max(0, initialFutureWindow);
  const [pastWindow, setPastWindow] = useState(sanitizedPast);
  const [futureWindow, setFutureWindow] = useState(sanitizedFuture);

  useEffect(() => {
    setPastWindow(sanitizedPast);
    setFutureWindow(sanitizedFuture);
  }, [wave?.id, sanitizedPast, sanitizedFuture]);

  const decisionWindow = useMemo<DecisionWindowResult>(() => {
    return computeDecisionWindow({ wave, pastWindow, futureWindow });
  }, [wave, pastWindow, futureWindow]);

  const loadMorePast = useCallback(() => {
    setPastWindow((prev) => prev + step);
  }, [step]);

  const loadMoreFuture = useCallback(() => {
    setFutureWindow((prev) => prev + step);
  }, [step]);

  return {
    allDecisions: decisionWindow.decisions,
    hasMorePast: decisionWindow.hasMorePast,
    hasMoreFuture: decisionWindow.hasMoreFuture,
    loadMorePast,
    loadMoreFuture,
    nextDecisionTimestamp: decisionWindow.nextDecisionTimestamp,
    remainingPastCount: decisionWindow.remainingPastCount,
    remainingFutureCount: decisionWindow.remainingFutureCount,
  };
};

interface ComputeDecisionWindowParams {
  readonly wave: ApiWave;
  readonly pastWindow: number;
  readonly futureWindow: number;
}

const computeDecisionWindow = ({
  wave,
  pastWindow,
  futureWindow,
}: ComputeDecisionWindowParams): DecisionWindowResult => {
  const firstDecisionTime =
    wave.wave.decisions_strategy?.first_decision_time ?? null;

  if (firstDecisionTime == null) {
    return {
      decisions: [],
      hasMoreFuture: false,
      hasMorePast: false,
      nextDecisionTimestamp: null,
      remainingPastCount: 0,
      remainingFutureCount: 0,
    };
  }

  const subsequentDecisions =
    wave.wave.decisions_strategy?.subsequent_decisions ?? [];
  const isRolling = wave.wave.decisions_strategy?.is_rolling ?? false;
  const now = Time.currentMillis();

  if (subsequentDecisions.length === 0 || !isRolling) {
    return computeFiniteWindow({
      firstDecisionTime,
      subsequentDecisions,
      now,
      pastWindow,
      futureWindow,
      lastDecisionTime: calculateLastDecisionTime(wave),
    });
  }

  const lastDecisionTime = calculateLastDecisionTime(wave);
  const hasExplicitEnd = wave.voting.period?.max != null;
  const isInfiniteRolling =
    isRolling && (!hasExplicitEnd || lastDecisionTime === FALLBACK_END_TIME);

  if (isInfiniteRolling) {
    return computeRollingWindow({
      firstDecisionTime,
      subsequentDecisions,
      now,
      pastWindow,
      futureWindow,
      lastDecisionTime: null,
    });
  }

  return computeRollingWindow({
    firstDecisionTime,
    subsequentDecisions,
    now,
    pastWindow,
    futureWindow,
    lastDecisionTime,
  });
};

const createDecisionPointId = (timestamp: number, seriesIndex: number): string =>
  `${timestamp}-${seriesIndex}`;

const createDecisionPoint = (
  seriesIndex: number,
  timestamp: number
): DecisionPoint => ({
  id: createDecisionPointId(timestamp, seriesIndex),
  name: seriesIndex === 0 ? "First Decision" : `Decision ${seriesIndex}`,
  timestamp,
  seriesIndex,
});

interface ComputeFiniteWindowParams {
  readonly firstDecisionTime: number;
  readonly subsequentDecisions: number[];
  readonly now: number;
  readonly pastWindow: number;
  readonly futureWindow: number;
  readonly lastDecisionTime: number;
}

const computeFiniteWindow = ({
  firstDecisionTime,
  subsequentDecisions,
  now,
  pastWindow,
  futureWindow,
  lastDecisionTime,
}: ComputeFiniteWindowParams): DecisionWindowResult => {
  if (firstDecisionTime > lastDecisionTime) {
    return {
      decisions: [],
      hasMoreFuture: false,
      hasMorePast: false,
      nextDecisionTimestamp: null,
      remainingPastCount: 0,
      remainingFutureCount: 0,
    };
  }

  const timestamps: number[] = [firstDecisionTime];
  let currentTime = firstDecisionTime;

  for (const interval of subsequentDecisions) {
    if (interval <= 0) {
      continue;
    }
    const nextTime = currentTime + interval;
    if (nextTime > lastDecisionTime) {
      break;
    }
    timestamps.push(nextTime);
    currentTime = nextTime;
  }

  return sliceTimestamps({
    timestamps,
    now,
    pastWindow,
    futureWindow,
  });
};

interface ComputeRollingWindowParams {
  readonly firstDecisionTime: number;
  readonly subsequentDecisions: number[];
  readonly now: number;
  readonly pastWindow: number;
  readonly futureWindow: number;
  readonly lastDecisionTime: number | null;
}

const computeRollingWindow = ({
  firstDecisionTime,
  subsequentDecisions,
  now,
  pastWindow,
  futureWindow,
  lastDecisionTime,
}: ComputeRollingWindowParams): DecisionWindowResult => {
  const intervals = subsequentDecisions.filter((interval) => interval > 0);

  if (intervals.length === 0) {
    return sliceTimestamps({
      timestamps: [firstDecisionTime],
      now,
      pastWindow,
      futureWindow,
    });
  }

  const prefixSums: number[] = [];
  let runningTotal = 0;
  for (const interval of intervals) {
    runningTotal += interval;
    prefixSums.push(runningTotal);
  }
  const cycleLength = runningTotal;

  if (cycleLength <= 0) {
    return sliceTimestamps({
      timestamps: [firstDecisionTime],
      now,
      pastWindow,
      futureWindow,
    });
  }

  const totalDecisions =
    lastDecisionTime == null
      ? null
      : countRollingDecisionsUpTo({
          time: lastDecisionTime,
          firstDecisionTime,
          cycleLength,
          prefixSums,
          subsequentCount: intervals.length,
        });

  const nextIndexRaw = countRollingDecisionsUpTo({
    time: now,
    firstDecisionTime,
    cycleLength,
    prefixSums,
    subsequentCount: intervals.length,
  });
  const nextIndex =
    totalDecisions == null
      ? nextIndexRaw
      : Math.min(nextIndexRaw, Math.max(totalDecisions, 0));

  const pastCount = Math.min(pastWindow, nextIndex);
  const bounds = resolveRollingBounds({
    nextIndex,
    pastWindow,
    futureWindow,
    totalDecisions,
    pastCount,
  });

  const entries = buildRollingEntries({
    startIndex: bounds.startIndex,
    endIndexExclusive: bounds.endIndexExclusive,
    totalDecisions,
    firstDecisionTime,
    cycleLength,
    prefixSums,
    subsequentCount: intervals.length,
  });

  const nextDecisionTimestamp = determineNextRollingTimestamp({
    nextIndex,
    totalDecisions,
    firstDecisionTime,
    cycleLength,
    prefixSums,
    subsequentCount: intervals.length,
  });

  const decisions: DecisionPoint[] = entries.map(({ index, timestamp }) =>
    createDecisionPoint(index, timestamp)
  );

  return {
    decisions,
    hasMorePast: bounds.startIndex > 0,
    hasMoreFuture: bounds.hasMoreFuture,
    nextDecisionTimestamp,
    remainingPastCount: bounds.startIndex,
    remainingFutureCount: bounds.remainingFutureCount,
  };
};

interface ResolveRollingBoundsParams {
  readonly nextIndex: number;
  readonly pastWindow: number;
  readonly futureWindow: number;
  readonly totalDecisions: number | null;
  readonly pastCount: number;
}

interface ResolveRollingBoundsResult {
  readonly startIndex: number;
  readonly endIndexExclusive: number;
  readonly hasMoreFuture: boolean;
  readonly remainingFutureCount: number | null;
}

const resolveRollingBounds = ({
  nextIndex,
  pastWindow,
  futureWindow,
  totalDecisions,
  pastCount,
}: ResolveRollingBoundsParams): ResolveRollingBoundsResult => {
  let startIndex = nextIndex - pastCount;

  if (totalDecisions == null) {
    return {
      startIndex,
      endIndexExclusive: nextIndex + futureWindow,
      hasMoreFuture: true,
      remainingFutureCount: null,
    };
  }

  const availableFuture = Math.max(totalDecisions - nextIndex, 0);
  const futureCount = Math.min(futureWindow, availableFuture);
  const endIndexExclusive = Math.min(nextIndex + futureCount, totalDecisions);

  if (futureCount === 0 && totalDecisions > 0 && startIndex === nextIndex) {
    startIndex = Math.max(0, totalDecisions - pastWindow);
  }

  const remainingFutureCount = Math.max(totalDecisions - endIndexExclusive, 0);

  return {
    startIndex,
    endIndexExclusive,
    hasMoreFuture: endIndexExclusive < totalDecisions,
    remainingFutureCount,
  };
};

interface BuildRollingEntriesParams {
  readonly startIndex: number;
  readonly endIndexExclusive: number;
  readonly totalDecisions: number | null;
  readonly firstDecisionTime: number;
  readonly cycleLength: number;
  readonly prefixSums: readonly number[];
  readonly subsequentCount: number;
}

const buildRollingEntries = ({
  startIndex,
  endIndexExclusive,
  totalDecisions,
  firstDecisionTime,
  cycleLength,
  prefixSums,
  subsequentCount,
}: BuildRollingEntriesParams): Array<{ index: number; timestamp: number }> => {
  const entries: Array<{ index: number; timestamp: number }> = [];

  for (let index = startIndex; index < endIndexExclusive; index++) {
    if (totalDecisions != null && index >= totalDecisions) {
      break;
    }

    entries.push({
      index,
      timestamp: getRollingTimestampForIndex({
        index,
        firstDecisionTime,
        cycleLength,
        prefixSums,
        subsequentCount,
      }),
    });
  }

  return entries;
};

interface DetermineNextRollingTimestampParams {
  readonly nextIndex: number;
  readonly totalDecisions: number | null;
  readonly firstDecisionTime: number;
  readonly cycleLength: number;
  readonly prefixSums: readonly number[];
  readonly subsequentCount: number;
}

const determineNextRollingTimestamp = ({
  nextIndex,
  totalDecisions,
  firstDecisionTime,
  cycleLength,
  prefixSums,
  subsequentCount,
}: DetermineNextRollingTimestampParams): number | null => {
  if (totalDecisions != null && nextIndex >= totalDecisions) {
    return null;
  }

  return getRollingTimestampForIndex({
    index: nextIndex,
    firstDecisionTime,
    cycleLength,
    prefixSums,
    subsequentCount,
  });
};

interface GetRollingTimestampForIndexParams {
  readonly index: number;
  readonly firstDecisionTime: number;
  readonly cycleLength: number;
  readonly prefixSums: readonly number[];
  readonly subsequentCount: number;
}

const getRollingTimestampForIndex = ({
  index,
  firstDecisionTime,
  cycleLength,
  prefixSums,
  subsequentCount,
}: GetRollingTimestampForIndexParams): number => {
  if (index === 0) {
    return firstDecisionTime;
  }

  const offset = index - 1;
  const cycleIndex = offset % subsequentCount;
  const completedCycles = Math.floor(offset / subsequentCount);

  return (
    firstDecisionTime + completedCycles * cycleLength + prefixSums[cycleIndex]!
  );
};

interface CountRollingDecisionsUpToParams {
  readonly time: number;
  readonly firstDecisionTime: number;
  readonly cycleLength: number;
  readonly prefixSums: readonly number[];
  readonly subsequentCount: number;
}

const countRollingDecisionsUpTo = ({
  time,
  firstDecisionTime,
  cycleLength,
  prefixSums,
  subsequentCount,
}: CountRollingDecisionsUpToParams): number => {
  if (time < firstDecisionTime) {
    return 0;
  }

  const elapsed = time - firstDecisionTime;
  const completeCycles = Math.floor(elapsed / cycleLength);
  let count = 1 + completeCycles * subsequentCount;
  const timeIntoCycle = elapsed % cycleLength;

  for (const offset of prefixSums) {
    if (timeIntoCycle >= offset) {
      count++;
    } else {
      break;
    }
  }

  return count;
};

interface SliceTimestampsParams {
  readonly timestamps: number[];
  readonly now: number;
  readonly pastWindow: number;
  readonly futureWindow: number;
}

const sliceTimestamps = ({
  timestamps,
  now,
  pastWindow,
  futureWindow,
}: SliceTimestampsParams): DecisionWindowResult => {
  if (timestamps.length === 0) {
    return {
      decisions: [],
      hasMoreFuture: false,
      hasMorePast: false,
      nextDecisionTimestamp: null,
      remainingPastCount: 0,
      remainingFutureCount: 0,
    };
  }

  const sorted = [...timestamps].sort((a, b) => a - b);
  const total = sorted.length;

  const nextIndex = sorted.findIndex((timestamp) => timestamp > now);
  const effectiveNextIndex = nextIndex === -1 ? sorted.length : nextIndex;

  const pastCount = Math.min(pastWindow, effectiveNextIndex);
  const futureCount = Math.min(
    futureWindow,
    Math.max(sorted.length - effectiveNextIndex, 0)
  );

  const startIndex = effectiveNextIndex - pastCount;
  const endIndexExclusive = effectiveNextIndex + futureCount;

  const decisions = sorted
    .slice(startIndex, endIndexExclusive)
    .map((timestamp, index) => {
      const seriesIndex = startIndex + index;
      return createDecisionPoint(seriesIndex, timestamp);
    });

  const remainingPastCount = startIndex;
  const remainingFutureCount = Math.max(total - endIndexExclusive, 0);

  const hasMorePast = remainingPastCount > 0;
  const hasMoreFuture = remainingFutureCount > 0;

  const nextDecisionTimestamp =
    effectiveNextIndex < sorted.length ? sorted[effectiveNextIndex] ?? null : null;

  return {
    decisions,
    hasMorePast,
    hasMoreFuture,
    nextDecisionTimestamp,
    remainingPastCount,
    remainingFutureCount,
  };
};
