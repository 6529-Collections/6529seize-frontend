"use client";

import { useReducer, useEffect, useCallback } from "react";
import { TraitsData } from "../types/TraitsData";
import { SubmissionStep } from "../types/Steps";
import { useAuth } from "@/components/auth/Auth";
import { getInitialTraitsValues } from "@/components/waves/memes/traits/schema";
import {
  DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE,
  InteractiveMediaMimeType,
  InteractiveMediaProvider,
} from "../constants/media";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

type MediaSource = "upload" | "url";

interface ExternalMediaState {
  input: string;
  sanitizedHash: string;
  provider: InteractiveMediaProvider;
  url: string;
  previewUrl: string;
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

const sanitizeInteractiveHash = (
  input: string,
  provider: InteractiveMediaProvider
): string => {
  if (!input) {
    return "";
  }

  let value = input.trim();

  if (provider === "ipfs") {
    value = value.replace(/^ipfs:\/\//i, "");
    value = value.replace(/^https?:\/\/[^/]+\/ipfs\//i, "");
    value = value.replace(/^ipfs\//i, "");
  } else if (provider === "arweave") {
    value = value.replace(/^https?:\/\/(?:www\.)?arweave\.net\//i, "");
  }

  value = value.replace(/^\/+/, "");
  return value;
};

const buildExternalMediaState = (
  input: string,
  provider: InteractiveMediaProvider,
  mimeType: InteractiveMediaMimeType
): ExternalMediaState => {
  const trimmedInput = input.trim();
  const sanitizedHash = sanitizeInteractiveHash(trimmedInput, provider);
  const hasHash = sanitizedHash.length > 0;

  let error: string | null = null;
  if (trimmedInput && !hasHash) {
    error = "Enter a valid hash or CID.";
  } else if (/\s/.test(sanitizedHash)) {
    error = "Hashes cannot contain whitespace.";
  }

  const isValid = hasHash && !error;
  const url = isValid
    ? provider === "arweave"
      ? `https://arweave.net/${sanitizedHash}`
      : `ipfs://${sanitizedHash}`
    : "";
  const previewUrl = isValid
    ? provider === "arweave"
      ? url
      : resolveIpfsUrlSync(`ipfs://${sanitizedHash}`)
    : "";

  return {
    input,
    sanitizedHash,
    provider,
    url,
    previewUrl,
    mimeType,
    error,
    isValid,
  };
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
      input: "",
      sanitizedHash: "",
      provider: "ipfs",
      url: "",
      previewUrl: "",
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

  const updateExternalMediaState = useCallback(
    (input: string, provider: InteractiveMediaProvider) => {
      const nextExternalMedia = buildExternalMediaState(
        input,
        provider,
        state.externalMedia.mimeType
      );
      dispatch({ type: "SET_EXTERNAL_MEDIA", payload: nextExternalMedia });
    },
    [dispatch, state.externalMedia.mimeType]
  );

  const setExternalMediaHash = useCallback(
    (hash: string) => {
      updateExternalMediaState(hash, state.externalMedia.provider);
    },
    [updateExternalMediaState, state.externalMedia.provider]
  );

  const setExternalMediaProvider = useCallback(
    (provider: InteractiveMediaProvider) => {
      updateExternalMediaState(state.externalMedia.input, provider);
    },
    [updateExternalMediaState, state.externalMedia.input]
  );

  const setExternalMediaMimeType = useCallback(
    (mimeType: InteractiveMediaMimeType) => {
      const nextExternalMedia = buildExternalMediaState(
        state.externalMedia.input,
        state.externalMedia.provider,
        mimeType
      );
      dispatch({ type: "SET_EXTERNAL_MEDIA", payload: nextExternalMedia });
    },
    [dispatch, state.externalMedia.input, state.externalMedia.provider]
  );

  const clearExternalMedia = useCallback(() => {
    updateExternalMediaState("", state.externalMedia.provider);
  }, [updateExternalMediaState, state.externalMedia.provider]);

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
      externalPreviewUrl: state.externalMedia.previewUrl,
      externalProvider: state.externalMedia.provider,
      externalHash: state.externalMedia.sanitizedHash,
      externalMimeType: state.externalMedia.mimeType,
      isExternalValid: state.externalMedia.isValid,
    }),
    [state]
  );

  const setArtworkUploaded = useCallback(
    (uploaded: boolean) => {
      if (!uploaded) {
        if (state.mediaSource === "url") {
          updateExternalMediaState("", state.externalMedia.provider);
        } else {
          dispatch({ type: "RESET_UPLOAD_MEDIA" });
        }
      }
    },
    [
      state.mediaSource,
      state.externalMedia.provider,
      updateExternalMediaState,
      dispatch,
    ]
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
    externalMediaPreviewUrl: state.externalMedia.previewUrl,
    externalMediaHashInput: state.externalMedia.input,
    externalMediaProvider: state.externalMedia.provider,
    externalMediaMimeType: state.externalMedia.mimeType,
    externalMediaError: state.externalMedia.error,
    isExternalMediaValid: state.externalMedia.isValid,
    setArtworkUploaded,
    setMediaSource,
    setExternalMediaHash,
    setExternalMediaProvider,
    setExternalMediaMimeType,
    clearExternalMedia,
    handleFileSelect,

    traits: state.traits,
    setTraits,
    updateTraitField,

    getSubmissionData,
    getMediaSelection,
  };
}
