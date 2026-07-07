"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { useCallback, useMemo, useState } from "react";
import {
  getSelectableIdentityOption,
  type SelectableIdentityOption,
} from "../../utils/input/profile-search/getSelectableIdentity";
import {
  getEffectiveIdentitySubmitAttempt,
  getEffectiveSelectedIdentity,
  getIdentitySubmissionScopeKey,
} from "../utils/identitySubmissionState";
import type { IdentityPickerPlacement } from "../dropComposer.types";
import { normalizeIdentityValue } from "./content-helpers";
import type { ConnectedProfile, ScopedValueState } from "./types";

const SELECT_OTHER_IDENTITY_ERROR = "Select someone else to nominate.";

export const useCreateDropIdentityState = ({
  wave,
  submissionExperience,
  connectedProfile,
  isDropMode,
  dropModeSessionEpoch,
  canExitDropMode,
  identityPickerPlacement,
  handleDropModeChange,
}: {
  readonly wave: ApiWave;
  readonly submissionExperience: WaveSubmissionExperience;
  readonly connectedProfile: ConnectedProfile;
  readonly isDropMode: boolean;
  readonly dropModeSessionEpoch: number;
  readonly canExitDropMode: boolean;
  readonly identityPickerPlacement: IdentityPickerPlacement;
  readonly handleDropModeChange: (newIsDropMode: boolean) => void;
}) => {
  const [selectedIdentityState, setSelectedIdentityState] =
    useState<ScopedValueState<SelectableIdentityOption | null> | null>(null);
  const [hasAttemptedIdentitySubmitState, setHasAttemptedIdentitySubmitState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [identityPickerOpenState, setIdentityPickerOpenState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [identityPickerAutoOpenState, setIdentityPickerAutoOpenState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [identityPickerErrorMessageState, setIdentityPickerErrorMessageState] =
    useState<ScopedValueState<string | null> | null>(null);

  const isIdentitySubmissionExperience =
    submissionExperience === WaveSubmissionExperience.IDENTITY;
  const identitySubmissionMode = isIdentitySubmissionExperience
    ? (wave.participation.submission_strategy?.config.who_can_be_submitted ??
      null)
    : null;
  const viewerIdentity = getSelectableIdentityOption(connectedProfile);
  const viewerSelectableIdentity = viewerIdentity?.value ?? null;
  const identitySubmissionScopeKey = getIdentitySubmissionScopeKey({
    waveId: wave.id,
    isIdentitySubmissionExperience,
    identitySubmissionMode,
  });
  const identitySubmissionSessionScopeKey = `${identitySubmissionScopeKey}:${dropModeSessionEpoch}`;
  const isIdentityPickerAllowed =
    isIdentitySubmissionExperience &&
    isDropMode &&
    identitySubmissionMode !== null &&
    identitySubmissionMode !==
      ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself;
  const selectedIdentitySelection = getEffectiveSelectedIdentity({
    isIdentitySubmissionExperience,
    identitySubmissionMode,
    viewerIdentity,
    selectedIdentityState,
    scopeKey: identitySubmissionSessionScopeKey,
  });
  const selectedIdentity = selectedIdentitySelection?.value ?? null;
  const hasAttemptedIdentitySubmit = getEffectiveIdentitySubmitAttempt({
    attemptState: hasAttemptedIdentitySubmitState,
    scopeKey: identitySubmissionSessionScopeKey,
  });
  const isIdentityPickerExplicitlyOpen =
    identityPickerOpenState?.scopeKey === identitySubmissionSessionScopeKey
      ? identityPickerOpenState.value
      : false;
  const isIdentityPickerAutoOpenAllowed =
    identityPickerAutoOpenState?.scopeKey === identitySubmissionSessionScopeKey
      ? identityPickerAutoOpenState.value
      : true;
  const identityPickerErrorMessage =
    identityPickerErrorMessageState?.scopeKey ===
    identitySubmissionSessionScopeKey
      ? identityPickerErrorMessageState.value
      : null;
  const isIdentityPickerOpen =
    isIdentityPickerAllowed &&
    (isIdentityPickerExplicitlyOpen ||
      (!selectedIdentitySelection && isIdentityPickerAutoOpenAllowed));
  const canDismissIdentityPicker =
    selectedIdentitySelection !== null || canExitDropMode;

  const identityValidationMessage = useMemo(() => {
    if (!isIdentitySubmissionExperience || !isDropMode) {
      return null;
    }

    if (
      identitySubmissionMode ===
      ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself
    ) {
      return viewerSelectableIdentity
        ? null
        : "We couldn't determine your identity for this submission.";
    }

    if (!selectedIdentity) {
      return "Select an identity to nominate.";
    }

    if (
      identitySubmissionMode ===
        ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers &&
      normalizeIdentityValue(selectedIdentity) ===
        normalizeIdentityValue(viewerSelectableIdentity)
    ) {
      return SELECT_OTHER_IDENTITY_ERROR;
    }

    return null;
  }, [
    identitySubmissionMode,
    isDropMode,
    isIdentitySubmissionExperience,
    selectedIdentity,
    viewerSelectableIdentity,
  ]);

  const showIdentityValidationMessage =
    !!identityValidationMessage &&
    (hasAttemptedIdentitySubmit ||
      (selectedIdentity !== null &&
        identitySubmissionMode ===
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers) ||
      identitySubmissionMode ===
        ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself);

  const openIdentityPicker = useCallback(() => {
    setIdentityPickerErrorMessageState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: null,
    });
    setIdentityPickerAutoOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: true,
    });
  }, [identitySubmissionSessionScopeKey]);

  const closeIdentityPicker = useCallback(() => {
    if (!selectedIdentitySelection && !canExitDropMode) {
      return;
    }

    setIdentityPickerAutoOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerErrorMessageState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: null,
    });
    if (!selectedIdentitySelection) {
      handleDropModeChange(false);
    }
  }, [
    canExitDropMode,
    handleDropModeChange,
    identitySubmissionSessionScopeKey,
    selectedIdentitySelection,
  ]);

  const closeIdentitySelectionPanel = useCallback(() => {
    setIdentityPickerAutoOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerErrorMessageState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: null,
    });
    handleDropModeChange(false);
  }, [handleDropModeChange, identitySubmissionSessionScopeKey]);

  const handleIdentitySelection = useCallback(
    (selection: SelectableIdentityOption) => {
      if (
        identitySubmissionMode ===
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers &&
        normalizeIdentityValue(selection.value) ===
          normalizeIdentityValue(viewerSelectableIdentity)
      ) {
        setIdentityPickerErrorMessageState({
          scopeKey: identitySubmissionSessionScopeKey,
          value: SELECT_OTHER_IDENTITY_ERROR,
        });
        return;
      }

      setSelectedIdentityState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: selection,
      });
      setIdentityPickerAutoOpenState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: false,
      });
      setHasAttemptedIdentitySubmitState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: false,
      });
      setIdentityPickerErrorMessageState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: null,
      });
      setIdentityPickerOpenState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: false,
      });
    },
    [
      identitySubmissionMode,
      identitySubmissionSessionScopeKey,
      viewerSelectableIdentity,
    ]
  );

  const markIdentitySubmitAttempted = useCallback(() => {
    setHasAttemptedIdentitySubmitState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: true,
    });
  }, [identitySubmissionSessionScopeKey]);

  const disableIdentityPickerAutoOpen = useCallback(() => {
    setIdentityPickerAutoOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
  }, [identitySubmissionSessionScopeKey]);

  const resetIdentitySubmissionState = useCallback(() => {
    setSelectedIdentityState(null);
    setHasAttemptedIdentitySubmitState(null);
    setIdentityPickerOpenState(null);
    setIdentityPickerErrorMessageState(null);
  }, []);

  const shouldShowIdentitySubmissionControls =
    isIdentitySubmissionExperience &&
    isDropMode &&
    identitySubmissionMode !== null;
  const showInlineIdentityPicker =
    shouldShowIdentitySubmissionControls &&
    identityPickerPlacement === "inline" &&
    (!selectedIdentitySelection || isIdentityPickerOpen);
  const showIdentityField =
    shouldShowIdentitySubmissionControls && !showInlineIdentityPicker;
  const showModalIdentityPicker =
    shouldShowIdentitySubmissionControls &&
    identityPickerPlacement === "modal" &&
    identitySubmissionMode !==
      ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself;

  return {
    identitySubmissionMode,
    identitySubmissionSessionScopeKey,
    isIdentitySubmissionExperience,
    isIdentityPickerAllowed,
    selectedIdentitySelection,
    selectedIdentity,
    viewerIdentity,
    identityPickerErrorMessage,
    isIdentityPickerOpen,
    canDismissIdentityPicker,
    identityValidationMessage,
    showIdentityValidationMessage,
    showInlineIdentityPicker,
    showIdentityField,
    showModalIdentityPicker,
    showComposer: !showInlineIdentityPicker,
    openIdentityPicker,
    closeIdentityPicker,
    closeIdentitySelectionPanel,
    handleIdentitySelection,
    markIdentitySubmitAttempted,
    disableIdentityPickerAutoOpen,
    resetIdentitySubmissionState,
  };
};
