import React, { useCallback } from "react";
import PrimaryButton from "../../../../utils/button/PrimaryButton";
import { TraitsData } from "../types/TraitsData";
import MemesArtSubmissionFile from "../../MemesArtSubmissionFile";
import ArtworkDetails from "../details/ArtworkDetails";
import MemesArtSubmissionTraits from "../../MemesArtSubmissionTraits";

interface ArtworkStepProps {
  readonly traits: TraitsData;
  readonly artworkUploaded: boolean;
  readonly artworkUrl: string;
  readonly setArtworkUploaded: (uploaded: boolean) => void;
  readonly handleFileSelect: (file: File) => void;
  readonly onSubmit: () => void;
  readonly updateTraitField: <K extends keyof TraitsData>(field: K, value: TraitsData[K]) => void;
  readonly setTraits: (traits: Partial<TraitsData>) => void;
}

/**
 * ArtworkStep - Component for the artwork submission step
 * 
 * This component directly includes all the needed components for
 * the artwork submission process in a clear, sequential layout.
 * The submit button is fixed at the bottom of the page.
 */
const ArtworkStep: React.FC<ArtworkStepProps> = ({
  traits,
  artworkUploaded,
  artworkUrl,
  setArtworkUploaded,
  handleFileSelect,
  onSubmit,
  updateTraitField,
  setTraits
}) => {
  // Create callback handlers for title and description
  const handleTitleChange = useCallback((title: string) => {
    updateTraitField('title', title);
  }, [updateTraitField]);
  
  const handleDescriptionChange = useCallback((description: string) => {
    updateTraitField('description', description);
  }, [updateTraitField]);
  
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
            loading={false}
            disabled={!!artworkUploaded}
            padding="tw-px-8 tw-py-3"
          >
            Submit to Memes
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(ArtworkStep);
