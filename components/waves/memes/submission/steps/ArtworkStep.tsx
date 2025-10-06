"use client"

import React, { useCallback, useMemo } from "react";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { TraitsData } from "../types/TraitsData";
import MemesArtSubmissionFile from "@/components/waves/memes/MemesArtSubmissionFile";
import ArtworkDetails from "../details/ArtworkDetails";
import MemesArtSubmissionTraits from "@/components/waves/memes/MemesArtSubmissionTraits";
import SubmissionProgress, { SubmissionPhase } from "../ui/SubmissionProgress";
import { useTraitsValidation } from "../validation";

/**
 * Required fields for submission
 * All fields are required for submission
 */

/**
 * Fields that are read-only and should be skipped in validation
 * These are pre-populated by the system
 */
const READ_ONLY_FIELDS = ["seizeArtistProfile"] as const;

/**
 * Get tooltip text for submit button based on current state
 * Helps users understand why the button might be disabled
 */
function getSubmitButtonTooltip(
  isDisabled: boolean,
  isFormComplete: boolean,
  artworkUploaded: boolean,
  traits: TraitsData
): string {
  if (!isDisabled) return "";

  if (!artworkUploaded) {
    return "Please upload artwork";
  }

  if (!isFormComplete) {
    // Check each field and return specific message for the first empty one
    // This helps the user understand what's missing
    for (const field of Object.keys(traits) as Array<keyof TraitsData>) {
      // Skip read-only fields
      if (READ_ONLY_FIELDS.includes(field as any)) continue;

      const value = traits[field];
      const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase();

      // String fields (including dropdowns)
      if (typeof value === "string") {
        if (!value.trim()) {
          if (field === "memeName" || field === "palette") {
            return `Please select a ${fieldName}`;
          } else {
            return `Please enter ${fieldName}`;
          }
        }
      }
      // Number fields
      else if (typeof value === "number") {
        if (value === null || value === undefined || isNaN(value)) {
          return `Please enter ${fieldName}`;
        }
      }
      // Boolean fields need explicit value
      else if (typeof value === "boolean") {
        if (value === null || value === undefined) {
          return `Please set ${fieldName}`;
        }
      }
      // Handle potential null/undefined
      else if (value === null || value === undefined) {
        return `Please complete ${fieldName}`;
      }
    }

    return "All fields are required";
  }

  return "Please fix validation errors before submitting";
}

/**
 * Checks if form meets basic submission requirements
 * ALL fields are required except read-only ones
 */
function checkFormCompleteness(
  traits: TraitsData,
  artworkUploaded: boolean
): boolean {
  // Must have artwork
  if (!artworkUploaded) return false;

  // Check every field in TraitsData
  for (const field of Object.keys(traits) as Array<keyof TraitsData>) {
    // Skip read-only fields that are pre-populated
    if (READ_ONLY_FIELDS.includes(field as any)) continue;

    const value = traits[field];

    // Handle string fields - must not be empty
    if (typeof value === "string") {
      if (!value.trim()) return false;
    }
    // Handle number fields - must be a defined number and not zero
    else if (typeof value === "number") {
      if (value === null || value === undefined || isNaN(value) || value === 0)
        return false;
    }
    // Handle boolean fields - must be explicitly true or false
    else if (typeof value === "boolean") {
      if (value === null || value === undefined) return false;
    }
    // Handle potential null/undefined values
    else if (value === null || value === undefined) {
      return false;
    }
  }

  return true;
}

interface ArtworkStepProps {
  readonly traits: TraitsData;
  readonly artworkUploaded: boolean;
  readonly artworkUrl: string;
  readonly setArtworkUploaded: (uploaded: boolean) => void;
  readonly handleFileSelect: (file: File) => void;
  readonly onSubmit: () => void;
  readonly onCancel?: () => void; // Added cancel handler prop
  readonly updateTraitField: <K extends keyof TraitsData>(
    field: K,
    value: TraitsData[K]
  ) => void;
  readonly setTraits: (traits: Partial<TraitsData>) => void;
  readonly isSubmitting?: boolean;
  readonly submissionPhase?: SubmissionPhase;
  readonly initialTraits?: TraitsData;
  // Additional props for SubmissionProgress
  readonly uploadProgress?: number;
  readonly fileInfo?: { name: string; size: number } | null;
  readonly submissionError?: string;
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
  traits,
  artworkUploaded,
  artworkUrl,
  setArtworkUploaded,
  handleFileSelect,
  onSubmit,
  onCancel,
  updateTraitField,
  setTraits,
  isSubmitting = false,
  submissionPhase = "idle",
  initialTraits,
  uploadProgress = 0,
  fileInfo = null,
  submissionError,
}) => {
  // Set up validation with initial empty touched fields to prevent errors on load
  const validation = useTraitsValidation(traits, initialTraits || traits);

  // Check form completeness - separate from validation
  const isFormComplete = useMemo(
    () => checkFormCompleteness(traits, artworkUploaded),
    [traits, artworkUploaded]
  );

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

  // Handler for field blur to mark fields as touched for validation
  const handleFieldBlur = useCallback(
    (field: keyof TraitsData) => {
      validation.markFieldTouched(field);
    },
    [validation]
  );

  // Handle submission with validation
  const handleSubmit = useCallback(() => {
    // Validate all fields
    const validationResult = validation.validateAll();

    if (validationResult.isValid) {
      // Proceed with submission if valid
      onSubmit();
    } else {
      // Show validation errors and focus the first invalid field
      validation.focusFirstInvalidField();
    }
  }, [validation, onSubmit]);

  // Determine button disabled state - explicit and readable
  const isSubmitDisabled = useMemo(() => {
    // Basic completeness check (required fields + artwork)
    if (!isFormComplete) return true;

    // Submission in progress
    if (isSubmitting) return true;

    // Already successfully submitted
    if (submissionPhase === "success") return true;

    // If user has attempted to submit once, ensure validation passes
    if (validation.submitAttempted && !validation.isValid) return true;

    // All checks passed, enable button
    return false;
  }, [
    isFormComplete,
    isSubmitting,
    submissionPhase,
    validation.submitAttempted,
    validation.isValid,
  ]);

  // Get button text based on submission phase
  const getButtonText = (): string => {
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
        return "Submit to Memes";
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

  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      {/* Scrollable form content */}
      <div className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-relative">
        <div className="tw-relative tw-flex tw-gap-x-8 tw-gap-y-6 tw-flex-col lg:tw-flex-row tw-w-full">
          <div className="tw-px-4 md:tw-px-8 lg:tw-pr-0 tw-w-full lg:tw-w-1/2">
            {/* File Selection Component - Sticky within scrollable area */}
            <div className="tw-sticky tw-top-0 tw-h-[calc(100vh-14rem)]">
              <MemesArtSubmissionFile
                artworkUploaded={artworkUploaded}
                artworkUrl={artworkUrl}
                setArtworkUploaded={setArtworkUploaded}
                handleFileSelect={handleFileSelect}
              />
            </div>
          </div>

          <div className="tw-px-4 md:tw-px-8 lg:tw-pl-0 tw-full lg:tw-w-1/2 tw-flex tw-flex-col tw-gap-y-6 tw-pb-6">
            {/* Artwork Title and Description */}
            <ArtworkDetails
              title={traits.title}
              description={traits.description}
              onTitleChange={handleTitleChange}
              onDescriptionChange={handleDescriptionChange}
              titleError={validation.errors.title}
              descriptionError={validation.errors.description}
              onTitleBlur={() => handleFieldBlur("title")}
              onDescriptionBlur={() => handleFieldBlur("description")}
            />

            {/* Traits Component */}
            <MemesArtSubmissionTraits
              traits={traits}
              setTraits={setTraits}
              validationErrors={validation.errors}
              onFieldBlur={handleFieldBlur}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="tw-border-t tw-border-iron-800 tw-border-solid tw-border-b-0 tw-border-x-0 tw-bg-iron-950 tw-py-3">
        <div className="tw-px-4 md:tw-px-8">
          {/* Submission Progress - Only shown when active */}
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

          {/* Action buttons row */}
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
            {/* Cancel button - always visible, but disabled during upload/processing and hidden on success */}
            {onCancel && submissionPhase !== "success" ? (
              <button
                onClick={
                  submissionPhase === "uploading" ||
                  submissionPhase === "processing"
                    ? undefined
                    : onCancel
                }
                disabled={
                  submissionPhase === "uploading" ||
                  submissionPhase === "processing"
                }
                className="tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-650 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-300 tw-shadow-sm desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                type="button"
              >
                Cancel
              </button>
            ) : (
              /* Keep this invisible div when button is not shown to maintain layout */
              <div></div>
            )}

            {/* Submit button */}
            <div
              className={`tw-transition-all tw-duration-300 ${getButtonClass()}`}
            >
              <PrimaryButton
                padding="tw-py-3 tw-px-3.5"
                onClicked={handleSubmit}
                loading={
                  isSubmitting &&
                  submissionPhase !== "success" &&
                  submissionPhase !== "error"
                }
                disabled={isSubmitDisabled}
                title={getSubmitButtonTooltip(
                  isSubmitDisabled,
                  isFormComplete,
                  artworkUploaded,
                  traits
                )}
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
