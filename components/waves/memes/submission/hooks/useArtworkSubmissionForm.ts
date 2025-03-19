import { useState, useEffect } from 'react';
import { TraitsData } from '../types/TraitsData';
import { SubmissionStep, stepIndexToEnum, stepEnumToIndex } from '../types/Steps';
import { useAuth } from '../../../../auth/Auth';
/**
 * Custom hook to manage artwork submission form state
 */
export function useArtworkSubmissionForm() {
  const { connectedProfile } = useAuth();

  // Step tracking
  const [currentStep, setCurrentStep] = useState<SubmissionStep>(SubmissionStep.AGREEMENT);
  const [isSigningWallet, setIsSigningWallet] = useState(false);
  const [walletSignature, setWalletSignature] = useState("");

  // Agreement state
  const [agreements, setAgreements] = useState(true);

  // Artwork state
  const [artworkUploaded, setArtworkUploaded] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState("");

  // Import the pre-computed initial values to avoid circular dependency
  const { initialTraits } = require('../../traits/schema');
  const [traits, setTraits] = useState<TraitsData>(initialTraits);



  // Initialize traits with profile info
  useEffect(() => {
    const userProfile = connectedProfile?.profile?.handle ?? "";
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
