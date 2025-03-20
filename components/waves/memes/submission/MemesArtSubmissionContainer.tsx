import React, { useState, useRef } from "react";
import { SubmissionStep, stepEnumToIndex } from "./types/Steps";
import ModalLayout from "./layout/ModalLayout";
import Stepper from "./ui/Stepper";
import AgreementStep from "./steps/AgreementStep";
import ArtworkStep from "./steps/ArtworkStep";
import { useArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";
import { useArtworkSubmissionMutation } from "./hooks/useArtworkSubmissionMutation";
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
 * 5. Using a separate mutation hook for API submission
 */
const MemesArtSubmissionContainer: React.FC<
  MemesArtSubmissionContainerProps
> = ({ onClose, wave }) => {
  // Use the form hook to manage all state
  const form = useArtworkSubmissionForm();
  
  // Use the mutation hook for submission
  const { submitArtwork, isSubmitting, uploadProgress, isUploading } = useArtworkSubmissionMutation();
  
  // Keep track of the selected file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Store the file for later submission
    setSelectedFile(file);
    
    // Also pass to the form hook for preview
    form.handleFileSelect(file);
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!selectedFile) {
      return null;
    }
    
    // Get submission data including all traits
    const { traits } = form.getSubmissionData();
    
    // Submit the artwork with the wave ID and selected file
    const result = await submitArtwork(
      {
        imageFile: selectedFile,
        traits,
        waveId: wave.id
      },
      {
        onSuccess: () => {
          // Close the modal on success
          onClose();
        }
      }
    );
    
    return result;
  };

  // Build progress message based on upload state
  const getUploadStatusMessage = () => {
    if (isUploading) {
      return `Uploading artwork: ${uploadProgress}%`;
    }
    return isSubmitting ? "Processing submission..." : "";
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
        handleFileSelect={handleFileSelect}
        onSubmit={handleSubmit}
        updateTraitField={form.updateTraitField}
        setTraits={form.setTraits}
        isSubmitting={isSubmitting}
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

      {/* Upload progress indicator */}
      {isSubmitting && (
        <div className="tw-w-full tw-bg-iron-800 tw-p-2 tw-text-center tw-my-4">
          {getUploadStatusMessage()}
        </div>
      )}

      {/* Step Content - Render the current step from the map */}
      {stepComponents[form.currentStep]}
    </ModalLayout>
  );
};

export default MemesArtSubmissionContainer;
