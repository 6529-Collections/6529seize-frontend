"use client";

import { sanitizeStoredAmounts } from "@/hooks/memesQuickVote.helpers";
import {
  readStoredNumberArray,
  useStoredNumberArray,
  writeStoredNumberArray,
} from "@/hooks/memesQuickVote.storageStore";
import { useCallback } from "react";

const AMOUNTS_STORAGE_PREFIX = "memesQuickVoteAmounts";

type UseMemesQuickVoteStorageOptions = {
  readonly contextProfile: string | null | undefined;
  readonly memesWaveId: string | null | undefined;
};

type UseMemesQuickVoteStorageResult = {
  readonly recentAmountsByRecency: number[];
  readonly setAndPersistRecentAmounts: (
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
  contextProfile,
  memesWaveId,
}: UseMemesQuickVoteStorageOptions): UseMemesQuickVoteStorageResult => {
  const amountsStorageKey = getStorageKey(
    AMOUNTS_STORAGE_PREFIX,
    memesWaveId,
    contextProfile
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

  return {
    recentAmountsByRecency,
    setAndPersistRecentAmounts,
  };
};
