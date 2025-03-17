import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import PrimaryButton from "../../utils/button/PrimaryButton";
import MemesArtSubmissionTraits from "./MemesArtSubmissionTraits";
import MemesArtSubmissionFile from "./MemesArtSubmissionFile";

interface MemesArtSubmissionProps {
  readonly onCancel: () => void;
  readonly onSubmit: (artwork: {
    imageUrl: string;
    traits: TraitsData;
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

const MemesArtSubmission: React.FC<MemesArtSubmissionProps> = ({
  onCancel,
  onSubmit,
}) => {
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
    typeCardNumber: 400
  });

  // Helper function to get current user profile info
  const getUserProfile = () => {
    // This should be replaced with actual user profile name from context/API
    return "User's Profile Name";
  };

  // Initialize traits with profile info
  useEffect(() => {
    const userProfile = getUserProfile();
    setTraits(prev => ({
      ...prev,
      artist: userProfile,
      seizeArtistProfile: userProfile
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

  const handleSubmit = () => {
    onSubmit({
      imageUrl: artworkUrl,
      traits: traits
    });
  };

  return (
    <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-h-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="tw-w-full tw-bg-gradient-to-b tw-from-iron-950 tw-via-iron-950/95 tw-to-iron-900/90 tw-rounded-2xl tw-p-8 tw-relative tw-border tw-border-iron-800/30 tw-backdrop-blur"
      >
        {/* Ambient background effect */}
        <div className="tw-absolute tw-inset-0 tw-rounded-2xl tw-overflow-hidden">
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

          {/* File Selection Component */}
          <MemesArtSubmissionFile
            artworkUploaded={artworkUploaded}
            artworkUrl={artworkUrl}
            setArtworkUploaded={setArtworkUploaded}
            handleFileSelect={handleFileSelect}
          />

          {/* Traits Component */}
          <MemesArtSubmissionTraits traits={traits} setTraits={setTraits} />

          {/* Submit Button */}
          <div className="tw-mt-8 tw-flex tw-justify-center">
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
      </motion.div>
    </div>
  );
};

export default MemesArtSubmission;
