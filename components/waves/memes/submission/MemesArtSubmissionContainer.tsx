"use client";

import React, { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { SubmissionStep } from "./types/Steps";
import AgreementStep from "./steps/AgreementStep";
import ArtworkStep from "./steps/ArtworkStep";
import { useArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";
import { useArtworkSubmissionMutation } from "./hooks/useArtworkSubmissionMutation";
import { SubmissionPhase } from "./ui/SubmissionProgress";
import { ApiWave } from "@/generated/models/ApiWave";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

interface MemesArtSubmissionContainerProps {
  readonly onClose: () => void;
  readonly wave: ApiWave;
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
const MemesArtSubmissionContainer: React.FC<
  MemesArtSubmissionContainerProps
> = ({ onClose, wave }) => {
  // Use the form hook to manage all state
  const form = useArtworkSubmissionForm();
  const { isSafeWallet, address } = useSeizeConnectContext();

  // Use the mutation hook for submission
  const {
    submitArtwork,
    uploadProgress,
    submissionPhase,
    submissionError,
    isSubmitting,
  } = useArtworkSubmissionMutation();

  // Auto-close on successful submission after a short delay
  useEffect(() => {
    if (submissionPhase === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 1200); // Brief delay to show success state

      return () => clearTimeout(timer);
    }
  }, [submissionPhase, onClose]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    form.handleFileSelect(file);
  };

  // Phase change handler
  const handlePhaseChange = useCallback((phase: SubmissionPhase) => {
    // Any additional phase-specific handling can be done here
    console.log(`Submission phase changed to: ${phase}`);
  }, []);

  // Handle final submission
  const handleSubmit = async () => {
    // Get submission data including all traits
    const { traits } = form.getSubmissionData();
    const media = form.getMediaSelection();

    if (media.mediaSource === "upload") {
      if (!media.selectedFile) {
        return null;
      }

      return submitArtwork(
        {
          imageFile: media.selectedFile,
          traits,
          waveId: wave.id,
          termsOfService: wave.participation.terms,
        },
        address ?? "",
        isSafeWallet,
        {
          onPhaseChange: handlePhaseChange,
        }
      );
    }

    if (!media.isExternalValid) {
      return null;
    }

    return submitArtwork(
      {
        externalMedia: {
          url: media.externalUrl,
          mimeType: media.externalMimeType,
        },
        traits,
        waveId: wave.id,
        termsOfService: wave.participation.terms,
      },
      address ?? "",
      isSafeWallet,
      {
        onPhaseChange: handlePhaseChange,
      }
    );
  };

  const fileInfo = form.selectedFile
    ? {
        name: form.selectedFile.name,
        size: form.selectedFile.size,
      }
    : null;

  // Map of steps to their corresponding components
  const stepComponents = {
    [SubmissionStep.AGREEMENT]: (
      <AgreementStep
        wave={wave}
        agreements={form.agreements}
        setAgreements={form.setAgreements}
        onContinue={form.handleContinueFromTerms}
      />
    ),
    [SubmissionStep.ARTWORK]: (
      <ArtworkStep
        traits={form.traits}
        artworkUploaded={form.artworkUploaded}
        artworkUrl={form.artworkUrl}
        setArtworkUploaded={form.setArtworkUploaded}
        handleFileSelect={handleFileSelect}
        mediaSource={form.mediaSource}
        setMediaSource={form.setMediaSource}
        externalHash={form.externalMediaHashInput}
        externalProvider={form.externalMediaProvider}
        externalConstructedUrl={form.externalMediaUrl}
        externalPreviewUrl={form.externalMediaPreviewUrl}
        externalMimeType={form.externalMediaMimeType}
        externalError={form.externalMediaError}
        externalValidationStatus={form.externalMediaValidationStatus}
        isExternalMediaValid={form.isExternalMediaValid}
        onExternalHashChange={form.setExternalMediaHash}
        onExternalProviderChange={form.setExternalMediaProvider}
        onExternalMimeTypeChange={form.setExternalMediaMimeType}
        onClearExternalMedia={form.clearExternalMedia}
        onSubmit={handleSubmit}
        onCancel={onClose}
        updateTraitField={form.updateTraitField}
        setTraits={form.setTraits}
        isSubmitting={isSubmitting}
        submissionPhase={submissionPhase}
        uploadProgress={uploadProgress}
        fileInfo={fileInfo}
        submissionError={submissionError}
      />
    ),
  };

  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-relative tw-border tw-border-iron-800 tw-backdrop-blur tw-flex tw-flex-col tw-overflow-hidden">
        <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-overflow-hidden">
          <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-primary-500/[0.03] tw-blur-3xl -tw-top-1/4 -tw-right-1/4" />
          <div className="tw-absolute tw-w-2/3 tw-h-1/2 tw-bg-purple-500/[0.02] tw-blur-3xl tw-top-1/4 -tw-left-1/4" />
          <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-iron-500/[0.03] tw-blur-3xl -tw-bottom-1/4 -tw-left-1/4" />
        </div>
        <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-h-full">
          <div className="tw-px-4 md:tw-px-8">
            <div
              className={`tw-flex tw-justify-between tw-w-full lg:tw-mb-0 tw-pt-6 lg:tw-pt-8 tw-pb-4 lg:tw-pb-6 tw-flex-shrink-0 tw-border tw-border-solid tw-border-x-0 tw-border-t-0 lg:tw-border-b-0 tw-border-iron-800 ${
                form.currentStep === SubmissionStep.AGREEMENT
                  ? "tw-max-w-6xl tw-mx-auto"
                  : ""
              }`}>
              <motion.h3 className="tw-text-2xl lg:tw-text-3xl tw-font-semibold tw-text-iron-100">
                Submit Work to The Memes
              </motion.h3>
              <motion.button
                onClick={onClose}
                className="tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-size-9 lg:tw-size-10 tw-rounded-full tw-border-0 tw-ring-1 tw-ring-iron-700 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
                aria-label="Close modal">
                <FontAwesomeIcon
                  icon={faXmark}
                  className="tw-size-5 tw-flex-shrink-0"
                />
              </motion.button>
            </div>
          </div>
          <div className="tw-flex-1 tw-min-h-0">
            {stepComponents[form.currentStep]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemesArtSubmissionContainer;
