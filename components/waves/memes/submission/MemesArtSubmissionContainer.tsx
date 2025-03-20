import React from "react";
import { SubmissionStep, stepEnumToIndex } from "./types/Steps";
import ModalLayout from "./layout/ModalLayout";
import Stepper from "./ui/Stepper";
import AgreementStep from "./steps/AgreementStep";
import ArtworkStep from "./steps/ArtworkStep";
import { useArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";
import { ApiWave } from "../../../../generated/models/ApiWave";

interface MemesArtSubmissionContainerProps {
  readonly onClose: () => void;
  readonly wave: ApiWave;
}


/**
 * MemesArtSubmissionContainer - Main container component for the artwork submission flow
 *
 * This component has been simplified by:
 * 1. Moving form state management to a custom hook with reducer pattern
 * 2. Extracting the modal layout to a separate component
 * 3. Using an enum with a component map for cleaner step routing
 * 4. Using direct component composition instead of component injection
 */
const MemesArtSubmissionContainer: React.FC<
  MemesArtSubmissionContainerProps
> = ({ onClose, wave }) => {
  // Use the form hook to manage all state
  const form = useArtworkSubmissionForm();

  // Handle final submission
  const handleSubmit = () => {
    // Get submission data including all traits and image
    const data = form.getSubmissionData();
    console.log(data)
    // TODO: Handle the actual submission with data
  };

  // Map of steps to their corresponding components
  const stepComponents = {
    [SubmissionStep.AGREEMENT]: (
      <AgreementStep
        agreements={form.agreements}
        setAgreements={form.setAgreements}
        onContinue={form.handleContinueFromTerms}
      />
    ),
    [SubmissionStep.ARTWORK]: (
      <ArtworkStep
        traits={form.traits}
        artworkUploaded={form.artworkUploaded}
        artworkUrl={form.artworkUrl}
        setArtworkUploaded={form.setArtworkUploaded}
        handleFileSelect={form.handleFileSelect}
        onSubmit={handleSubmit}
        updateTraitField={form.updateTraitField}
        setTraits={form.setTraits}
      />
    ),
  };

  return (
    <ModalLayout title="Submit Artwork to Memes" onCancel={onClose}>
      {/* Stepper */}
      <Stepper
        currentStep={stepEnumToIndex(form.currentStep)}
        totalSteps={Object.keys(stepComponents).length}
      />

      {/* Step Content - Render the current step from the map */}
      {stepComponents[form.currentStep]}
    </ModalLayout>
  );
};

export default MemesArtSubmissionContainer;
