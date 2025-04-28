import { useReducer, useEffect, useCallback } from "react";
import { TraitsData } from "../types/TraitsData";
import { SubmissionStep } from "../types/Steps";
import { useAuth } from "../../../../auth/Auth";

/**
 * Action types for the form reducer - drastically simplified
 */
type FormAction =
  | { type: "SET_STEP"; payload: SubmissionStep }
  | { type: "SET_AGREEMENTS"; payload: boolean }
  | { type: "SET_ARTWORK_UPLOADED"; payload: boolean }
  | { type: "SET_ARTWORK_URL"; payload: string }
  | {
      type: "SET_TRAIT_FIELD";
      payload: { field: keyof TraitsData; value: any };
    }
  | { type: "SET_MULTIPLE_TRAITS"; payload: Partial<TraitsData> };

/**
 * State interface for the form reducer
 */
interface FormState {
  currentStep: SubmissionStep;
  agreements: boolean;
  artworkUploaded: boolean;
  artworkUrl: string;
  traits: TraitsData;
}

/**
 * Ultra-simplified reducer function for the artwork submission form
 */
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };

    case "SET_AGREEMENTS":
      return { ...state, agreements: action.payload };

    case "SET_ARTWORK_UPLOADED":
      return { ...state, artworkUploaded: action.payload };

    case "SET_ARTWORK_URL":
      return { ...state, artworkUrl: action.payload };

    case "SET_TRAIT_FIELD": {
      // Simple direct update - no special handling
      return {
        ...state,
        traits: {
          ...state.traits,
          [action.payload.field]: action.payload.value,
        },
      };
    }

    case "SET_MULTIPLE_TRAITS": {
      // Simple merge - no special handling
      return {
        ...state,
        traits: {
          ...state.traits,
          ...action.payload,
        },
      };
    }

    default:
      return state;
  }
}

/**
 * Extremely simplified hook to manage artwork submission form state
 * Uses uncontrolled inputs for maximum typing performance
 */
export function useArtworkSubmissionForm() {
  const { connectedProfile } = useAuth();

  // Import the pre-computed initial values
  const { initialTraits } = require("../../traits/schema");

  // Create the initial state
  const initialState: FormState = {
    currentStep: SubmissionStep.AGREEMENT,
    agreements: false,
    artworkUploaded: false,
    artworkUrl: "",
    traits: initialTraits,
  };

  // Use reducer for state management
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Extract values for convenience
  const { currentStep, agreements, artworkUploaded, artworkUrl, traits } =
    state;

  // Extremely simple and direct update function
  const updateTraitField = useCallback(
    <K extends keyof TraitsData>(field: K, value: TraitsData[K]) => {
      dispatch({
        type: "SET_TRAIT_FIELD",
        payload: { field, value },
      });
    },
    []
  );

  // Multiple traits update function
  const setTraits = useCallback((traitsUpdate: Partial<TraitsData>) => {
    dispatch({ type: "SET_MULTIPLE_TRAITS", payload: traitsUpdate });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      dispatch({ type: "SET_ARTWORK_URL", payload: reader.result as string });
      dispatch({ type: "SET_ARTWORK_UPLOADED", payload: true });
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle continuing from terms
  const handleContinueFromTerms = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: SubmissionStep.ARTWORK });
  }, []);

  // Initialize traits with profile info
  useEffect(() => {
    const userProfile = connectedProfile?.handle ?? "";
    if (userProfile) {
      dispatch({
        type: "SET_MULTIPLE_TRAITS",
        payload: {
          artist: userProfile,
          seizeArtistProfile: userProfile,
        },
      });
    }
  }, [connectedProfile]);

  // Prepare submission data
  const getSubmissionData = useCallback(() => {
    return {
      imageUrl: artworkUrl,
      traits: {
        ...traits,
        // Ensure these fields have values
        title: traits.title ?? "Artwork Title",
        description: traits.description ?? "Artwork for The Memes collection.",
      },
    };
  }, [artworkUrl, traits]);

  // Return the API for the form
  return {
    // Current step
    currentStep,

    // Agreement step
    agreements,
    setAgreements: (value: boolean) =>
      dispatch({ type: "SET_AGREEMENTS", payload: value }),
    handleContinueFromTerms,

    // Artwork step
    artworkUploaded,
    artworkUrl,
    setArtworkUploaded: (value: boolean) =>
      dispatch({ type: "SET_ARTWORK_UPLOADED", payload: value }),
    handleFileSelect,

    // Traits
    traits,
    setTraits,
    updateTraitField,

    // Submission
    getSubmissionData,
  };
}
