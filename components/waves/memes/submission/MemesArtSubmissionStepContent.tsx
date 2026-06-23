"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { MemesSubmissionPreviewScreen } from "./preview/MemesSubmissionPreviewScreen";
import AdditionalInfoStep from "./steps/AdditionalInfoStep";
import AgreementStep from "./steps/AgreementStep";
import ArtworkStep from "./steps/ArtworkStep";
import { SubmissionStep } from "./types/Steps";
import type { SubmissionPhase } from "./ui/SubmissionProgress";
import { getResubmissionMediaTypeInfo } from "./utils/resubmissionMediaType";
import type { ArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";

interface MemesArtSubmissionStepContentProps {
  readonly form: ArtworkSubmissionForm;
  readonly wave: ApiWave;
  readonly isPreviewMode: boolean;
  readonly previewDrop: ExtendedDrop | null;
  readonly isSubmitting: boolean;
  readonly submissionPhase: SubmissionPhase;
  readonly uploadProgress: number;
  readonly submissionError?: string | undefined;
  readonly submitLabel: string;
  readonly onClose: () => void;
  readonly onBackToEdit: () => void;
  readonly onBackFromAdditionalInfo: () => void;
  readonly onOpenPreview: () => void;
  readonly onSubmitClick: () => void;
  readonly onArtworkCommentaryMediaChange: (media: string[]) => void;
  readonly onPreviewImageChange: (url: string) => void;
  readonly onPromoVideoChange: (url: string) => void;
}

export function MemesArtSubmissionStepContent({
  form,
  wave,
  isPreviewMode,
  previewDrop,
  isSubmitting,
  submissionPhase,
  uploadProgress,
  submissionError,
  submitLabel,
  onClose,
  onBackToEdit,
  onBackFromAdditionalInfo,
  onOpenPreview,
  onSubmitClick,
  onArtworkCommentaryMediaChange,
  onPreviewImageChange,
  onPromoVideoChange,
}: MemesArtSubmissionStepContentProps) {
  const fileInfo = form.selectedFile
    ? {
        name: form.selectedFile.name,
        size: form.selectedFile.size,
      }
    : null;

  const mediaTypeInfo = (() => {
    if (form.mediaSource === "upload" && form.selectedFile) {
      return getResubmissionMediaTypeInfo({
        mimeType: form.selectedFile.type,
        fileName: form.selectedFile.name,
      });
    }
    if (form.mediaSource === "upload" && form.existingMedia) {
      return getResubmissionMediaTypeInfo({
        mimeType: form.existingMedia.mimeType,
        url: form.existingMedia.url,
      });
    }
    if (form.mediaSource === "url" && form.isExternalMediaValid) {
      return getResubmissionMediaTypeInfo({
        mimeType: form.externalMediaMimeType,
        url: form.externalMediaUrl,
      });
    }
    return { label: null, isInteractive: false };
  })();

  const previewRequiredMediaType = mediaTypeInfo.label;
  const requiresPreviewImage = previewRequiredMediaType !== null;
  const requiresPromoVideoOption = mediaTypeInfo.isInteractive;

  switch (form.currentStep) {
    case SubmissionStep.AGREEMENT:
      return (
        <AgreementStep
          wave={wave}
          agreements={form.agreements}
          setAgreements={form.setAgreements}
          onContinue={form.handleContinueFromTerms}
        />
      );

    case SubmissionStep.ARTWORK:
      return (
        <ArtworkStep
          traits={form.traits}
          artworkUploaded={form.artworkUploaded}
          artworkUrl={form.artworkUrl}
          uploadError={form.uploadError}
          artworkMimeType={form.existingMedia?.mimeType ?? null}
          setArtworkUploaded={form.setArtworkUploaded}
          handleFileSelect={form.handleFileSelect}
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
          isAdditionalActionPromised={form.isAdditionalActionPromised}
          onAdditionalActionPromisedChange={
            form.setAdditionalActionPromised
          }
          isSubmitting={isSubmitting}
          submissionPhase={submissionPhase}
          uploadProgress={uploadProgress}
          fileInfo={fileInfo}
          submissionError={submissionError}
        />
      );

    case SubmissionStep.ADDITIONAL_INFO:
      if (isPreviewMode && previewDrop) {
        return (
          <MemesSubmissionPreviewScreen
            previewDrop={previewDrop}
            onBackToEdit={onBackToEdit}
            onSubmit={onSubmitClick}
            isSubmitting={isSubmitting}
            submitLabel={submitLabel}
          />
        );
      }

      return (
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
          onSupportingMediaChange={onArtworkCommentaryMediaChange}
          onPreviewImageChange={onPreviewImageChange}
          onPromoVideoChange={onPromoVideoChange}
          onArtworkCommentaryChange={form.setCommentary}
          onAboutArtistChange={form.setAboutArtist}
          onBack={onBackFromAdditionalInfo}
          onPreview={onOpenPreview}
          onSubmit={onSubmitClick}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
        />
      );
  }

  return null;
}
