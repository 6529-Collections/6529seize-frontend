import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiWave } from "../../generated/models/ApiWave";
import { DecisionPoint } from "../../helpers/waves/time.types";
import {
  calculateLastDecisionTime,
  FALLBACK_END_TIME,
} from "../../helpers/waves/time.utils";
import { Time } from "../../helpers/time";

const DEFAULT_PAST_WINDOW = 6;
const DEFAULT_FUTURE_WINDOW = 10;
const DEFAULT_WINDOW_STEP = 6;

interface UseDecisionPointsOptions {
  readonly initialPastWindow?: number;
  readonly initialFutureWindow?: number;
  readonly windowStep?: number;
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
  if (subsequentDecisions.length === 0) {
    return sliceTimestamps({
      timestamps: [firstDecisionTime],
      now,
      pastWindow,
      futureWindow,
    });
  }

  const prefixSums: number[] = [];
  subsequentDecisions.reduce((acc, interval) => {
    const next = acc + interval;
    prefixSums.push(next);
    return next;
  }, 0);

  const cycleLength = prefixSums[prefixSums.length - 1];
  if (cycleLength <= 0) {
    return sliceTimestamps({
      timestamps: [firstDecisionTime],
      now,
      pastWindow,
      futureWindow,
    });
  }

  const countDecisionsUpTo = (time: number): number => {
    if (time < firstDecisionTime) {
      return 0;
    }

    const elapsed = time - firstDecisionTime;
    const completeCycles = Math.floor(elapsed / cycleLength);
    let count = 1 + completeCycles * subsequentDecisions.length;
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

  const totalDecisions =
    lastDecisionTime == null
      ? null
      : countDecisionsUpTo(lastDecisionTime);

  const nextIndexRaw = countDecisionsUpTo(now);
  const nextIndex =
    totalDecisions == null
      ? nextIndexRaw
      : Math.min(nextIndexRaw, Math.max(totalDecisions, 0));

  const availablePast = nextIndex;
  const pastCount = Math.min(pastWindow, availablePast);
  let startIndex = nextIndex - pastCount;

  let futureEndExclusive: number;
  if (totalDecisions == null) {
    futureEndExclusive = nextIndex + futureWindow;
  } else {
    const availableFuture = Math.max(totalDecisions - nextIndex, 0);
    const futureCount = Math.min(futureWindow, availableFuture);
    futureEndExclusive = nextIndex + futureCount;
    futureEndExclusive = Math.min(futureEndExclusive, totalDecisions);

    if (futureCount === 0 && totalDecisions > 0 && startIndex === nextIndex) {
      startIndex = Math.max(0, totalDecisions - pastWindow);
    }
  }

  const entries: Array<{ index: number; timestamp: number }> = [];
  const getTimestampForIndex = (index: number): number => {
    if (index === 0) {
      return firstDecisionTime;
    }

    const offset = index - 1;
    const cycleIndex = offset % subsequentDecisions.length;
    const completedCycles = Math.floor(offset / subsequentDecisions.length);
    return (
      firstDecisionTime +
      completedCycles * cycleLength +
      prefixSums[cycleIndex]
    );
  };

  const endIndexExclusive = futureEndExclusive;

  for (let index = startIndex; index < endIndexExclusive; index++) {
    if (totalDecisions != null && index >= totalDecisions) {
      break;
    }
    entries.push({ index, timestamp: getTimestampForIndex(index) });
  }

  const hasMorePast = startIndex > 0;
  const hasMoreFuture =
    totalDecisions == null ? true : endIndexExclusive < totalDecisions;

  const nextDecisionTimestamp =
    totalDecisions == null
      ? getTimestampForIndex(nextIndex)
      : nextIndex < totalDecisions
      ? getTimestampForIndex(nextIndex)
      : null;

  const decisions: DecisionPoint[] = entries.map(({ index, timestamp }) =>
    createDecisionPoint(index, timestamp)
  );

  const remainingPastCount = startIndex;
  const remainingFutureCount =
    totalDecisions == null
      ? null
      : Math.max(totalDecisions - endIndexExclusive, 0);

  return {
    decisions,
    hasMorePast,
    hasMoreFuture,
    nextDecisionTimestamp,
    remainingPastCount,
    remainingFutureCount,
  };
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
    effectiveNextIndex < sorted.length ? sorted[effectiveNextIndex] : null;

  return {
    decisions,
    hasMorePast,
    hasMoreFuture,
    nextDecisionTimestamp,
    remainingPastCount,
    remainingFutureCount,
  };
};
