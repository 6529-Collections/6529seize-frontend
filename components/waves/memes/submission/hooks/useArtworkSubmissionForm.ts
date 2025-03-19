import { useState, useEffect } from 'react';
import { TraitsData } from '../types/TraitsData';
import { SubmissionStep, stepIndexToEnum, stepEnumToIndex } from '../types/Steps';

/**
 * Custom hook to manage artwork submission form state
 */
export function useArtworkSubmissionForm() {
  // Step tracking
  const [currentStep, setCurrentStep] = useState<SubmissionStep>(SubmissionStep.AGREEMENT);
  const [isSigningWallet, setIsSigningWallet] = useState(false);
  const [walletSignature, setWalletSignature] = useState("");

  // Agreement state
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
      setCurrentStep(SubmissionStep.ARTWORK);
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

  const updateTraitField = <K extends keyof TraitsData>(
    field: K, 
    value: TraitsData[K]
  ) => {
    setTraits(prev => ({ ...prev, [field]: value }));
  };

  // Function to prepare final submission data
  const getSubmissionData = () => {
    return {
      imageUrl: artworkUrl,
      traits: {
        ...traits,
        // Ensure title and description are non-empty with fallbacks
        title: traits.title || "Artwork Title",
        description: traits.description || "Artwork for The Memes collection."
      },
      signature: walletSignature,
    };
  };

  return {
    // Current step
    currentStep,
    
    // Agreement step
    agreements,
    setAgreements,
    isSigningWallet,
    handleContinueFromTerms,
    
    // Artwork step
    artworkUploaded,
    artworkUrl,
    setArtworkUploaded,
    handleFileSelect,
    
    // Traits
    traits,
    setTraits,
    updateTraitField,
    
    // Submission
    getSubmissionData,
  };
}