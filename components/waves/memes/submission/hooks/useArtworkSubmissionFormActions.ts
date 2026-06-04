"use client";

import type { Dispatch } from "react";
import { useCallback } from "react";
import type {
  AdditionalMedia,
  AirdropEntry,
  AllowlistBatchRaw,
  PaymentInfo,
} from "../types/OperationalData";
import { SubmissionStep } from "../types/Steps";
import type { TraitsData } from "../types/TraitsData";
import type {
  FormAction,
  FormState,
  ProfileDefaults,
} from "./artworkSubmissionFormState";

interface UseArtworkSubmissionFormActionsParams {
  readonly state: FormState;
  readonly dispatch: Dispatch<FormAction>;
  readonly profileDefaults?: ProfileDefaults | undefined;
  readonly shouldApplyProfileDefaults?: boolean | undefined;
}

export function useArtworkSubmissionFormActions({
  state,
  dispatch,
  profileDefaults,
  shouldApplyProfileDefaults = true,
}: UseArtworkSubmissionFormActionsParams) {
  const applyProfileDefaults = useCallback(() => {
    if (!shouldApplyProfileDefaults) {
      return;
    }

    dispatch({
      type: "APPLY_PROFILE_DEFAULTS",
      payload: profileDefaults ?? {},
    });
  }, [dispatch, profileDefaults, shouldApplyProfileDefaults]);

  const handleContinueFromTerms = useCallback(() => {
    applyProfileDefaults();
    dispatch({ type: "SET_STEP", payload: SubmissionStep.ARTWORK });
  }, [applyProfileDefaults, dispatch]);

  const handleContinueFromArtwork = useCallback(() => {
    applyProfileDefaults();
    dispatch({ type: "SET_STEP", payload: SubmissionStep.ADDITIONAL_INFO });
  }, [applyProfileDefaults, dispatch]);

  const handleBackToArtwork = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: SubmissionStep.ARTWORK });
  }, [dispatch]);

  const setAgreements = useCallback(
    (value: boolean) => {
      dispatch({ type: "SET_AGREEMENTS", payload: value });
    },
    [dispatch]
  );

  const setAdditionalActionPromised = useCallback(
    (value: boolean) => {
      dispatch({ type: "SET_ADDITIONAL_ACTION_PROMISED", payload: value });
    },
    [dispatch]
  );

  const updateTraitField = useCallback(
    <K extends keyof TraitsData>(field: K, value: TraitsData[K]) => {
      dispatch({
        type: "SET_TRAIT_FIELD",
        payload: { field, value },
      });
    },
    [dispatch]
  );

  const setTraits = useCallback(
    (traitsUpdate: Partial<TraitsData>) => {
      dispatch({ type: "SET_MULTIPLE_TRAITS", payload: traitsUpdate });
    },
    [dispatch]
  );

  const setAirdropConfig = useCallback(
    (entries: AirdropEntry[]) => {
      dispatch({ type: "SET_AIRDROP_CONFIG", payload: entries });
    },
    [dispatch]
  );

  const setPaymentInfo = useCallback(
    (paymentInfo: PaymentInfo) => {
      dispatch({ type: "SET_PAYMENT_INFO", payload: paymentInfo });
    },
    [dispatch]
  );

  const setAllowlistBatches = useCallback(
    (batches: AllowlistBatchRaw[]) => {
      dispatch({ type: "SET_ALLOWLIST_BATCHES", payload: batches });
    },
    [dispatch]
  );

  const setAdditionalMedia = useCallback(
    (additionalMedia: Partial<AdditionalMedia>) => {
      dispatch({ type: "SET_ADDITIONAL_MEDIA", payload: additionalMedia });
    },
    [dispatch]
  );

  const setCommentary = useCallback(
    (commentary: string) => {
      dispatch({ type: "SET_COMMENTARY", payload: commentary });
    },
    [dispatch]
  );

  const setAboutArtist = useCallback(
    (aboutArtist: string) => {
      dispatch({ type: "SET_ABOUT_ARTIST", payload: aboutArtist });
    },
    [dispatch]
  );

  const getSubmissionData = useCallback(() => {
    const {
      artworkUrl,
      isAdditionalActionPromised,
      operationalData,
      traits,
    } = state;
    return {
      imageUrl: artworkUrl,
      traits: {
        ...traits,
        title: traits.title,
        description: traits.description,
      },
      operationalData,
      isAdditionalActionPromised,
    };
  }, [state]);

  const getMediaSelection = useCallback(
    () => ({
      mediaSource: state.mediaSource,
      selectedFile: state.selectedFile,
      existingMedia: state.existingMedia,
      externalUrl: state.externalMedia.url,
      externalPreviewUrl: state.externalMedia.previewUrl,
      externalProvider: state.externalMedia.provider,
      externalHash: state.externalMedia.sanitizedHash,
      externalMimeType: state.externalMedia.mimeType,
      isExternalValid: state.externalMedia.isValid,
    }),
    [state]
  );

  return {
    getMediaSelection,
    getSubmissionData,
    handleBackToArtwork,
    handleContinueFromArtwork,
    handleContinueFromTerms,
    setAboutArtist,
    setAdditionalActionPromised,
    setAdditionalMedia,
    setAgreements,
    setAirdropConfig,
    setAllowlistBatches,
    setCommentary,
    setPaymentInfo,
    setTraits,
    updateTraitField,
  };
}
