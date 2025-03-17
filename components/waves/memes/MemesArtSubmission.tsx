import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PrimaryButton from "../../utils/button/PrimaryButton";
import MemesArtSubmissionTraits from "./MemesArtSubmissionTraits";
import MemesArtSubmissionFile from "./MemesArtSubmissionFile";

interface MemesArtSubmissionProps {
  readonly onCancel: () => void;
  readonly onSubmit: (artwork: {
    imageUrl: string;
    traits: TraitsData;
    signature: string; // Wallet signature for terms agreement
  }) => void;
}

// Type definition matching the one in MemesArtSubmissionTraits.tsx
interface TraitsData {
  // Text fields
  artist: string;
  palette: string;
  style: string;
  jewel: string;
  superpower: string;
  dharma: string;
  gear: string;
  clothing: string;
  element: string;
  mystery: string;
  secrets: string;
  weapon: string;
  home: string;
  parent: string;
  sibling: string;
  food: string;
  drink: string;

  // Boolean fields
  punk6529: boolean;
  gradient: boolean;
  movement: boolean;
  dynamic: boolean;
  interactive: boolean;
  collab: boolean;
  om: boolean;
  threeD: boolean;
  pepe: boolean;
  gm: boolean;
  bonus: boolean;
  boost: boolean;
  summer: boolean;
  tulip: boolean;

  // Dropdown fields
  memeName: string;

  // Number fields
  pointsPower: number;
  pointsWisdom: number;
  pointsLoki: number;
  pointsSpeed: number;

  // Read-only fields
  seizeArtistProfile: string;
  typeCard: string;
  issuanceMonth: string;
  typeSeason: number;
  typeMeme: number;
  typeCardNumber: number;
}

// Step 1 Component - Agreement to terms
const AgreementStep: React.FC<{
  agreements: boolean;
  setAgreements: (agreed: boolean) => void;
  onContinue: () => void;
  isSigningWallet: boolean;
}> = ({ agreements, setAgreements, onContinue, isSigningWallet }) => {
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div className="tw-text-iron-100 tw-text-sm">
        Before submitting your artwork to The Memes, please review and agree to
        the following terms:
      </div>

      <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-iron-900/40 tw-rounded-lg tw-p-5 tw-border tw-border-iron-800/50 tw-border-solid">
        <button
          onClick={() => setAgreements(!agreements)}
          className="tw-flex tw-items-start tw-gap-3 tw-w-full tw-text-left hover:tw-opacity-80 tw-transition-opacity tw-bg-transparent tw-border-0"
        >
          <div className="tw-flex-shrink-0 tw-mt-0.5">
            <div
              className={`tw-w-5 tw-h-5 tw-rounded tw-border ${
                agreements
                  ? "tw-bg-primary-500 tw-border-primary-600"
                  : "tw-bg-iron-800/70 tw-border-iron-700"
              } tw-flex tw-items-center tw-justify-center tw-transition-colors`}
            >
              {agreements && (
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  className="tw-w-3 tw-h-3 tw-text-white tw-flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="tw-text-xs tw-text-iron-300">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </div>
        </button>
      </div>

      <div className="tw-mt-4 tw-flex tw-justify-center">
        <PrimaryButton
          onClicked={onContinue}
          loading={isSigningWallet}
          disabled={!agreements}
          padding="tw-px-6 tw-py-2.5"
        >
          {isSigningWallet ? "Signing with wallet..." : "I Agree & Continue"}
        </PrimaryButton>
      </div>
    </div>
  );
};

// Stepper component
const Stepper: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-mb-8 tw-w-full tw-max-w-md tw-mx-auto">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          {/* Step circle */}
          <div className="tw-flex tw-flex-col tw-items-center">
            <div
              className={`tw-w-8 tw-h-8 tw-rounded-full tw-flex tw-items-center tw-justify-center ${
                index < currentStep
                  ? "tw-bg-primary-500 tw-text-white"
                  : index === currentStep
                  ? "tw-bg-primary-400 tw-text-white"
                  : "tw-bg-iron-800 tw-text-iron-400"
              } tw-transition-colors`}
            >
              {index < currentStep ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="tw-w-4 tw-h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="tw-text-xs tw-mt-1 tw-text-iron-400">
              {index === 0 ? "Terms" : "Artwork"}
            </div>
          </div>

          {/* Connector line between steps (except after the last step) */}
          {index < totalSteps - 1 && (
            <div
              className={`tw-h-[2px] tw-flex-1 tw-max-w-[100px] ${
                index < currentStep ? "tw-bg-primary-500" : "tw-bg-iron-800"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const MemesArtSubmission: React.FC<MemesArtSubmissionProps> = ({
  onCancel,
  onSubmit,
}) => {
  // Step tracking
  const [currentStep, setCurrentStep] = useState(0);
  const [isSigningWallet, setIsSigningWallet] = useState(false);
  const [walletSignature, setWalletSignature] = useState("");

  // Updated to single boolean for agreement
  const [agreements, setAgreements] = useState(false);

  // Artwork state
  const [artworkUploaded, setArtworkUploaded] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState("");

  // Initialize all traits with default values
  const [traits, setTraits] = useState<TraitsData>({
    // Initialize text fields
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
    onSubmit({
      imageUrl: artworkUrl,
      traits: traits,
      signature: walletSignature,
    });
  };

  return (
    <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-h-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="tw-w-full tw-bg-gradient-to-b tw-from-iron-950 tw-via-iron-950/95 tw-to-iron-900/90 tw-rounded-xl tw-p-8 tw-relative tw-border tw-border-iron-800/30 tw-backdrop-blur">
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
            className="tw-absolute tw-bg-transparent tw-border-0 tw-right-6 tw-top-6 tw-z-20 tw-text-iron-400 tw-text-sm tw-font-medium hover:tw-text-iron-100 tw-transition-colors"
          >
            Cancel
          </motion.button>

          <div className="tw-relative tw-z-10">
            {/* Modern Header */}
            <motion.h3
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-4"
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
              <div className="tw-flex tw-flex-col">
                {/* File Selection Component */}
                <MemesArtSubmissionFile
                  artworkUploaded={artworkUploaded}
                  artworkUrl={artworkUrl}
                  setArtworkUploaded={setArtworkUploaded}
                  handleFileSelect={handleFileSelect}
                />

                {/* Traits Component */}
                <MemesArtSubmissionTraits
                  traits={traits}
                  setTraits={setTraits}
                />

                {/* Submit Button */}
                <div className="tw-mt-4 tw-flex tw-justify-end">
                  <PrimaryButton
                    onClicked={handleSubmit}
                    loading={false}
                    disabled={!artworkUploaded}
                    padding="tw-px-6 tw-py-2.5"
                  >
                    Submit to Memes
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <div className="tw-inline-block"></div>
    </div>
  );
};

export default MemesArtSubmission;
