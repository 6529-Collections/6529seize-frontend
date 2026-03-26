"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { isMemesQuickVoteMissingDropError } from "@/hooks/memesQuickVote.errors";
import {
  isMemesQuickVoteDiscoverableDrop,
  sanitizeStoredAmounts,
  sanitizeStoredDropIds,
} from "@/hooks/memesQuickVote.helpers";
import { getMemesQuickVoteDropQueryKey } from "@/hooks/memesQuickVote.query";
import {
  readStoredNumberArray,
  readStoredStringArray,
  useStoredNumberArray,
  useStoredStringArray,
  writeStoredNumberArray,
  writeStoredStringArray,
} from "@/hooks/memesQuickVote.storageStore";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

const SKIPPED_STORAGE_PREFIX = "memesQuickVoteSkipped";
const AMOUNTS_STORAGE_PREFIX = "memesQuickVoteAmounts";

type UseMemesQuickVoteStorageOptions = {
  readonly contextProfile: string | null | undefined;
  readonly memesWaveId: string | null | undefined;
  readonly proxyId?: string | null | undefined;
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

type UseMemesQuickVoteSkippedDropIdsResult = Pick<
  UseMemesQuickVoteStorageResult,
  "setAndPersistSkippedDropIds" | "skippedDropIds"
>;

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

export const useMemesQuickVoteSkippedDropIds = ({
  contextProfile,
  memesWaveId,
  proxyId,
}: UseMemesQuickVoteStorageOptions): UseMemesQuickVoteSkippedDropIdsResult => {
  const queryClient = useQueryClient();
  const skippedStorageKey = getStorageKey(
    SKIPPED_STORAGE_PREFIX,
    memesWaveId,
    contextProfile
  );
  const storedSkippedDropIds = useStoredStringArray(
    skippedStorageKey,
    sanitizeStoredDropIds
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
  const skippedDropIds = useMemo(
    () =>
      storedSkippedDropIds.filter((dropId) => {
        const queryKey = getMemesQuickVoteDropQueryKey({
          contextProfile,
          dropId,
          proxyId,
        });
        const cachedDrop = queryClient.getQueryData<ApiDrop>(queryKey);

        if (cachedDrop !== undefined) {
          return isMemesQuickVoteDiscoverableDrop({
            drop: cachedDrop,
            waveId: memesWaveId,
          });
        }

        const queryState = queryClient.getQueryState(queryKey);

        if (queryState?.status !== "error") {
          return true;
        }

        return !isMemesQuickVoteMissingDropError(queryState.error);
      }),
    [
      contextProfile,
      memesWaveId,
      proxyId,
      queryClient,
      storedSkippedDropIds,
    ]
  );

  return {
    setAndPersistSkippedDropIds,
    skippedDropIds,
  };
};

export const useMemesQuickVoteStorage = ({
  contextProfile,
  memesWaveId,
  proxyId,
}: UseMemesQuickVoteStorageOptions): UseMemesQuickVoteStorageResult => {
  const amountsStorageKey = getStorageKey(
    AMOUNTS_STORAGE_PREFIX,
    memesWaveId,
    contextProfile
  );
  const { setAndPersistSkippedDropIds, skippedDropIds } =
    useMemesQuickVoteSkippedDropIds({
      contextProfile,
      memesWaveId,
      proxyId,
    });
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
    skippedDropIds,
    recentAmountsByRecency,
    setAndPersistRecentAmounts,
    setAndPersistSkippedDropIds,
  };
};
