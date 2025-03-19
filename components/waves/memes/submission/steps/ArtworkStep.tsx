import React from "react";
import PrimaryButton from "../../../../utils/button/PrimaryButton";
import { TraitsData } from "../types/TraitsData";

interface ArtworkStepProps {
  readonly fileUploadComponent: React.ReactNode;
  readonly detailsComponent: React.ReactNode;
  readonly traitsComponent: React.ReactNode;
  readonly isSubmitDisabled: boolean;
  readonly onSubmit: () => void;
}

/**
 * ArtworkStep - Container component for the artwork submission step
 * 
 * This component focuses on layout and structure rather than direct component coupling,
 * allowing the parent container to determine which components to render in each section.
 */
const ArtworkStep: React.FC<ArtworkStepProps> = ({
  fileUploadComponent,
  detailsComponent,
  traitsComponent,
  isSubmitDisabled,
  onSubmit,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      {/* File Selection Component */}
      {fileUploadComponent}

      {/* Artwork Title and Description */}
      {detailsComponent}

      {/* Traits Component */}
      {traitsComponent}

      {/* Submit Button */}
      <div className="tw-flex tw-justify-end">
        <PrimaryButton
          onClicked={onSubmit}
          loading={false}
          disabled={isSubmitDisabled}
          padding="tw-px-6 tw-py-2.5"
        >
          Submit to Memes
        </PrimaryButton>
      </div>
    </div>
  );
};

export default ArtworkStep;