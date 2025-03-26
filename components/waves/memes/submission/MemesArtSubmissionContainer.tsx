import React, { useState, useCallback, useEffect } from "react";
import { SubmissionStep } from "./types/Steps";
import ModalLayout from "./layout/ModalLayout";
import AgreementStep from "./steps/AgreementStep";
import ArtworkStep from "./steps/ArtworkStep";
import { useArtworkSubmissionForm } from "./hooks/useArtworkSubmissionForm";
import { useArtworkSubmissionMutation } from "./hooks/useArtworkSubmissionMutation";
import { SubmissionPhase } from "./ui/SubmissionProgress";
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
 * 6. Using a dedicated progress component for visual feedback
 */
const MemesArtSubmissionContainer: React.FC<
  MemesArtSubmissionContainerProps
> = ({ onClose, wave }) => {
  // Use the form hook to manage all state
  const form = useArtworkSubmissionForm();

  // Use the mutation hook for submission
  const {
    submitArtwork,
    uploadProgress,
    submissionPhase,
    submissionError,
    isSubmitting,
  } = useArtworkSubmissionMutation();

  // Keep track of the selected file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
  } | null>(null);

  // Auto-close on successful submission after a short delay
  useEffect(() => {
    if (submissionPhase === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 1200); // Brief delay to show success state

      return () => clearTimeout(timer);
    }
  }, [submissionPhase, onClose]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Store the file for later submission
    setSelectedFile(file);
    setFileInfo({
      name: file.name,
      size: file.size,
    });

    // Also pass to the form hook for preview
    form.handleFileSelect(file);
  };

  // Phase change handler
  const handlePhaseChange = useCallback((phase: SubmissionPhase) => {
    // Any additional phase-specific handling can be done here
    console.log(`Submission phase changed to: ${phase}`);
  }, []);

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
        waveId: wave.id,
        termsOfService: wave.participation.terms,
      },
      {
        onPhaseChange: handlePhaseChange,
      }
    );

    return result;
  };

  // Map of steps to their corresponding components
  const stepComponents = {
    [SubmissionStep.AGREEMENT]: (
      <AgreementStep
        wave={wave}
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
        onCancel={onClose}
        updateTraitField={form.updateTraitField}
        setTraits={form.setTraits}
        isSubmitting={isSubmitting}
        submissionPhase={submissionPhase}
        uploadProgress={uploadProgress}
        fileInfo={fileInfo}
        submissionError={submissionError}
      />
    ),
  };

  return (
    <ModalLayout title="Submit Artwork to Memes" onCancel={onClose}>
      {/* Step Content - Render the current step from the map */}
      {stepComponents[form.currentStep]}
    </ModalLayout>
  );
};

export default MemesArtSubmissionContainer;
