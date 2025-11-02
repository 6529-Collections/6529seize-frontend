"use client";

import { useReducer, useEffect, useCallback } from "react";
import { TraitsData } from "../types/TraitsData";
import { SubmissionStep } from "../types/Steps";
import { useAuth } from "@/components/auth/Auth";
import { getInitialTraitsValues } from "@/components/waves/memes/traits/schema";
import {
  ALLOWED_INTERACTIVE_MEDIA_MIME_TYPE_SET,
  DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE,
  InteractiveMediaMimeType,
} from "../constants/media";

type MediaSource = "upload" | "url";

interface ExternalMediaState {
  url: string;
  mimeType: InteractiveMediaMimeType;
  error: string | null;
  isValid: boolean;
}

type FormAction =
  | { type: "SET_STEP"; payload: SubmissionStep }
  | { type: "SET_AGREEMENTS"; payload: boolean }
  | {
      type: "SET_TRAIT_FIELD";
      payload: { field: keyof TraitsData; value: any };
    }
  | { type: "SET_MULTIPLE_TRAITS"; payload: Partial<TraitsData> }
  | { type: "SET_MEDIA_SOURCE"; payload: MediaSource }
  | { type: "SET_EXTERNAL_MEDIA"; payload: ExternalMediaState }
  | {
      type: "SET_UPLOAD_MEDIA";
      payload: { file: File; artworkUrl: string };
    }
  | { type: "RESET_UPLOAD_MEDIA" };

interface FormState {
  currentStep: SubmissionStep;
  agreements: boolean;
  artworkUploaded: boolean;
  artworkUrl: string;
  traits: TraitsData;
  mediaSource: MediaSource;
  selectedFile: File | null;
  externalMedia: ExternalMediaState;
}

const validateExternalMedia = (
  url: string,
  mimeType: InteractiveMediaMimeType
): { error: string | null; isValid: boolean } => {
  const trimmed = url.trim();
  if (!trimmed) {
    return { error: null, isValid: false };
  }

  if (trimmed.length > 2048) {
    return { error: "URL is too long.", isValid: false };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return { error: "Only https:// URLs are allowed.", isValid: false };
    }
  } catch {
    return { error: "Enter a valid https:// URL.", isValid: false };
  }

  if (!ALLOWED_INTERACTIVE_MEDIA_MIME_TYPE_SET.has(mimeType)) {
    return { error: "Select a supported media type.", isValid: false };
  }

  return { error: null, isValid: true };
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };

    case "SET_AGREEMENTS":
      return { ...state, agreements: action.payload };

    case "SET_TRAIT_FIELD":
      return {
        ...state,
        traits: {
          ...state.traits,
          [action.payload.field]: action.payload.value,
        },
      };

    case "SET_MULTIPLE_TRAITS":
      return {
        ...state,
        traits: {
          ...state.traits,
          ...action.payload,
        },
      };

    case "SET_MEDIA_SOURCE": {
      const nextSource = action.payload;
      if (nextSource === "upload") {
        const hasFile = state.selectedFile !== null;
        return {
          ...state,
          mediaSource: nextSource,
          artworkUploaded: hasFile,
          artworkUrl: hasFile ? state.artworkUrl : "",
        };
      }

      return {
        ...state,
        mediaSource: nextSource,
        artworkUploaded: state.externalMedia.isValid,
        artworkUrl: state.externalMedia.isValid
          ? state.externalMedia.url
          : "",
      };
    }

    case "SET_EXTERNAL_MEDIA": {
      const externalMedia = action.payload;
      const shouldApply = state.mediaSource === "url";
      return {
        ...state,
        externalMedia,
        artworkUploaded: shouldApply
          ? externalMedia.isValid
          : state.artworkUploaded,
        artworkUrl:
          shouldApply && externalMedia.isValid
            ? externalMedia.url
            : shouldApply
            ? ""
            : state.artworkUrl,
      };
    }

    case "SET_UPLOAD_MEDIA":
      return {
        ...state,
        selectedFile: action.payload.file,
        artworkUrl: action.payload.artworkUrl,
        artworkUploaded: true,
        mediaSource: "upload",
      };

    case "RESET_UPLOAD_MEDIA": {
      const shouldFallbackToExternal =
        state.mediaSource === "url" && state.externalMedia.isValid;
      return {
        ...state,
        selectedFile: null,
        artworkUrl: shouldFallbackToExternal ? state.externalMedia.url : "",
        artworkUploaded: shouldFallbackToExternal,
      };
    }

    default:
      return state;
  }
}

export function useArtworkSubmissionForm() {
  const { connectedProfile } = useAuth();
  const initialTraits = getInitialTraitsValues();

  const initialState: FormState = {
    currentStep: SubmissionStep.AGREEMENT,
    agreements: false,
    artworkUploaded: false,
    artworkUrl: "",
    traits: initialTraits,
    mediaSource: "upload",
    selectedFile: null,
    externalMedia: {
      url: "",
      mimeType: DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE,
      error: null,
      isValid: false,
    },
  };

  const [state, dispatch] = useReducer(formReducer, initialState);

  const setMediaSource = useCallback(
    (mode: MediaSource) => {
      dispatch({ type: "SET_MEDIA_SOURCE", payload: mode });
    },
    [dispatch]
  );

  const setExternalMedia = useCallback(
    (url: string, mimeType: InteractiveMediaMimeType) => {
      const { error, isValid } = validateExternalMedia(url, mimeType);
      dispatch({
        type: "SET_EXTERNAL_MEDIA",
        payload: { url, mimeType, error, isValid },
      });
    },
    [dispatch]
  );

  const clearExternalMedia = useCallback(() => {
    dispatch({
      type: "SET_EXTERNAL_MEDIA",
      payload: {
        url: "",
        mimeType: state.externalMedia.mimeType,
        error: null,
        isValid: false,
      },
    });
  }, [dispatch, state.externalMedia.mimeType]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch({
          type: "SET_UPLOAD_MEDIA",
          payload: { file, artworkUrl: reader.result as string },
        });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  const handleContinueFromTerms = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: SubmissionStep.ARTWORK });
  }, []);

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

  const getSubmissionData = useCallback(() => {
    const { traits, artworkUrl } = state;
    return {
      imageUrl: artworkUrl,
      traits: {
        ...traits,
        title: traits.title ?? "Artwork Title",
        description:
          traits.description ?? "Artwork for The Memes collection.",
      },
    };
  }, [state]);

  const getMediaSelection = useCallback(
    () => ({
      mediaSource: state.mediaSource,
      selectedFile: state.selectedFile,
      externalUrl: state.externalMedia.url,
      externalMimeType: state.externalMedia.mimeType,
      isExternalValid: state.externalMedia.isValid,
    }),
    [state]
  );

  const setArtworkUploaded = useCallback(
    (uploaded: boolean) => {
      if (!uploaded) {
        if (state.mediaSource === "url") {
          dispatch({
            type: "SET_EXTERNAL_MEDIA",
            payload: {
              url: "",
              mimeType: state.externalMedia.mimeType,
              error: null,
              isValid: false,
            },
          });
        } else {
          dispatch({ type: "RESET_UPLOAD_MEDIA" });
        }
      }
    },
    [state.mediaSource, state.externalMedia.mimeType, dispatch]
  );

  const updateTraitField = useCallback(
    <K extends keyof TraitsData>(field: K, value: TraitsData[K]) => {
      dispatch({
        type: "SET_TRAIT_FIELD",
        payload: { field, value },
      });
    },
    []
  );

  const setTraits = useCallback((traitsUpdate: Partial<TraitsData>) => {
    dispatch({ type: "SET_MULTIPLE_TRAITS", payload: traitsUpdate });
  }, []);

  return {
    currentStep: state.currentStep,
    agreements: state.agreements,
    setAgreements: (value: boolean) =>
      dispatch({ type: "SET_AGREEMENTS", payload: value }),
    handleContinueFromTerms,

    artworkUploaded: state.artworkUploaded,
    artworkUrl: state.artworkUrl,
    selectedFile: state.selectedFile,
    mediaSource: state.mediaSource,
    externalMediaUrl: state.externalMedia.url,
    externalMediaMimeType: state.externalMedia.mimeType,
    externalMediaError: state.externalMedia.error,
    isExternalMediaValid: state.externalMedia.isValid,
    setArtworkUploaded,
    setMediaSource,
    setExternalMedia,
    clearExternalMedia,
    handleFileSelect,

    traits: state.traits,
    setTraits,
    updateTraitField,

    getSubmissionData,
    getMediaSelection,
  };
}
