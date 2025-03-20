import { useState, useEffect, useRef, useCallback } from "react";
import { TraitsData } from "../types/TraitsData";
import { SubmissionStep } from "../types/Steps";
import { useAuth } from "../../../../auth/Auth";

/**
 * Custom hook to manage artwork submission form state
 */
export function useArtworkSubmissionForm() {
  const { connectedProfile } = useAuth();

  // Step tracking
  const [currentStep, setCurrentStep] = useState<SubmissionStep>(
    SubmissionStep.AGREEMENT
  );

  // Agreement state
  const [agreements, setAgreements] = useState(true);

  // Artwork state
  const [artworkUploaded, setArtworkUploaded] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState("");

  // Import the pre-computed initial values to avoid circular dependency
  const { initialTraits } = require("../../traits/schema");
  const [traits, setTraits] = useState<TraitsData>(initialTraits);
  
  // Keep a reference to important field values that need to be preserved
  const fieldValuesRef = useRef<Partial<TraitsData>>({
    title: initialTraits.title || "",
    description: initialTraits.description || "",
  });
  
  // Flag to track if we're in the middle of an update
  const isUpdatingRef = useRef<boolean>(false);
  
  // Create a safe version of setTraits that guarantees we preserve fields
  const safeSetTraits = useCallback((traitsOrUpdater: TraitsData | ((prev: TraitsData) => TraitsData)) => {
    // Set the updating flag
    isUpdatingRef.current = true;
    
    // Log the update for debugging
    console.log('useArtworkSubmissionForm: safeSetTraits called, preserving:', fieldValuesRef.current);
    
    setTraits(prev => {
      // If traitsOrUpdater is a function, call it to get the new state
      const newTraits = typeof traitsOrUpdater === 'function' 
        ? traitsOrUpdater(prev) 
        : traitsOrUpdater;
      
      // Preserve critical fields
      const mergedTraits = {
        ...newTraits,
        // Only use fieldValuesRef if the new traits don't have meaningful values
        title: newTraits.title || fieldValuesRef.current.title || prev.title || "",
        description: newTraits.description || fieldValuesRef.current.description || prev.description || "",
      };
      
      // Update our refs with the new values
      if (mergedTraits.title) fieldValuesRef.current.title = mergedTraits.title;
      if (mergedTraits.description) fieldValuesRef.current.description = mergedTraits.description;
      
      // Return the merged traits
      return mergedTraits;
    });
    
    // Clear the updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, []);
  
  // Track changes to critical fields from the traits state
  useEffect(() => {
    // Only update refs if we're not in the middle of an update to prevent infinite loops
    if (!isUpdatingRef.current) {
      if (traits.title && traits.title !== fieldValuesRef.current.title) {
        console.log('useArtworkSubmissionForm: updating title ref to:', traits.title);
        fieldValuesRef.current.title = traits.title;
      }
      
      if (traits.description && traits.description !== fieldValuesRef.current.description) {
        console.log('useArtworkSubmissionForm: updating description ref to:', traits.description);
        fieldValuesRef.current.description = traits.description;
      }
    }
  }, [traits.title, traits.description]);

  // Initialize traits with profile info
  useEffect(() => {
    const userProfile = connectedProfile?.profile?.handle ?? "";
    safeSetTraits(prev => ({
      ...prev,
      artist: userProfile,
      seizeArtistProfile: userProfile,
    }));
  }, [connectedProfile, safeSetTraits]);

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setArtworkUrl(reader.result as string);
      setArtworkUploaded(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleContinueFromTerms = useCallback(() => {
    setCurrentStep(SubmissionStep.ARTWORK);
  }, []);

  // Enhanced update function
  const updateTraitField = useCallback(<K extends keyof TraitsData>(
    field: K,
    value: TraitsData[K]
  ) => {
    console.log(`updateTraitField: updating ${String(field)} to:`, value);
    
    // Special handling for title and description
    if (field === 'title' && typeof value === 'string') {
      fieldValuesRef.current.title = value;
    } else if (field === 'description' && typeof value === 'string') {
      fieldValuesRef.current.description = value;
    }
    
    // Store value in ref for ALL fields to protect against state loss
    fieldValuesRef.current[field] = value;
    
    // Use our safe setter that preserves important fields
    safeSetTraits(prev => {
      // Create a complete update that includes all our cached values
      const updated = { 
        ...prev,
        ...fieldValuesRef.current, // Apply all cached field values first
        [field]: value // Ensure the specific field being updated gets priority
      };
      
      // Log the update for debugging
      console.log(`updateTraitField: updating ${String(field)}, traits will be:`, updated);
      
      return updated;
    });
  }, [safeSetTraits]);

  // Function to prepare final submission data
  const getSubmissionData = useCallback(() => {
    return {
      imageUrl: artworkUrl,
      traits: {
        ...traits,
        // Use our preserved values as fallbacks
        title: traits.title || fieldValuesRef.current.title || "Artwork Title",
        description: traits.description || fieldValuesRef.current.description || "Artwork for The Memes collection.",
      },
    };
  }, [artworkUrl, traits]);

  return {
    // Current step
    currentStep,

    // Agreement step
    agreements,
    setAgreements,
    handleContinueFromTerms,

    // Artwork step
    artworkUploaded,
    artworkUrl,
    setArtworkUploaded,
    handleFileSelect,

    // Traits
    traits,
    setTraits: safeSetTraits, // Use our safe version
    updateTraitField,

    // Submission
    getSubmissionData,
  };
}