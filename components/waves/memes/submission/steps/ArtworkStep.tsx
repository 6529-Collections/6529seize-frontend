"use client";
import { MemeCollaboratorPicker } from "@/components/waves/memes/collaborations/MemeCollaboratorPicker";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import MemesArtSubmissionFile from "@/components/waves/memes/MemesArtSubmissionFile";
import MemesArtSubmissionTraits from "@/components/waves/memes/MemesArtSubmissionTraits";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import React, { useCallback, useMemo, useState } from "react";
import type {
  InteractiveMediaMimeType,
  InteractiveMediaProvider,
} from "../constants/media";
import ArtworkDetails from "../details/ArtworkDetails";
import type { TraitsData } from "../types/TraitsData";
import type { SubmissionPhase } from "../ui/SubmissionProgress";
import SubmissionProgress from "../ui/SubmissionProgress";
import { useTraitsValidation } from "../validation";
import { useMainStageArtworkValidation } from "../validation/useMainStageArtworkValidation";
import type { ProposalCardLayout } from "@/lib/proposal-card/document";
import { ProposalCardOption } from "../components/ProposalCardOption";
import { getProposalCardMimeType } from "@/lib/proposal-card/media";

interface ArtworkStepProps {
  readonly competition?: ApiCompetition | null;
  readonly collaborators?: ApiMemeCollaboratorProfile[];
  readonly onCollaboratorsChange?: (
    profiles: ApiMemeCollaboratorProfile[]
  ) => void;
  readonly proposalFrame?: ProposalCardLayout | null;
  readonly onProposalFrameChange?: (layout: ProposalCardLayout | null) => void;
  readonly traits: TraitsData;
  readonly artworkUploaded: boolean;
  readonly artworkUrl: string;
  readonly uploadError: string | null;
  readonly artworkMimeType?: string | null | undefined;
  readonly setArtworkUploaded: (uploaded: boolean) => void;
  readonly handleFileSelect: (file: File) => void;
  readonly mediaSource: "upload" | "url";
  readonly setMediaSource: (mode: "upload" | "url") => void;
  readonly externalHash: string;
  readonly externalProvider: InteractiveMediaProvider;
  readonly externalConstructedUrl: string;
  readonly externalPreviewUrl: string;
  readonly externalMimeType: InteractiveMediaMimeType;
  readonly externalError: string | null;
  readonly externalValidationStatus: "idle" | "pending" | "valid" | "invalid";
  readonly isExternalMediaValid: boolean;
  readonly onExternalHashChange: (value: string) => void;
  readonly onExternalProviderChange: (value: InteractiveMediaProvider) => void;
  readonly onExternalMimeTypeChange: (value: InteractiveMediaMimeType) => void;
  readonly onClearExternalMedia: () => void;
  readonly onSubmit: () => void;
  readonly onCancel?: (() => void) | undefined; // Added cancel handler prop
  readonly updateTraitField: <K extends keyof TraitsData>(
    field: K,
    value: TraitsData[K]
  ) => void;
  readonly setTraits: (traits: Partial<TraitsData>) => void;
  readonly isAdditionalActionPromised: boolean;
  readonly onAdditionalActionPromisedChange: (value: boolean) => void;
  readonly additionalActionPlan: string;
  readonly onAdditionalActionPlanChange: (value: string) => void;
  readonly isSubmitting?: boolean | undefined;
  readonly submissionPhase?: SubmissionPhase | undefined;
  readonly initialTraits?: TraitsData | undefined;
  // Additional props for SubmissionProgress
  readonly uploadProgress?: number | undefined;
  readonly fileInfo?: { name: string; size: number } | null | undefined;
  readonly submissionError?: string | undefined;
}

/**
 * ArtworkStep - Component for the artwork submission step
 *
 * This component directly includes all the needed components for
 * the artwork submission process in a clear, sequential layout.
 * The submit button is fixed at the bottom of the page and changes
 * appearance based on the current submission phase.
 */
const ArtworkStep: React.FC<ArtworkStepProps> = ({
  competition,
  collaborators = [],
  onCollaboratorsChange,
  proposalFrame,
  onProposalFrameChange,
  traits,
  artworkUploaded,
  artworkUrl,
  uploadError,
  artworkMimeType,
  setArtworkUploaded,
  handleFileSelect,
  mediaSource,
  setMediaSource,
  externalHash,
  externalProvider,
  externalConstructedUrl,
  externalPreviewUrl,
  externalMimeType,
  externalError,
  externalValidationStatus,
  isExternalMediaValid,
  onExternalHashChange,
  onExternalProviderChange,
  onExternalMimeTypeChange,
  onClearExternalMedia,
  onSubmit,
  onCancel,
  updateTraitField,
  setTraits,
  isAdditionalActionPromised,
  onAdditionalActionPromisedChange,
  additionalActionPlan,
  onAdditionalActionPlanChange,
  isSubmitting = false,
  submissionPhase = "idle",
  initialTraits,
  uploadProgress = 0,
  fileInfo = null,
  submissionError,
}) => {
  // Set up validation with initial empty touched fields to prevent errors on load
  const validation = useTraitsValidation(traits, initialTraits ?? traits);
  const serverValidation = useMainStageArtworkValidation(competition, traits);
  const traitErrors = serverValidation.rules
    ? serverValidation.errors
    : validation.errors;
  const locale = useBrowserLocale();
  const [mediaSubmitAttempted, setMediaSubmitAttempted] = useState(false);
  const isMediaValidationPending =
    mediaSource === "url" && externalValidationStatus === "pending";
  const hasValidMedia =
    mediaSource === "url" ? isExternalMediaValid : artworkUploaded;
  let missingMediaError: string | null = null;
  if (mediaSubmitAttempted && !hasValidMedia && !isMediaValidationPending) {
    missingMediaError =
      mediaSource === "upload"
        ? t(locale, "memes.submission.media.missingUpload")
        : t(locale, "memes.submission.media.missingInteractive");
  }

  // Create callback handlers for title and description
  const handleTitleChange = useCallback(
    (title: string) => {
      updateTraitField("title", title);
    },
    [updateTraitField]
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      updateTraitField("description", description);
    },
    [updateTraitField]
  );

  const handleMediaSourceChange = useCallback(
    (source: "upload" | "url") => {
      setMediaSubmitAttempted(false);
      setMediaSource(source);
    },
    [setMediaSource]
  );

  // Handler for field blur to mark fields as touched for validation
  const handleFieldBlur = useCallback(
    (field: keyof TraitsData) => {
      validation.markFieldTouched(field);
    },
    [validation]
  );

  const focusMediaControl = useCallback(() => {
    const elementId =
      mediaSource === "upload"
        ? "memes-art-submission-upload-panel"
        : "memes-interactive-media-hash";
    const element = document.getElementById(elementId);
    if (!(element instanceof HTMLElement)) return;

    element.focus();
    element.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [mediaSource]);

  // Handle submission with validation
  const handleSubmit = useCallback(() => {
    setMediaSubmitAttempted(true);
    if (serverValidation.rules) {
      if (!hasValidMedia) {
        requestAnimationFrame(focusMediaControl);
        return;
      }
      void serverValidation.validate().then((issues) => {
        if (issues === null) return;
        const firstIssue = issues[0];
        if (firstIssue) {
          requestAnimationFrame(() =>
            validation.focusFirstInvalidField(
              firstIssue.key as keyof TraitsData
            )
          );
        } else {
          onSubmit();
        }
      });
      return;
    }

    const validationResult = validation.validateAll();
    if (!hasValidMedia || !validationResult.isValid) {
      requestAnimationFrame(() => {
        if (!hasValidMedia) {
          focusMediaControl();
          return;
        }

        validation.focusFirstInvalidField(validationResult.firstInvalidField);
      });
      return;
    }

    onSubmit();
  }, [
    focusMediaControl,
    hasValidMedia,
    onSubmit,
    serverValidation,
    validation,
  ]);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting || serverValidation.pending) return true;
    if (submissionPhase === "success") return true;
    return isMediaValidationPending;
  }, [
    isMediaValidationPending,
    isSubmitting,
    serverValidation.pending,
    submissionPhase,
  ]);

  // Get button text based on submission phase
  const getButtonText = (): string => {
    if (serverValidation.pending)
      return t(locale, "memes.submission.traits.checking");
    switch (submissionPhase) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing...";
      case "success":
        return "✓ Submission Complete";
      case "error":
        return "Try Again";
      default:
        return "Continue";
    }
  };

  // Get button class based on phase
  const getButtonClass = (): string => {
    switch (submissionPhase) {
      case "success":
        return "tw-bg-green-600 hover:tw-bg-green-700";
      case "error":
        return "tw-bg-red-600 hover:tw-bg-red-700";
      default:
        return "";
    }
  };

  const renderMediaSubmissionPanel = () => (
    <MemesArtSubmissionFile
      proposalFrame={proposalFrame}
      artworkTitle={traits.title}
      artworkUploaded={artworkUploaded}
      artworkUrl={artworkUrl}
      uploadError={uploadError}
      missingMediaError={missingMediaError}
      artworkMimeType={artworkMimeType}
      setArtworkUploaded={setArtworkUploaded}
      handleFileSelect={handleFileSelect}
      mediaSource={mediaSource}
      setMediaSource={handleMediaSourceChange}
      externalHash={externalHash}
      externalProvider={externalProvider}
      externalConstructedUrl={externalConstructedUrl}
      externalPreviewUrl={externalPreviewUrl}
      externalMimeType={externalMimeType}
      externalError={externalError}
      externalValidationStatus={externalValidationStatus}
      isExternalMediaValid={isExternalMediaValid}
      onExternalHashChange={onExternalHashChange}
      onExternalProviderChange={onExternalProviderChange}
      onExternalMimeTypeChange={onExternalMimeTypeChange}
      onClearExternalMedia={onClearExternalMedia}
    />
  );

  /** Keep the action declaration and plan editor together in the artwork details panel. */
  const renderArtworkDetailsPanel = () => (
    <ArtworkDetails
      title={traits.title}
      description={traits.description}
      onTitleChange={handleTitleChange}
      onDescriptionChange={handleDescriptionChange}
      titleError={traitErrors.title}
      descriptionError={traitErrors.description}
      onTitleBlur={() => handleFieldBlur("title")}
      onDescriptionBlur={() => handleFieldBlur("description")}
      showRequiredMarkers={true}
      size="sm"
      showAdditionalActionPromised={true}
      isAdditionalActionPromised={isAdditionalActionPromised}
      onAdditionalActionPromisedChange={onAdditionalActionPromisedChange}
      additionalActionPlan={additionalActionPlan}
      onAdditionalActionPlanChange={onAdditionalActionPlanChange}
    />
  );

  const renderArtworkTraitsPanel = () => (
    <MemesArtSubmissionTraits
      hideCollab
      collaboratorPicker={
        onCollaboratorsChange ? (
          <MemeCollaboratorPicker
            collaborators={collaborators}
            onChange={onCollaboratorsChange}
          />
        ) : undefined
      }
      traits={traits}
      setTraits={setTraits}
      traitRules={serverValidation.rules}
      validationErrors={traitErrors}
      onFieldBlur={handleFieldBlur}
      showRequiredMarkers={true}
      size="sm"
    />
  );

  return (
    <div className="tw-flex tw-h-full tw-flex-col">
      <div
        data-testid="artwork-step-content"
        className="tw-min-h-0 tw-w-full tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 lg:tw-overflow-hidden"
      >
        <div className="tw-flex tw-min-h-full tw-w-full tw-flex-col lg:tw-h-full lg:tw-min-h-0 lg:tw-flex-row">
          <div className="tw-flex tw-w-full tw-flex-col tw-px-4 tw-pb-6 tw-pt-4 md:tw-pl-8 lg:tw-h-full lg:tw-min-h-0 lg:tw-w-1/2 lg:tw-overflow-y-auto lg:tw-pr-4 lg:tw-scrollbar-thin lg:tw-scrollbar-track-iron-800 lg:tw-scrollbar-thumb-iron-500 lg:desktop-hover:hover:tw-scrollbar-thumb-iron-300">
            {renderMediaSubmissionPanel()}
          </div>

          <div className="tw-w-full tw-px-4 tw-pt-6 md:tw-pl-6 md:tw-pr-8 lg:tw-h-full lg:tw-min-h-0 lg:tw-w-1/2 lg:tw-overflow-y-auto lg:tw-scrollbar-thin lg:tw-scrollbar-track-iron-800 lg:tw-scrollbar-thumb-iron-500 lg:desktop-hover:hover:tw-scrollbar-thumb-iron-300">
            <div className="tw-flex tw-flex-col tw-gap-y-6 tw-pb-6">
              {renderArtworkDetailsPanel()}
              {onProposalFrameChange &&
                (mediaSource === "url" ||
                  !artworkMimeType ||
                  getProposalCardMimeType(artworkMimeType) !== undefined) && (
                  <ProposalCardOption
                    layout={proposalFrame ?? null}
                    onChange={onProposalFrameChange}
                    disabled={isSubmitting}
                  />
                )}
              {renderArtworkTraitsPanel()}
            </div>
          </div>
        </div>
      </div>

      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-py-3">
        <div className="tw-px-4 md:tw-px-8">
          {submissionPhase !== "idle" && (
            <div className="tw-mb-4">
              <SubmissionProgress
                phase={submissionPhase}
                progress={uploadProgress}
                fileInfo={fileInfo}
                error={submissionError}
              />
            </div>
          )}

          {serverValidation.rules && serverValidation.requestFailed && (
            <p role="alert" className="tw-text-red-400 tw-mb-2 tw-text-sm">
              {t(locale, "memes.submission.traits.checkFailed")}
            </p>
          )}
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
            {onCancel && submissionPhase !== "success" ? (
              <SecondaryButton
                onClicked={onCancel}
                disabled={
                  submissionPhase === "uploading" ||
                  submissionPhase === "processing"
                }
              >
                Cancel
              </SecondaryButton>
            ) : (
              /* Keep this invisible div when button is not shown to maintain layout */
              <div></div>
            )}

            <div
              className={`tw-transition-all tw-duration-300 ${getButtonClass()}`}
            >
              <PrimaryButton
                onClicked={handleSubmit}
                loading={
                  isSubmitting &&
                  submissionPhase !== "success" &&
                  submissionPhase !== "error"
                }
                disabled={isSubmitDisabled}
              >
                {getButtonText()}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(ArtworkStep);
