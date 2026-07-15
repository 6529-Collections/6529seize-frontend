"use client";

import {
  createDefaultDropPollDraft,
  type CreateDropPollDraft,
} from "../CreateDropPoll";
import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ScopedValueState } from "./types";

export const useCreateDropPollActions = ({
  canCreatePoll,
  setPollDraftState,
  waveId,
}: {
  readonly canCreatePoll: boolean;
  readonly setPollDraftState: Dispatch<
    SetStateAction<ScopedValueState<CreateDropPollDraft> | null>
  >;
  readonly waveId: string;
}) => {
  const togglePoll = useCallback(() => {
    if (!canCreatePoll) {
      return;
    }

    setPollDraftState((current) =>
      current?.scopeKey === waveId
        ? null
        : {
            scopeKey: waveId,
            value: createDefaultDropPollDraft(),
          }
    );
  }, [canCreatePoll, setPollDraftState, waveId]);

  const updatePollDraft = useCallback(
    (value: CreateDropPollDraft) => {
      setPollDraftState({ scopeKey: waveId, value });
    },
    [setPollDraftState, waveId]
  );

  const removePoll = useCallback(() => {
    setPollDraftState(null);
  }, [setPollDraftState]);

  return { removePoll, togglePoll, updatePollDraft };
};
