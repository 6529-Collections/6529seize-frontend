import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Stepper from "./ui/Stepper";
import AgreementStep from "./steps/AgreementStep";
import ArtworkStep from "./steps/ArtworkStep";
import ArtworkDetails from "./details/ArtworkDetails";
import MemesArtSubmissionFile from "../MemesArtSubmissionFile";
import MemesArtSubmissionTraits from "../MemesArtSubmissionTraits";
import { TraitsData } from "./types/TraitsData";

interface MemesArtSubmissionContainerProps {
  readonly onCancel: () => void;
  readonly onSubmit: (artwork: {
    imageUrl: string;
    traits: TraitsData;
    signature: string;
  }) => void;
}

const MemesArtSubmissionContainer: React.FC<MemesArtSubmissionContainerProps> = ({
  onCancel,
  onSubmit,
}) => {
  // Step tracking
  const [currentStep, setCurrentStep] = useState(0);
  const [isSigningWallet, setIsSigningWallet] = useState(false);
  const [walletSignature, setWalletSignature] = useState("");

  // Updated to single boolean for agreement
  const [agreements, setAgreements] = useState(true);

  // Artwork state
  const [artworkUploaded, setArtworkUploaded] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState("");

  // Initialize all traits with default values
  const [traits, setTraits] = useState<TraitsData>({
    // Initialize text fields
    title: "",
    description: "",
    artist: "",
    palette: "",
    style: "",
    jewel: "",
    superpower: "",
    dharma: "",
    gear: "",
    clothing: "",
    element: "",
    mystery: "",
    secrets: "",
    weapon: "",
    home: "",
    parent: "",
    sibling: "",
    food: "",
    drink: "",

    // Initialize boolean fields
    punk6529: false,
    gradient: false,
    movement: false,
    dynamic: false,
    interactive: false,
    collab: false,
    om: false,
    threeD: false,
    pepe: false,
    gm: false,
    bonus: false,
    boost: false,
    summer: false,
    tulip: false,

    // Initialize dropdown fields
    memeName: "",

    // Initialize number fields
    pointsPower: 0,
    pointsWisdom: 0,
    pointsLoki: 0,
    pointsSpeed: 0,

    // Initialize read-only fields
    seizeArtistProfile: "",
    typeCard: "Card",
    issuanceMonth: "",
    typeSeason: 11,
    typeMeme: 1,
    typeCardNumber: 400,
  });

  // Helper function to get current user profile info
  const getUserProfile = () => {
    // This should be replaced with actual user profile name from context/API
    return "User's Profile Name";
  };

  // Initialize traits with profile info
  useEffect(() => {
    const userProfile = getUserProfile();
    setTraits((prev) => ({
      ...prev,
      artist: userProfile,
      seizeArtistProfile: userProfile,
    }));
  }, []);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setArtworkUrl(reader.result as string);
      setArtworkUploaded(true);
    };
    reader.readAsDataURL(file);
  };

  // Mock function to simulate wallet signing
  // In a real implementation, this would connect to the user's wallet
  const signWithWallet = async () => {
    setIsSigningWallet(true);

    try {
      // Simulate wallet signing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, this would be the actual signature from the wallet
      const mockSignature =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      setWalletSignature(mockSignature);

      // Move to the next step
      setCurrentStep(1);
    } catch (error) {
      console.error("Error signing with wallet:", error);
      // Handle error (could show error message to user)
    } finally {
      setIsSigningWallet(false);
    }
  };

  const handleContinueFromTerms = () => {
    // Sign the terms with the wallet
    signWithWallet();
  };

  const handleSubmit = () => {
    // Make sure title and description are included as metadata
    // They are stored separately in the UI for prominence, but should be included
    // in the metadata when submitting
    onSubmit({
      imageUrl: artworkUrl,
      traits: {
        ...traits,
        // Ensure title and description are non-empty with fallbacks
        title: traits.title || "Artwork Title",
        description: traits.description || "Artwork for The Memes collection."
      },
      signature: walletSignature,
    });
  };

  return (
    <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-h-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="tw-w-full tw-bg-iron-950 tw-rounded-xl tw-p-8 tw-relative tw-border tw-border-iron-800/30 tw-backdrop-blur">
          {/* Ambient background effect */}
          <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-overflow-hidden">
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-primary-500/4 tw-blur-3xl -tw-top-1/4 -tw-right-1/4" />
            <div className="tw-absolute tw-w-2/3 tw-h-1/2 tw-bg-purple-500/3 tw-blur-3xl tw-top-1/4 -tw-left-1/4" />
            <div className="tw-absolute tw-w-1/2 tw-h-1/2 tw-bg-iron-500/4 tw-blur-3xl -tw-bottom-1/4 -tw-left-1/4" />
          </div>

          {/* Cancel button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={onCancel}
            className="tw-absolute tw-bg-transparent tw-border-0 tw-right-8 tw-top-10 tw-z-20 tw-text-iron-400 tw-text-sm tw-font-medium hover:tw-text-iron-100 tw-transition-colors"
          >
            Cancel
          </motion.button>

          <div className="tw-relative tw-z-10">
            {/* Modern Header */}
            <motion.h3
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tw-text-3xl tw-font-semibold tw-text-iron-100"
            >
              Submit Artwork to Memes
            </motion.h3>

            {/* Stepper */}
            <Stepper currentStep={currentStep} totalSteps={2} />

            {/* Step Content */}
            {currentStep === 0 ? (
              <AgreementStep
                agreements={agreements}
                setAgreements={setAgreements}
                onContinue={handleContinueFromTerms}
                isSigningWallet={isSigningWallet}
              />
            ) : (
              <ArtworkStep
                fileUploadComponent={
                  <MemesArtSubmissionFile
                    artworkUploaded={artworkUploaded}
                    artworkUrl={artworkUrl}
                    setArtworkUploaded={setArtworkUploaded}
                    handleFileSelect={handleFileSelect}
                  />
                }
                detailsComponent={
                  <ArtworkDetails
                    title={traits.title}
                    description={traits.description}
                    onTitleChange={(title) => setTraits({ ...traits, title })}
                    onDescriptionChange={(description) => setTraits({ ...traits, description })}
                  />
                }
                traitsComponent={
                  <MemesArtSubmissionTraits
                    traits={traits}
                    setTraits={setTraits}
                  />
                }
                isSubmitDisabled={!artworkUploaded}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </motion.div>
      <div className="tw-inline-block"></div>
    </div>
  );
};

export default MemesArtSubmissionContainer;