"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  getMemesQuickVoteEligibleDrops,
  sanitizeStoredAmounts,
  sanitizeStoredSerials,
} from "@/hooks/memesQuickVote.helpers";
import {
  readStoredNumberArray,
  useStoredNumberArray,
  writeStoredNumberArray,
} from "@/hooks/memesQuickVote.storageStore";
import { useCallback, useEffect, useMemo } from "react";

const SKIPPED_STORAGE_PREFIX = "memesQuickVoteSkipped";
const AMOUNTS_STORAGE_PREFIX = "memesQuickVoteAmounts";

type UseMemesQuickVoteStorageOptions = {
  readonly drops: readonly ApiDrop[];
  readonly contextProfile: string | null | undefined;
  readonly memesWaveId: string | null | undefined;
};

type UseMemesQuickVoteStorageResult = {
  readonly liveSkippedSerials: number[];
  readonly recentAmountsByRecency: number[];
  readonly setAndPersistRecentAmounts: (
    updater: (current: number[]) => number[]
  ) => void;
  readonly setAndPersistSkippedSerials: (
    updater: (current: number[]) => number[]
  ) => void;
};

const getStorageKey = (
  prefix: string,
  memesWaveId: string | null | undefined,
  contextProfile: string | null | undefined
): string | null => {
  if (!memesWaveId || !contextProfile) {
    return null;
  }

  return `${prefix}:${memesWaveId}:${contextProfile}`;
};

const areNumberArraysEqual = (
  left: readonly number[],
  right: readonly number[]
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

export const useMemesQuickVoteStorage = ({
  drops,
  contextProfile,
  memesWaveId,
}: UseMemesQuickVoteStorageOptions): UseMemesQuickVoteStorageResult => {
  const skippedStorageKey = getStorageKey(
    SKIPPED_STORAGE_PREFIX,
    memesWaveId,
    contextProfile
  );
  const amountsStorageKey = getStorageKey(
    AMOUNTS_STORAGE_PREFIX,
    memesWaveId,
    contextProfile
  );

  const storedSkippedSerials = useStoredNumberArray(
    skippedStorageKey,
    sanitizeStoredSerials
  );
  const recentAmountsByRecency = useStoredNumberArray(
    amountsStorageKey,
    sanitizeStoredAmounts
  );

  const liveEligibleSerials = useMemo(
    () =>
      new Set(
        getMemesQuickVoteEligibleDrops(drops).map((drop) => drop.serial_no)
      ),
    [drops]
  );

  const sanitizeLiveSkippedSerials = useCallback(
    (serials: number[]) =>
      sanitizeStoredSerials(serials).filter((serialNo) =>
        liveEligibleSerials.has(serialNo)
      ),
    [liveEligibleSerials]
  );

  const liveSkippedSerials = useMemo(
    () => sanitizeLiveSkippedSerials(storedSkippedSerials),
    [sanitizeLiveSkippedSerials, storedSkippedSerials]
  );

  useEffect(() => {
    if (areNumberArraysEqual(storedSkippedSerials, liveSkippedSerials)) {
      return;
    }

    writeStoredNumberArray(skippedStorageKey, liveSkippedSerials);
  }, [liveSkippedSerials, skippedStorageKey, storedSkippedSerials]);

  const setAndPersistRecentAmounts = useCallback(
    (updater: (current: number[]) => number[]) => {
      const current = readStoredNumberArray(
        amountsStorageKey,
        sanitizeStoredAmounts
      );
      const next = sanitizeStoredAmounts(updater([...current]));

      if (areNumberArraysEqual(current, next)) {
        return;
      }

      writeStoredNumberArray(amountsStorageKey, next);
    },
    [amountsStorageKey]
  );

  const setAndPersistSkippedSerials = useCallback(
    (updater: (current: number[]) => number[]) => {
      const current = readStoredNumberArray(
        skippedStorageKey,
        sanitizeStoredSerials
      );
      const next = sanitizeLiveSkippedSerials(updater([...current]));

      if (areNumberArraysEqual(current, next)) {
        return;
      }

      writeStoredNumberArray(skippedStorageKey, next);
    },
    [sanitizeLiveSkippedSerials, skippedStorageKey]
  );

  return {
    liveSkippedSerials,
    recentAmountsByRecency,
    setAndPersistRecentAmounts,
    setAndPersistSkippedSerials,
  };
};
