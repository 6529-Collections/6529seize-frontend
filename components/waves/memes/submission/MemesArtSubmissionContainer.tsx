"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";
import { useArtworkSubmissionMutation } from "./hooks/useArtworkSubmissionMutation";
import { MemesSubmissionPreviewScreen } from "./preview/MemesSubmissionPreviewScreen";
import AdditionalInfoStep from "./steps/AdditionalInfoStep";
import AgreementStep from "./steps/AgreementStep";
import ArtworkStep from "./steps/ArtworkStep";
import { SubmissionStep } from "./types/Steps";
import type { SubmissionPhase } from "./ui/SubmissionProgress";
import { buildPreviewDrop } from "./utils/buildPreviewDrop";

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
const MemesArtSubmissionContainer: FC<MemesArtSubmissionContainerProps> = ({
  onClose,
  wave,
}) => {
  // Use the form hook to manage all state
  const form = useArtworkSubmissionForm();
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

  // Auto-close on successful submission after a short delay
  useEffect(() => {
    if (submissionPhase !== "success") return;
    const timer = setTimeout(() => {
      onClose();
    }, 1200); // Brief delay to show success state

    return () => clearTimeout(timer);
  }, [submissionPhase, onClose]);

  const resetPreviewState = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewDrop(null);
  }, []);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    form.handleFileSelect(file);
  };

  const handleArtworkCommentaryMediaChange = useCallback(
    (media: string[]) => {
      form.setAdditionalMedia({ artwork_commentary_media: media });
    },
    [form.setAdditionalMedia]
  );

  const handlePreviewImageChange = useCallback(
    (url: string) => {
      form.setAdditionalMedia({ preview_image: url });
    },
    [form.setAdditionalMedia]
  );

  const handlePromoVideoChange = useCallback(
    (url: string) => {
      form.setAdditionalMedia({ promo_video: url });
    },
    [form.setAdditionalMedia]
  );

  // Phase change handler
  const handlePhaseChange = useCallback((phase: SubmissionPhase) => {
    // Any additional phase-specific handling can be done here
    console.warn(`Submission phase changed to: ${phase}`);
  }, []);

  const handleOpenPreview = useCallback(() => {
    const { imageUrl, traits, operationalData } = form.getSubmissionData();
    const media = form.getMediaSelection();

    setPreviewDrop(
      buildPreviewDrop({
        wave,
        traits,
        operationalData,
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

  const handleBackFromAdditionalInfo = () => {
    resetPreviewState();
    form.handleBackToArtwork();
  };

  // Handle final submission
  const handleSubmit = async () => {
    // Get submission data including all traits
    const { traits, operationalData } = form.getSubmissionData();
    const media = form.getMediaSelection();

    if (media.mediaSource === "upload") {
      if (!media.selectedFile) {
        return null;
      }

      return submitArtwork(
        {
          imageFile: media.selectedFile,
          traits,
          operationalData,
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
        operationalData,
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

  const mediaTypeInfo = (() => {
    const getMediaTypeLabel = (mimeType: string): string | null => {
      if (mimeType.startsWith("video/")) return "Video";
      if (mimeType === "text/html") return "HTML";
      if (mimeType === "model/gltf-binary") return "GLB";
      return null;
    };

    const isInteractiveMedia = (mimeType: string): boolean => {
      return mimeType === "text/html" || mimeType === "model/gltf-binary";
    };

    if (form.mediaSource === "upload" && form.selectedFile) {
      const label = getMediaTypeLabel(form.selectedFile.type);
      const isInteractive = isInteractiveMedia(form.selectedFile.type);
      return { label, isInteractive };
    }
    if (form.mediaSource === "url" && form.isExternalMediaValid) {
      const label = getMediaTypeLabel(form.externalMediaMimeType);
      const isInteractive = isInteractiveMedia(form.externalMediaMimeType);
      return { label, isInteractive };
    }
    return { label: null, isInteractive: false };
  })();

  const previewRequiredMediaType = mediaTypeInfo.label;
  const requiresPreviewImage = previewRequiredMediaType !== null;
  const requiresPromoVideoOption = mediaTypeInfo.isInteractive;

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
        onSubmit={form.handleContinueFromArtwork}
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
    [SubmissionStep.ADDITIONAL_INFO]:
      isPreviewMode && previewDrop ? (
        <MemesSubmissionPreviewScreen
          previewDrop={previewDrop}
          onBackToEdit={handleBackToEdit}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <AdditionalInfoStep
          traits={form.traits}
          airdropEntries={form.operationalData.airdrop_config}
          onAirdropEntriesChange={form.setAirdropConfig}
          paymentInfo={form.operationalData.payment_info}
          onPaymentInfoChange={form.setPaymentInfo}
          allowlistBatches={form.operationalData.allowlist_batches}
          supportingMedia={
            form.operationalData.additional_media.artwork_commentary_media
          }
          artworkCommentary={form.operationalData.commentary}
          aboutArtist={form.operationalData.about_artist}
          previewImage={form.operationalData.additional_media.preview_image}
          promoVideo={form.operationalData.additional_media.promo_video}
          requiresPreviewImage={requiresPreviewImage}
          requiresPromoVideoOption={requiresPromoVideoOption}
          previewRequiredMediaType={previewRequiredMediaType}
          onBatchesChange={form.setAllowlistBatches}
          onSupportingMediaChange={handleArtworkCommentaryMediaChange}
          onPreviewImageChange={handlePreviewImageChange}
          onPromoVideoChange={handlePromoVideoChange}
          onArtworkCommentaryChange={form.setCommentary}
          onAboutArtistChange={form.setAboutArtist}
          onBack={handleBackFromAdditionalInfo}
          onPreview={handleOpenPreview}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ),
  };

  return (
    <div className="tw-flex tw-h-full tw-flex-col">
      <div className="tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-backdrop-blur">
        <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-flex-col">
          <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-pb-6 md:tw-px-8">
            <div
              className="tw-flex tw-w-full tw-items-center tw-flex-shrink-0 tw-justify-between tw-pt-6 lg:tw-border-b-0"
            >
              <motion.h3 className="tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 md:tw-text-2xl tw-mb-0">
                Submit Work to The Memes
              </motion.h3>
              <motion.button
                onClick={onClose}
                className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-ring-1 tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400 lg:tw-size-10"
                aria-label="Close modal"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                  className="tw-size-5 tw-flex-shrink-0"
                />
              </motion.button>
            </div>
          </div>
          <div className="tw-min-h-0 tw-flex-1">
            {stepComponents[form.currentStep]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemesArtSubmissionContainer;
