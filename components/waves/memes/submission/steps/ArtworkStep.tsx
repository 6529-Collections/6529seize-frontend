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
  console.log(traits)
  // Create callback handlers for title and description
  const handleTitleChange = useCallback((title: string) => {
    updateTraitField('title', title);
  }, [updateTraitField]);
  
  const handleDescriptionChange = useCallback((description: string) => {
    updateTraitField('description', description);
  }, [updateTraitField]);
  
  return (
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

      {/* Submit Button */}
      <div className="tw-flex tw-justify-end">
        <PrimaryButton
          onClicked={onSubmit}
          loading={false}
          disabled={!artworkUploaded}
          padding="tw-px-6 tw-py-2.5"
        >
          Submit to Memes
        </PrimaryButton>
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary rerenders
export default React.memo(ArtworkStep);
