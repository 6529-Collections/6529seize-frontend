"use client";

import { useCallback, useContext, useState } from "react";
import type { SetStateAction } from "react";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";

interface AppliedDropState {
  readonly baseDropId: string;
  readonly baseRating: number;
  readonly drop: ApiDrop;
}

interface VoteDraftState {
  readonly sourceKey: string;
  readonly value: number | string;
}

interface UseSingleWaveDropVoteStateParams {
  readonly drop: ApiDrop;
}

interface UseSingleWaveDropVoteStateResult {
  readonly displayDrop: ApiDrop;
  readonly minRating: number;
  readonly maxRating: number;
  readonly voteValue: number | string;
  readonly setVoteValue: (nextValue: SetStateAction<string | number>) => void;
  readonly submitVoteValue: number;
  readonly submitBlockReason: string | null;
  readonly handleSliderValueAccepted: (acceptedValue: number) => void;
  readonly handleVoteApplied: (updatedDrop: ApiDrop) => void;
  readonly handleBackgroundVoteApplied: () => void;
}

const getEffectiveMinRating = (drop: ApiDrop): number => {
  const rawMinRating = drop.context_profile_context?.min_rating ?? 0;

  if (drop.wave.forbid_negative_votes) {
    return Math.max(0, rawMinRating);
  }

  return rawMinRating;
};

const clampVoteValue = (
  value: number,
  minRating: number,
  maxRating: number
): number => Math.min(Math.max(value, minRating), maxRating);

const normalizeDraftValue = (
  value: string | number,
  minRating: number,
  maxRating: number
): string | number => {
  if (value === "" || value === "-") {
    return value;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return clampVoteValue(numericValue, minRating, maxRating);
};

const getSubmitVoteValue = (
  value: string | number,
  shouldClamp: boolean,
  minRating: number,
  maxRating: number
): number => {
  if (value === "" || value === "-") {
    return Number.NaN;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return numericValue;
  }

  return shouldClamp
    ? clampVoteValue(numericValue, minRating, maxRating)
    : numericValue;
};

export const useSingleWaveDropVoteState = ({
  drop,
}: UseSingleWaveDropVoteStateParams): UseSingleWaveDropVoteStateResult => {
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const [appliedDropState, setAppliedDropState] =
    useState<AppliedDropState | null>(null);
  const [voteDraftState, setVoteDraftState] = useState<VoteDraftState | null>(
    null
  );

  const baseRating = drop.context_profile_context?.rating ?? 0;
  const displayDrop =
    appliedDropState?.baseDropId === drop.id &&
    appliedDropState.baseRating === baseRating
      ? appliedDropState.drop
      : drop;
  const currentVoteValue = displayDrop.context_profile_context?.rating ?? 0;
  const minRating = getEffectiveMinRating(displayDrop);
  const maxRating = displayDrop.context_profile_context?.max_rating ?? 0;
  const voteSourceKey = `${displayDrop.id}:${currentVoteValue}:${minRating}:${maxRating}`;
  const activeVoteDraft =
    voteDraftState !== null && voteDraftState.sourceKey === voteSourceKey
      ? voteDraftState
      : null;
  const hasVoteDraft = activeVoteDraft !== null;
  const voteValue = activeVoteDraft?.value ?? currentVoteValue;
  const submitVoteValue = getSubmitVoteValue(
    voteValue,
    hasVoteDraft,
    minRating,
    maxRating
  );
  const loadedVoteOutOfRange =
    !hasVoteDraft &&
    (currentVoteValue < minRating || currentVoteValue > maxRating);
  const submitBlockReason = loadedVoteOutOfRange
    ? "Change this vote before submitting."
    : null;

  const setVoteValue = useCallback(
    (nextValue: SetStateAction<string | number>) => {
      setVoteDraftState((current) => {
        const previousValue =
          current?.sourceKey === voteSourceKey
            ? current.value
            : currentVoteValue;
        const value =
          typeof nextValue === "function"
            ? nextValue(previousValue)
            : nextValue;

        return {
          sourceKey: voteSourceKey,
          value: normalizeDraftValue(value, minRating, maxRating),
        };
      });
    },
    [currentVoteValue, maxRating, minRating, voteSourceKey]
  );

  const handleSliderValueAccepted = useCallback(
    (acceptedValue: number) => {
      if (!loadedVoteOutOfRange) {
        return;
      }

      setVoteValue(acceptedValue);
    },
    [loadedVoteOutOfRange, setVoteValue]
  );

  const handleVoteApplied = useCallback(
    (updatedDrop: ApiDrop) => {
      setAppliedDropState({
        baseDropId: drop.id,
        baseRating,
        drop: updatedDrop,
      });
      setVoteDraftState(null);
      invalidateDrops();
    },
    [baseRating, drop.id, invalidateDrops]
  );

  const handleBackgroundVoteApplied = useCallback(() => {
    invalidateDrops();
  }, [invalidateDrops]);

  return {
    displayDrop,
    minRating,
    maxRating,
    voteValue,
    setVoteValue,
    submitVoteValue,
    submitBlockReason,
    handleSliderValueAccepted,
    handleVoteApplied,
    handleBackgroundVoteApplied,
  };
};
