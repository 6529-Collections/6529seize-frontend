import React, { useCallback, useState, useEffect } from "react";
import PrimaryButton from "../../../../utils/button/PrimaryButton";
import { TraitsData } from "../types/TraitsData";
import MemesArtSubmissionFile from "../../MemesArtSubmissionFile";
import ArtworkDetails from "../details/ArtworkDetails";
import MemesArtSubmissionTraits from "../../MemesArtSubmissionTraits";
import { SubmissionPhase } from "../ui/SubmissionProgress";
import ValidationSummary from "../ui/ValidationSummary";
import { useTraitsValidation } from "../validation";

interface ArtworkStepProps {
  readonly traits: TraitsData;
  readonly artworkUploaded: boolean;
  readonly artworkUrl: string;
  readonly setArtworkUploaded: (uploaded: boolean) => void;
  readonly handleFileSelect: (file: File) => void;
  readonly onSubmit: () => void;
  readonly updateTraitField: <K extends keyof TraitsData>(field: K, value: TraitsData[K]) => void;
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
  updateTraitField,
  setTraits,
  isSubmitting = false,
  submissionPhase = 'idle',
  initialTraits
}) => {
  // Set up validation
  const validation = useTraitsValidation(traits, initialTraits || traits);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  
  // Create callback handlers for title and description
  const handleTitleChange = useCallback((title: string) => {
    updateTraitField('title', title);
  }, [updateTraitField]);
  
  const handleDescriptionChange = useCallback((description: string) => {
    updateTraitField('description', description);
  }, [updateTraitField]);
  
  // Handler for field blur to mark fields as touched for validation
  const handleFieldBlur = useCallback((field: keyof TraitsData) => {
    validation.markFieldTouched(field);
    // For development debugging
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Field touched: ${field}`);
    }
  }, [validation]);
  
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
  
  // Determine button disabled state
  const isDisabled = !artworkUploaded || !validation.isValid || isSubmitting;
  
  // Get button text based on submission phase
  const getButtonText = (): string => {
    switch(submissionPhase) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'success':
        return '✓ Submission Complete';
      case 'error':
        return 'Try Again';
      default:
        return 'Submit to Memes';
    }
  };
  
  // Get button class based on phase
  const getButtonClass = (): string => {
    switch(submissionPhase) {
      case 'success':
        return 'tw-bg-green-600 hover:tw-bg-green-700';
      case 'error':
        return 'tw-bg-red-600 hover:tw-bg-red-700';
      default:
        return '';
    }
  };
  
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6 tw-relative tw-pb-20">
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
          onTitleBlur={() => handleFieldBlur('title')}
          onDescriptionBlur={() => handleFieldBlur('description')}
        />

        {/* Validation error summary */}
        <ValidationSummary 
          errors={validation.errors}
          show={showErrorSummary && validation.submitAttempted && !validation.isValid}
          onErrorClick={validation.focusFirstInvalidField}
          className="tw-mt-2"
        />

        {/* Traits Component */}
        <MemesArtSubmissionTraits
          traits={traits}
          setTraits={setTraits}
          validationErrors={validation.errors}
          onFieldBlur={handleFieldBlur}
        />
      </div>

      {/* Submit Button - Fixed at bottom */}
      <div className="tw-fixed tw-bottom-0 tw-left-0 tw-w-full tw-bg-iron-950/80 tw-backdrop-blur-sm tw-py-4 tw-px-6 tw-z-10 tw-border-t tw-border-iron-800">
        <div className="tw-container tw-mx-auto tw-flex tw-justify-end">
          <div className={`tw-transition-all tw-duration-300 ${getButtonClass()}`}>
            <PrimaryButton
              onClicked={handleSubmit}
              loading={isSubmitting && submissionPhase !== 'success' && submissionPhase !== 'error'}
              disabled={isDisabled || submissionPhase === 'success'}
              padding="tw-px-8 tw-py-3"
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
