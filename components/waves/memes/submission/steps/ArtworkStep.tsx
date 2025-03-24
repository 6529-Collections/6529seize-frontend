import React, { useCallback, useState, useEffect, useMemo } from "react";
import PrimaryButton from "../../../../utils/button/PrimaryButton";
import { TraitsData } from "../types/TraitsData";
import MemesArtSubmissionFile from "../../MemesArtSubmissionFile";
import ArtworkDetails from "../details/ArtworkDetails";
import MemesArtSubmissionTraits from "../../MemesArtSubmissionTraits";
import { SubmissionPhase } from "../ui/SubmissionProgress";
import ValidationSummary from "../ui/ValidationSummary";
import { useTraitsValidation } from "../validation";

/**
 * Required fields for submission
 * All fields are required for submission
 */
const REQUIRED_FIELDS = ["title", "description", "memeName"] as const;

/**
 * Fields that are read-only and should be skipped in validation
 * These are pre-populated by the system
 */
const READ_ONLY_FIELDS = [
  "seizeArtistProfile",
  "typeCard",
  "issuanceMonth",
  "typeSeason",
  "typeMeme",
  "typeCardNumber",
] as const;

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
    // Handle number fields - must be a defined number (can be 0)
    else if (typeof value === "number") {
      if (value === null || value === undefined || isNaN(value)) return false;
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
}) => {
  // Set up validation with initial empty touched fields to prevent errors on load
  const validation = useTraitsValidation(traits, initialTraits || traits);
  const [showErrorSummary, setShowErrorSummary] = useState(false);

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
      // For development debugging
      if (process.env.NODE_ENV === "development") {
        console.debug(`Field touched: ${field}`);
      }
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
      setShowErrorSummary(true);
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
    <div className="tw-flex tw-flex-col tw-gap-y-6 tw-relative">
      {/* Form content wrapped in a container */}
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        {/* File Selection Component */}
        <MemesArtSubmissionFile
          artworkUploaded={artworkUploaded}
          artworkUrl={artworkUrl}
          setArtworkUploaded={setArtworkUploaded}
          handleFileSelect={handleFileSelect}
        />

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

        {/* Validation error summary */}
        <ValidationSummary
          errors={validation.errors}
          show={
            showErrorSummary &&
            validation.submitAttempted &&
            !validation.isValid
          }
          onErrorClick={validation.focusFirstInvalidField}
          className="tw-mt-2"
        />

        {/* Traits Component */}
        <MemesArtSubmissionTraits
          traits={traits}
          setTraits={setTraits}
          validationErrors={validation.errors}
          onFieldBlur={handleFieldBlur}
          requiredFields={REQUIRED_FIELDS}
        />
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="tw-sticky tw-bottom-0 tw-left-0 tw-w-full tw-bg-iron-950/80 tw-backdrop-blur-sm tw-py-4 tw-z-10">
        <div className="tw-container tw-mx-auto tw-flex tw-items-center tw-justify-between">
          {/* Cancel button - only show during idle state */}
          {submissionPhase === 'idle' && (
            <button
              onClick={onCancel}
              className="tw-text-iron-400 desktop-hover:hover:tw-text-iron-100 tw-transition-colors tw-font-medium"
              type="button"
            >
              Cancel
            </button>
          )}
          
          {/* Keep this invisible div when button is not shown to maintain layout */}
          {submissionPhase !== 'idle' && <div></div>}
          
          {/* Submit button */}
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
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(ArtworkStep);
