"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CicStatement } from "@/entities/IProfile";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useReducer } from "react";
import type { MemesSubmissionInitialDraft } from "../utils/submissionDraft";
import {
  createInitialState,
  formReducer,
  type CreateInitialStateInput,
  type ProfileDefaults,
} from "./artworkSubmissionFormState";
import { useArtworkSubmissionFormActions } from "./useArtworkSubmissionFormActions";
import { useArtworkSubmissionMediaControls } from "./useArtworkSubmissionMediaControls";

const getProfileBio = (statements: CicStatement[] | null | undefined): string =>
  statements?.find(
    (statement) =>
      statement.statement_type === STATEMENT_TYPE.BIO &&
      statement.statement_group === STATEMENT_GROUP.GENERAL
  )?.statement_value ?? "";

export function useArtworkSubmissionForm(
  initialDraft?: MemesSubmissionInitialDraft
) {
  const { connectedProfile } = useAuth();
  const isDraftInitialized = Boolean(initialDraft);
  const profileHandle = connectedProfile?.handle ?? "";
  const normalizedProfileHandle = profileHandle.toLowerCase();
  const primaryWallet = connectedProfile?.primary_wallet ?? "";
  const { data: profileStatements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, normalizedProfileHandle],
    queryFn: async () =>
      await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${normalizedProfileHandle}/cic/statements`,
      }),
    enabled: !isDraftInitialized && normalizedProfileHandle.length > 0,
    staleTime: 60_000,
  });
  const aboutArtistDefault = useMemo(
    () => getProfileBio(profileStatements),
    [profileStatements]
  );
  const profileIdentityDefaults = useMemo<ProfileDefaults>(
    () => ({
      handle: profileHandle,
      primaryWallet,
    }),
    [primaryWallet, profileHandle]
  );
  const profileDefaults = useMemo<ProfileDefaults>(
    () => ({
      ...profileIdentityDefaults,
      aboutArtist: aboutArtistDefault,
    }),
    [aboutArtistDefault, profileIdentityDefaults]
  );
  const initialStateInput = useMemo<CreateInitialStateInput>(
    () => ({
      initialDraft,
      profileDefaults: profileIdentityDefaults,
    }),
    [initialDraft, profileIdentityDefaults]
  );

  const [state, dispatch] = useReducer(
    formReducer,
    initialStateInput,
    createInitialState
  );

  const formActions = useArtworkSubmissionFormActions({
    state,
    dispatch,
    profileDefaults,
    shouldApplyProfileDefaults: !isDraftInitialized,
  });
  const mediaControls = useArtworkSubmissionMediaControls({ state, dispatch });

  return {
    currentStep: state.currentStep,
    agreements: state.agreements,
    setAgreements: formActions.setAgreements,
    handleContinueFromTerms: formActions.handleContinueFromTerms,
    handleContinueFromArtwork: formActions.handleContinueFromArtwork,
    handleBackToArtwork: formActions.handleBackToArtwork,

    artworkUploaded: state.artworkUploaded,
    artworkUrl: state.artworkUrl,
    uploadError: state.uploadError,
    selectedFile: state.selectedFile,
    existingMedia: state.existingMedia,
    mediaSource: state.mediaSource,
    externalMediaUrl: state.externalMedia.url,
    externalMediaPreviewUrl: state.externalMedia.previewUrl,
    externalMediaHashInput: state.externalMedia.input,
    externalMediaProvider: state.externalMedia.provider,
    externalMediaMimeType: state.externalMedia.mimeType,
    externalMediaError: state.externalMedia.error,
    externalMediaValidationStatus: state.externalMedia.status,
    isExternalMediaValid: state.externalMedia.isValid,
    setArtworkUploaded: mediaControls.setArtworkUploaded,
    setMediaSource: mediaControls.setMediaSource,
    setExternalMediaHash: mediaControls.setExternalMediaHash,
    setExternalMediaProvider: mediaControls.setExternalMediaProvider,
    setExternalMediaMimeType: mediaControls.setExternalMediaMimeType,
    clearExternalMedia: mediaControls.clearExternalMedia,
    handleFileSelect: mediaControls.handleFileSelect,

    traits: state.traits,
    setTraits: formActions.setTraits,
    updateTraitField: formActions.updateTraitField,
    isAdditionalActionPromised: state.isAdditionalActionPromised,
    setAdditionalActionPromised: formActions.setAdditionalActionPromised,

    operationalData: state.operationalData,
    setAirdropConfig: formActions.setAirdropConfig,
    setPaymentInfo: formActions.setPaymentInfo,
    setAllowlistBatches: formActions.setAllowlistBatches,
    setAdditionalMedia: formActions.setAdditionalMedia,
    setCommentary: formActions.setCommentary,
    setAboutArtist: formActions.setAboutArtist,

    getSubmissionData: formActions.getSubmissionData,
    getMediaSelection: formActions.getMediaSelection,
  };
}

export type ArtworkSubmissionForm = ReturnType<typeof useArtworkSubmissionForm>;
