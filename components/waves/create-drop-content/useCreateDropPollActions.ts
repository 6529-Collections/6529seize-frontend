"use client";

import {
  createDefaultDropPollDraft,
  validateCreateDropPollDraft,
  type CreateDropPollDraft,
} from "../CreateDropPoll";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ScopedValueState } from "./types";

export const useCreateDropPollActions = ({
  canCreatePoll,
  isStormMode,
  locale,
  markdown,
  pollDraft,
  setPollDraftState,
  waveId,
}: {
  readonly canCreatePoll: boolean;
  readonly isStormMode: boolean;
  readonly locale: SupportedLocale;
  readonly markdown: string | null;
  readonly pollDraft: CreateDropPollDraft | null;
  readonly setPollDraftState: Dispatch<
    SetStateAction<ScopedValueState<CreateDropPollDraft> | null>
  >;
  readonly waveId: string;
}) => {
  const [questionTouchedState, setQuestionTouchedState] =
    useState<ScopedValueState<boolean> | null>(null);
  const isPollQuestionTouched =
    questionTouchedState?.scopeKey === waveId && questionTouchedState.value;
  const pollValidation = useMemo(
    () => validateCreateDropPollDraft(pollDraft, locale),
    [locale, pollDraft]
  );
  const isPollQuestionMissing = (markdown?.trim().length ?? 0) === 0;
  const pollQuestionError =
    pollDraft !== null &&
    isPollQuestionMissing &&
    (isPollQuestionTouched || pollValidation.request !== null)
      ? t(locale, "waves.poll.composer.questionRequired")
      : null;

  const togglePoll = useCallback(() => {
    if (!canCreatePoll || (isStormMode && pollDraft === null)) {
      return;
    }

    setQuestionTouchedState({ scopeKey: waveId, value: false });
    setPollDraftState((current) =>
      current?.scopeKey === waveId
        ? null
        : {
            scopeKey: waveId,
            value: createDefaultDropPollDraft(),
          }
    );
  }, [canCreatePoll, isStormMode, pollDraft, setPollDraftState, waveId]);

  const updatePollDraft = useCallback(
    (value: CreateDropPollDraft) => {
      setPollDraftState({ scopeKey: waveId, value });
    },
    [setPollDraftState, waveId]
  );

  const removePoll = useCallback(() => {
    setQuestionTouchedState({ scopeKey: waveId, value: false });
    setPollDraftState(null);
  }, [setPollDraftState, waveId]);

  const markPollQuestionTouched = useCallback(() => {
    if (pollDraft !== null) {
      setQuestionTouchedState({ scopeKey: waveId, value: true });
    }
  }, [pollDraft, waveId]);

  return {
    hasPollValidationError: pollDraft !== null && pollValidation.error !== null,
    hasValidPoll: pollValidation.request !== null,
    markPollQuestionTouched,
    pollQuestionError,
    pollValidation,
    removePoll,
    togglePoll,
    updatePollDraft,
  };
};
