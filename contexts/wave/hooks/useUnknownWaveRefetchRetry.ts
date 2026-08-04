"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_UNKNOWN_WAVE_REFETCH_ATTEMPTS = 3;

interface UnknownWaveCount {
  readonly count: number;
}

interface UseUnknownWaveRefetchRetryParams {
  readonly cooldownMs: number;
  readonly enabled: boolean;
  readonly identityKey: string | null | undefined;
  readonly ownWaveIds: ReadonlySet<string>;
  readonly otherListWaveIds: ReadonlySet<string>;
  readonly rawCounts: Readonly<Record<string, UnknownWaveCount>>;
  readonly refetchWaves: () => void;
}

const useUnknownWaveRefetchRetry = ({
  cooldownMs,
  enabled,
  identityKey,
  ownWaveIds,
  otherListWaveIds,
  rawCounts,
  refetchWaves,
}: UseUnknownWaveRefetchRetryParams): ((
  waveId: string,
  receivedAt: number
) => void) => {
  const attemptsRef = useRef(new Map<string, number>());
  const lastRefetchAtRef = useRef(new Map<string, number>());
  const ownWaveIdsRef = useRef(ownWaveIds);
  const otherListWaveIdsRef = useRef(otherListWaveIds);
  const [retryRevision, setRetryRevision] = useState(0);

  useEffect(() => {
    ownWaveIdsRef.current = enabled ? ownWaveIds : new Set();
    otherListWaveIdsRef.current = enabled ? otherListWaveIds : new Set();
  }, [enabled, otherListWaveIds, ownWaveIds]);

  useEffect(() => {
    attemptsRef.current.clear();
    lastRefetchAtRef.current.clear();
  }, [enabled, identityKey]);

  const requestRefetch = useCallback(
    (waveId: string, receivedAt: number) => {
      if (!enabled || ownWaveIds.has(waveId) || otherListWaveIds.has(waveId)) {
        return;
      }

      const attempts = attemptsRef.current.get(waveId) ?? 0;
      const lastRefetchAt = lastRefetchAtRef.current.get(waveId);
      if (
        attempts >= MAX_UNKNOWN_WAVE_REFETCH_ATTEMPTS ||
        (lastRefetchAt !== undefined && receivedAt - lastRefetchAt < cooldownMs)
      ) {
        return;
      }

      attemptsRef.current.set(waveId, attempts + 1);
      lastRefetchAtRef.current.set(waveId, receivedAt);
      refetchWaves();
      setRetryRevision((revision) => revision + 1);
    },
    [cooldownMs, enabled, otherListWaveIds, ownWaveIds, refetchWaves]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unresolvedWaveIds = Object.entries(rawCounts)
      .filter(
        ([waveId, count]) =>
          count.count > 0 &&
          !ownWaveIds.has(waveId) &&
          !otherListWaveIds.has(waveId)
      )
      .map(([waveId]) => waveId);
    const unresolvedWaveIdSet = new Set(unresolvedWaveIds);

    for (const waveId of attemptsRef.current.keys()) {
      if (!unresolvedWaveIdSet.has(waveId)) {
        attemptsRef.current.delete(waveId);
        lastRefetchAtRef.current.delete(waveId);
      }
    }

    const retryableWaveIds = unresolvedWaveIds.filter(
      (waveId) =>
        (attemptsRef.current.get(waveId) ?? 0) <
        MAX_UNKNOWN_WAVE_REFETCH_ATTEMPTS
    );
    if (retryableWaveIds.length === 0) {
      return;
    }

    const now = Date.now();
    const nextRetryAt = Math.min(
      ...retryableWaveIds.map(
        (waveId) => (lastRefetchAtRef.current.get(waveId) ?? now) + cooldownMs
      )
    );
    const timeout = globalThis.setTimeout(
      () => {
        const retryStartedAt = Date.now();
        const waveIdsToRetry = retryableWaveIds.filter(
          (waveId) =>
            !ownWaveIdsRef.current.has(waveId) &&
            !otherListWaveIdsRef.current.has(waveId) &&
            (attemptsRef.current.get(waveId) ?? 0) <
              MAX_UNKNOWN_WAVE_REFETCH_ATTEMPTS
        );
        if (waveIdsToRetry.length === 0) {
          return;
        }

        waveIdsToRetry.forEach((waveId) => {
          attemptsRef.current.set(
            waveId,
            (attemptsRef.current.get(waveId) ?? 0) + 1
          );
          lastRefetchAtRef.current.set(waveId, retryStartedAt);
        });
        refetchWaves();
        setRetryRevision((revision) => revision + 1);
      },
      Math.max(nextRetryAt - now, 0)
    );

    return () => globalThis.clearTimeout(timeout);
  }, [
    cooldownMs,
    enabled,
    otherListWaveIds,
    ownWaveIds,
    rawCounts,
    refetchWaves,
    retryRevision,
  ]);

  return requestRefetch;
};

export default useUnknownWaveRefetchRetry;
