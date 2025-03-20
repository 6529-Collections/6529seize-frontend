import React, { useCallback } from "react";
import PrimaryButton from "../../../../utils/button/PrimaryButton";
import { TraitsData } from "../types/TraitsData";
import MemesArtSubmissionFile from "../../MemesArtSubmissionFile";
import ArtworkDetails from "../details/ArtworkDetails";
import MemesArtSubmissionTraits from "../../MemesArtSubmissionTraits";
import { SubmissionPhase } from "../ui/SubmissionProgress";

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
  submissionPhase = 'idle'
}) => {
  // Create callback handlers for title and description
  const handleTitleChange = useCallback((title: string) => {
    updateTraitField('title', title);
  }, [updateTraitField]);
  
  const handleDescriptionChange = useCallback((description: string) => {
    updateTraitField('description', description);
  }, [updateTraitField]);
  
  // Determine button disabled state
  const isDisabled = !artworkUploaded || !traits.title || isSubmitting;
  
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
        />

        {/* Traits Component */}
        <MemesArtSubmissionTraits
          traits={traits}
          setTraits={setTraits}
        />
      </div>

      {/* Submit Button - Fixed at bottom */}
      <div className="tw-fixed tw-bottom-0 tw-left-0 tw-w-full tw-bg-iron-950/80 tw-backdrop-blur-sm tw-py-4 tw-px-6 tw-z-10 tw-border-t tw-border-iron-800">
        <div className="tw-container tw-mx-auto tw-flex tw-justify-end">
          <PrimaryButton
            onClicked={onSubmit}
            loading={isSubmitting && submissionPhase !== 'success' && submissionPhase !== 'error'}
            disabled={isDisabled || submissionPhase === 'success'}
            padding="tw-px-8 tw-py-3"
            className={`tw-transition-all tw-duration-300 ${getButtonClass()}`}
          >
            {getButtonText()}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(ArtworkStep);
