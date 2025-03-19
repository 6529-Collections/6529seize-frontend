import React from "react";
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
  readonly onTitleChange: (title: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly setTraits: (traits: TraitsData) => void;
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
  onTitleChange,
  onDescriptionChange,
  setTraits
}) => {
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
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
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

export default ArtworkStep;