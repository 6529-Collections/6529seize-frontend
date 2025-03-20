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
  
  // Create a throttled/debounced version of setTraits for better performance
  const safeSetTraits = useCallback((traitsOrUpdater: TraitsData | ((prev: TraitsData) => TraitsData)) => {
    // Set the updating flag to prevent effect cascades
    isUpdatingRef.current = true;
    
    // Completely disable console.log in all environments to improve performance
    // console.log('useArtworkSubmissionForm: safeSetTraits called');
    
    setTraits(prev => {
      // If traitsOrUpdater is a function, call it to get the new state
      const newTraits = typeof traitsOrUpdater === 'function' 
        ? traitsOrUpdater(prev) 
        : traitsOrUpdater;
      
      // Preserve critical fields
      const mergedTraits = {
        ...prev, // Start with previous traits
        ...newTraits, // Apply new trait values
        // Special handling for critical fields - ensure they're preserved properly
        title: newTraits.title || fieldValuesRef.current.title || prev.title || "",
        description: newTraits.description || fieldValuesRef.current.description || prev.description || "",
      };
      
      // Update our refs with the new values - only if they have content
      if (mergedTraits.title) fieldValuesRef.current.title = mergedTraits.title;
      if (mergedTraits.description) fieldValuesRef.current.description = mergedTraits.description;
      
      // Return the merged traits
      return mergedTraits;
    });
    
    // Use a very short delay to prevent reentrancy issues
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 5);
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

  // Create a debounced version of the update function for text fields
  const debouncedUpdateRef = useRef<{
    timeout: NodeJS.Timeout | null;
    field: keyof TraitsData | null;
    value: any;
  }>({
    timeout: null,
    field: null,
    value: null
  });
  
  // Enhanced update function with debouncing for text inputs
  const updateTraitField = useCallback(<K extends keyof TraitsData>(
    field: K,
    value: TraitsData[K]
  ) => {
    // Removed all console.log calls for performance
    
    // Store value in ref for ALL fields immediately
    fieldValuesRef.current[field] = value;
    
    // Special handling for text fields that need fast local updates but debounced global updates
    if ((field === 'title' || field === 'description') && typeof value === 'string') {
      // If we already have a debounce timer for this field, clear it
      if (debouncedUpdateRef.current.timeout && debouncedUpdateRef.current.field === field) {
        clearTimeout(debouncedUpdateRef.current.timeout);
      }
      
      // Set a new debounce timer with increased delay (250ms)
      debouncedUpdateRef.current = {
        field,
        value,
        timeout: setTimeout(() => {
          // When the timer fires, update the global state
          safeSetTraits(prev => {
            // Create a new object rather than spreading the old one
            const newTraits = {};
            // Set only the specific field we're updating
            newTraits[field] = value;
            return newTraits as TraitsData;
          });
          
          // Clear our debounce data
          debouncedUpdateRef.current = {
            timeout: null,
            field: null,
            value: null
          };
        }, 250) // Increased debounce to 250ms for text inputs
      };
    } else {
      // For non-text fields, update immediately without debouncing
      safeSetTraits(() => {
        // Return a minimal update object with just the field being changed
        const update = {} as Partial<TraitsData>;
        update[field] = value;
        return update as TraitsData;
      });
    }
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