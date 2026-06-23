"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MemesArtSubmissionShell } from "./MemesArtSubmissionShell";
import { MemesArtSubmissionStepContent } from "./MemesArtSubmissionStepContent";
import { ResubmitAcknowledgement } from "./ResubmitAcknowledgement";
import { ResubmitDeleteConfirmation } from "./ResubmitDeleteConfirmation";
import { useArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";
import { useArtworkSubmissionMutation } from "./hooks/useArtworkSubmissionMutation";
import { useResubmissionDelete } from "./hooks/useResubmissionDelete";
import type { SubmissionPhase } from "./ui/SubmissionProgress";
import { buildPreviewDrop } from "./utils/buildPreviewDrop";
import { buildMemesSubmissionDraftFromDrop } from "./utils/submissionDraft";

interface MemesArtSubmissionContainerProps {
  readonly onClose: () => void;
  readonly wave: ApiWave;
  readonly sourceDrop?: ExtendedDrop | undefined;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

/**
 * MemesArtSubmissionContainer - Main container component for the artwork submission flow
 *
 * This component has been simplified by:
 * 1. Moving form state management to a custom hook with reducer pattern
 * 2. Extracting the modal layout to a separate component
 * 3. Using an enum with a component map for cleaner step routing
 * 4. Using direct component composition instead of component injection
 * 5. Using a separate mutation hook for API submission
 * 6. Using a dedicated progress component for visual feedback
 */
const MemesArtSubmissionContainer: FC<MemesArtSubmissionContainerProps> = ({
  onClose,
  wave,
  sourceDrop,
  onSourceDropDeleted,
}) => {
  const initialDraft = useMemo(
    () =>
      sourceDrop ? buildMemesSubmissionDraftFromDrop(sourceDrop) : undefined,
    [sourceDrop]
  );
  const isResubmission = Boolean(sourceDrop);
  const submitLabel = isResubmission ? "Submit New Version" : "Submit Artwork";
  const [hasAcknowledgedResubmission, setHasAcknowledgedResubmission] =
    useState(!isResubmission);

  // Use the form hook to manage all state
  const form = useArtworkSubmissionForm(initialDraft);
  const { handleBackToArtwork, setAdditionalMedia } = form;
  const { connectedProfile } = useAuth();
  const { isSafeWallet, address } = useSeizeConnectContext();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewDrop, setPreviewDrop] = useState<ExtendedDrop | null>(null);

  // Use the mutation hook for submission
  const {
    submitArtwork,
    uploadProgress,
    submissionPhase,
    submissionError,
    isSubmitting,
  } = useArtworkSubmissionMutation();
  const {
    replacementDrop,
    isDeletingOriginal,
    deleteOriginalError,
    handleResubmissionSuccess,
    handleDeleteOriginalClick,
    handleKeepBoth,
  } = useResubmissionDelete({
    sourceDrop,
    onClose,
    onSourceDropDeleted,
  });

  // Auto-close on successful submission after a short delay
  useEffect(() => {
    if (isResubmission) return;
    if (submissionPhase !== "success") return;
    const timer = setTimeout(() => {
      onClose();
    }, 1200); // Brief delay to show success state

    return () => clearTimeout(timer);
  }, [isResubmission, submissionPhase, onClose]);

  const resetPreviewState = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewDrop(null);
  }, []);

  const handleArtworkCommentaryMediaChange = useCallback(
    (media: string[]) => {
      setAdditionalMedia({ artwork_commentary_media: media });
    },
    [setAdditionalMedia]
  );

  const handlePreviewImageChange = useCallback(
    (url: string) => {
      setAdditionalMedia({ preview_image: url });
    },
    [setAdditionalMedia]
  );

  const handlePromoVideoChange = useCallback(
    (url: string) => {
      setAdditionalMedia({ promo_video: url });
    },
    [setAdditionalMedia]
  );

  // Phase change handler
  const handlePhaseChange = useCallback((phase: SubmissionPhase) => {
    // Any additional phase-specific handling can be done here
    console.warn(`Submission phase changed to: ${phase}`);
  }, []);

  const handleOpenPreview = useCallback(() => {
    const {
      imageUrl,
      traits,
      operationalData,
      isAdditionalActionPromised,
    } = form.getSubmissionData();
    const media = form.getMediaSelection();

    setPreviewDrop(
      buildPreviewDrop({
        wave,
        traits,
        operationalData,
        isAdditionalActionPromised,
        mediaSelection: media,
        uploadArtworkUrl: imageUrl,
        connectedProfile,
      })
    );
    setIsPreviewMode(true);
  }, [connectedProfile, form, wave]);

  const handleBackToEdit = useCallback(() => {
    setIsPreviewMode(false);
  }, []);

  const handleBackFromAdditionalInfo = useCallback(() => {
    resetPreviewState();
    handleBackToArtwork();
  }, [handleBackToArtwork, resetPreviewState]);

  const handleResubmissionSubmitted = useCallback(
    async (drop: ApiDrop) => {
      await handleResubmissionSuccess(drop);
      resetPreviewState();
    },
    [handleResubmissionSuccess, resetPreviewState]
  );

  // Handle final submission
  const handleSubmit = useCallback(async () => {
    // Get submission data including all traits
    const { traits, operationalData, isAdditionalActionPromised } =
      form.getSubmissionData();
    const media = form.getMediaSelection();
    const onSubmitted = async (drop: ApiDrop | null) => {
      if (drop && isResubmission) {
        await handleResubmissionSubmitted(drop);
      }

      return drop;
    };

    if (media.mediaSource === "upload") {
      if (!media.selectedFile && !media.existingMedia) {
        return null;
      }

      const result = await submitArtwork(
        {
          ...(media.selectedFile ? { imageFile: media.selectedFile } : {}),
          ...(media.existingMedia
            ? { existingMedia: media.existingMedia }
            : {}),
          traits,
          operationalData,
          isAdditionalActionPromised,
          waveId: wave.id,
          termsOfService: wave.participation.terms,
        },
        address ?? "",
        isSafeWallet,
        {
          onPhaseChange: handlePhaseChange,
        }
      );
      return onSubmitted(result);
    }

    if (!media.isExternalValid) {
      return null;
    }

    const result = await submitArtwork(
      {
        externalMedia: {
          url: media.externalUrl,
          mimeType: media.externalMimeType,
        },
        traits,
        operationalData,
        isAdditionalActionPromised,
        waveId: wave.id,
        termsOfService: wave.participation.terms,
      },
      address ?? "",
      isSafeWallet,
      {
        onPhaseChange: handlePhaseChange,
      }
    );
    return onSubmitted(result);
  }, [
    form,
    handlePhaseChange,
    handleResubmissionSubmitted,
    isResubmission,
    address,
    isSafeWallet,
    submitArtwork,
    wave.id,
    wave.participation.terms,
  ]);

  const handleSubmitClick = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  const handleAcceptResubmissionAcknowledgement = useCallback(() => {
    setHasAcknowledgedResubmission(true);
  }, []);

  const shellDescription =
    isResubmission && hasAcknowledgedResubmission && !replacementDrop
      ? "Resubmitting creates a new submission with this data, then asks you to confirm deleting the original."
      : undefined;

  let submissionContent: ReactNode;

  if (isResubmission && !hasAcknowledgedResubmission) {
    submissionContent = (
      <ResubmitAcknowledgement
        onAccept={handleAcceptResubmissionAcknowledgement}
        onCancel={onClose}
      />
    );
  } else if (sourceDrop && replacementDrop) {
    submissionContent = (
      <ResubmitDeleteConfirmation
        originalDrop={sourceDrop}
        replacementDrop={replacementDrop}
        isDeleting={isDeletingOriginal}
        error={deleteOriginalError}
        onDeleteOriginal={handleDeleteOriginalClick}
        onKeepBoth={handleKeepBoth}
      />
    );
  } else {
    submissionContent = (
      <MemesArtSubmissionStepContent
        form={form}
        wave={wave}
        isPreviewMode={isPreviewMode}
        previewDrop={previewDrop}
        isSubmitting={isSubmitting}
        submissionPhase={submissionPhase}
        uploadProgress={uploadProgress}
        submissionError={submissionError}
        submitLabel={submitLabel}
        onClose={onClose}
        onBackToEdit={handleBackToEdit}
        onBackFromAdditionalInfo={handleBackFromAdditionalInfo}
        onOpenPreview={handleOpenPreview}
        onSubmitClick={handleSubmitClick}
        onArtworkCommentaryMediaChange={handleArtworkCommentaryMediaChange}
        onPreviewImageChange={handlePreviewImageChange}
        onPromoVideoChange={handlePromoVideoChange}
      />
    );
  }

  return (
    <MemesArtSubmissionShell
      title={
        isResubmission
          ? "Resubmit Work to The Memes"
          : "Submit Work to The Memes"
      }
      description={shellDescription}
      onClose={onClose}
    >
      {submissionContent}
    </MemesArtSubmissionShell>
  );
};

export default MemesArtSubmissionContainer;
