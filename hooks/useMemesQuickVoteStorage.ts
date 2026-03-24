"use client";

import {
  sanitizeStoredAmounts,
  sanitizeStoredDropIds,
} from "@/hooks/memesQuickVote.helpers";
import {
  readStoredNumberArray,
  readStoredStringArray,
  useStoredNumberArray,
  useStoredStringArray,
  writeStoredNumberArray,
  writeStoredStringArray,
} from "@/hooks/memesQuickVote.storageStore";
import { useCallback } from "react";

const SKIPPED_STORAGE_PREFIX = "memesQuickVoteSkipped";
const AMOUNTS_STORAGE_PREFIX = "memesQuickVoteAmounts";

type UseMemesQuickVoteStorageOptions = {
  readonly contextProfile: string | null | undefined;
  readonly memesWaveId: string | null | undefined;
};

type UseMemesQuickVoteStorageResult = {
  readonly skippedDropIds: string[];
  readonly recentAmountsByRecency: number[];
  readonly setAndPersistRecentAmounts: (
    updater: (current: number[]) => number[]
  ) => void;
  readonly setAndPersistSkippedDropIds: (
    updater: (current: string[]) => string[]
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

const areStringArraysEqual = (
  left: readonly string[],
  right: readonly string[]
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

export const useMemesQuickVoteStorage = ({
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

  const skippedDropIds = useStoredStringArray(
    skippedStorageKey,
    sanitizeStoredDropIds
  );
  const recentAmountsByRecency = useStoredNumberArray(
    amountsStorageKey,
    sanitizeStoredAmounts
  );

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

  const setAndPersistSkippedDropIds = useCallback(
    (updater: (current: string[]) => string[]) => {
      const current = readStoredStringArray(
        skippedStorageKey,
        sanitizeStoredDropIds
      );
      const next = sanitizeStoredDropIds(updater([...current]));

      if (areStringArraysEqual(current, next)) {
        return;
      }

      writeStoredStringArray(skippedStorageKey, next);
    },
    [skippedStorageKey]
  );

  return {
    skippedDropIds,
    recentAmountsByRecency,
    setAndPersistRecentAmounts,
    setAndPersistSkippedDropIds,
  };
};
