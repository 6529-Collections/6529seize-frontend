"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import type { TraitsData } from "../types/TraitsData";
import { SubmissionStep } from "../types/Steps";
import { useAuth } from "@/components/auth/Auth";
import { getInitialTraitsValues } from "@/components/waves/memes/traits/schema";
import type {
  InteractiveMediaMimeType,
  InteractiveMediaProvider,
} from "../constants/media";
import { DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE } from "../constants/media";
import {
  INTERACTIVE_MEDIA_GATEWAY_BASE_URL,
  isInteractiveMediaContentIdentifier,
} from "../constants/security";
import { validateInteractivePreview } from "../actions/validateInteractivePreview";
import type {
  AirdropEntry,
  PaymentInfo,
  AllowlistBatchRaw,
  AdditionalMedia,
  OperationalData,
} from "../types/OperationalData";
import { AIRDROP_TOTAL } from "../types/OperationalData";

type MediaSource = "upload" | "url";

interface ExternalMediaState {
  input: string;
  sanitizedHash: string;
  provider: InteractiveMediaProvider;
  url: string;
  previewUrl: string;
  mimeType: InteractiveMediaMimeType;
  error: string | null;
  status: "idle" | "pending" | "valid" | "invalid";
  isValid: boolean;
}

type FormAction =
  | { type: "SET_STEP"; payload: SubmissionStep }
  | { type: "SET_AGREEMENTS"; payload: boolean }
  | {
      type: "SET_TRAIT_FIELD";
      payload: { field: keyof TraitsData; value: TraitsData[keyof TraitsData] };
    }
  | { type: "SET_MULTIPLE_TRAITS"; payload: Partial<TraitsData> }
  | { type: "SET_MEDIA_SOURCE"; payload: MediaSource }
  | { type: "SET_EXTERNAL_MEDIA"; payload: ExternalMediaState }
  | {
      type: "SET_EXTERNAL_MEDIA_VALIDATION";
      payload: {
        status: ExternalMediaState["status"];
        error: string | null;
        finalUrl?: string | undefined;
      };
    }
  | {
      type: "SET_UPLOAD_MEDIA";
      payload: { file: File; artworkUrl: string };
    }
  | { type: "RESET_UPLOAD_MEDIA" }
  | { type: "SET_AIRDROP_CONFIG"; payload: AirdropEntry[] }
  | { type: "SET_PAYMENT_INFO"; payload: Partial<PaymentInfo> }
  | { type: "SET_ALLOWLIST_BATCHES"; payload: AllowlistBatchRaw[] }
  | { type: "SET_ADDITIONAL_MEDIA"; payload: Partial<AdditionalMedia> }
  | { type: "SET_COMMENTARY"; payload: string };

interface FormState {
  currentStep: SubmissionStep;
  agreements: boolean;
  artworkUploaded: boolean;
  artworkUrl: string;
  uploadArtworkUrl: string;
  traits: TraitsData;
  mediaSource: MediaSource;
  selectedFile: File | null;
  externalMedia: ExternalMediaState;
  operationalData: OperationalData;
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
  } else {
    value = value.replace(/^https?:\/\/(?:www\.)?arweave\.net\//i, "");
  }

  value = value.replace(/^\/+/, "");
  return value;
};

const isSafeRelativeGatewayPath = (path: string): boolean => {
  if (!path) {
    return false;
  }

  const trimmed = path.trim();
  if (trimmed !== path) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("\\") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("\\\\") ||
    lower.startsWith("http:") ||
    lower.startsWith("https:") ||
    lower.includes("://") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return false;
  }

  return true;
};

const buildExternalMediaState = (
  input: string,
  provider: InteractiveMediaProvider,
  mimeType: InteractiveMediaMimeType
): ExternalMediaState => {
  const trimmedInput = input.trim();
  let sanitizedHash = sanitizeInteractiveHash(trimmedInput, provider);
  const hasHash = sanitizedHash.length > 0;

  let error: string | null = null;
  if (trimmedInput && !hasHash) {
    error = "Enter a valid hash or CID.";
  } else if (/\s/.test(sanitizedHash)) {
    error = "Hashes cannot contain whitespace.";
  }

  // Drop query/fragment markers without regex backtracking risk.
  if (!error && !isSafeRelativeGatewayPath(sanitizedHash)) {
    error = "Only relative paths under the gateway origin are allowed.";
  }

  if (!error) {
    const hashWithoutQuery = sanitizedHash.split(/[?#]/)[0] ?? sanitizedHash;
    if (hashWithoutQuery !== sanitizedHash) {
      error = "Remove query strings or fragments from the hash.";
    }
    sanitizedHash = hashWithoutQuery;
  }

  if (!error && sanitizedHash.includes("/")) {
    error =
      provider === "ipfs"
        ? "IPFS embeds must reference the root CID without subpaths."
        : "Arweave embeds must reference the transaction ID without subpaths.";
  }

  if (!error && sanitizedHash.includes("..")) {
    error = "Remove path traversal segments from the hash.";
  }

  if (!error && sanitizedHash) {
    const isValidIdentifier = isInteractiveMediaContentIdentifier(
      provider,
      sanitizedHash
    );
    if (!isValidIdentifier) {
      error =
        provider === "ipfs"
          ? "Enter a valid IPFS CID (CIDv0 or CIDv1)."
          : "Enter a valid Arweave transaction ID.";
    }
  }

  let status: ExternalMediaState["status"] = "idle";
  if (hasHash) {
    status = error ? "invalid" : "pending";
  }

  const previewUrl =
    status !== "idle" && !error
      ? `${INTERACTIVE_MEDIA_GATEWAY_BASE_URL[provider]}${sanitizedHash}`
      : "";

  let url = "";
  if (status !== "idle" && !error) {
    url = provider === "arweave" ? previewUrl : `ipfs://${sanitizedHash}`;
  }

  return {
    input,
    sanitizedHash,
    provider,
    url,
    previewUrl,
    mimeType,
    error,
    status,
    isValid: false,
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
          artworkUrl: hasFile ? state.uploadArtworkUrl : "",
        };
      }

      return {
        ...state,
        mediaSource: nextSource,
        artworkUploaded: state.externalMedia.isValid,
        artworkUrl: state.externalMedia.isValid ? state.externalMedia.url : "",
      };
    }

    case "SET_EXTERNAL_MEDIA": {
      const externalMedia = action.payload;
      const shouldApply = state.mediaSource === "url";
      let artworkUrl = state.artworkUrl;
      if (shouldApply) {
        artworkUrl = externalMedia.isValid ? externalMedia.url : "";
      }
      return {
        ...state,
        externalMedia,
        artworkUploaded: shouldApply
          ? externalMedia.isValid
          : state.artworkUploaded,
        artworkUrl,
      };
    }

    case "SET_EXTERNAL_MEDIA_VALIDATION": {
      const { status, error, finalUrl } = action.payload;
      const isValid = status === "valid";
      const externalMedia = {
        ...state.externalMedia,
        status,
        isValid,
        error,
        previewUrl: isValid ? (finalUrl ?? state.externalMedia.previewUrl) : "",
      };

      const shouldApply = state.mediaSource === "url";
      let artworkUrl = state.artworkUrl;
      if (shouldApply) {
        artworkUrl = isValid ? externalMedia.url : "";
      }

      return {
        ...state,
        externalMedia,
        artworkUploaded: shouldApply ? isValid : state.artworkUploaded,
        artworkUrl,
      };
    }

    case "SET_UPLOAD_MEDIA":
      return {
        ...state,
        selectedFile: action.payload.file,
        artworkUrl: action.payload.artworkUrl,
        uploadArtworkUrl: action.payload.artworkUrl,
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
        uploadArtworkUrl: "",
        artworkUploaded: shouldFallbackToExternal,
      };
    }

    case "SET_AIRDROP_CONFIG":
      return {
        ...state,
        operationalData: {
          ...state.operationalData,
          airdrop_config: action.payload,
        },
      };

    case "SET_PAYMENT_INFO":
      return {
        ...state,
        operationalData: {
          ...state.operationalData,
          payment_info: {
            ...state.operationalData.payment_info,
            ...action.payload,
          },
        },
      };

    case "SET_ALLOWLIST_BATCHES":
      return {
        ...state,
        operationalData: {
          ...state.operationalData,
          allowlist_batches: action.payload,
        },
      };

    case "SET_ADDITIONAL_MEDIA":
      return {
        ...state,
        operationalData: {
          ...state.operationalData,
          additional_media: {
            ...state.operationalData.additional_media,
            ...action.payload,
          },
        },
      };

    case "SET_COMMENTARY":
      return {
        ...state,
        operationalData: {
          ...state.operationalData,
          commentary: action.payload,
        },
      };

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
    uploadArtworkUrl: "",
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
      status: "idle",
      isValid: false,
    },
    operationalData: {
      airdrop_config: [{ id: "initial", address: "", count: AIRDROP_TOTAL }],
      payment_info: {
        payment_address: "",
      },
      allowlist_batches: [],
      additional_media: {
        artist_profile_media: [],
        artwork_commentary_media: [],
      },
      commentary: "",
    },
  };

  const [state, dispatch] = useReducer(formReducer, initialState);
  const validationRequestKeyRef = useRef<string | null>(null);

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

  const handleContinueFromArtwork = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: SubmissionStep.ADDITIONAL_INFO });
  }, []);

  const handleBackToArtwork = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: SubmissionStep.ARTWORK });
  }, []);

  useEffect(() => {
    if (state.mediaSource !== "url") {
      validationRequestKeyRef.current = null;
      return;
    }

    const { status, sanitizedHash, provider } = state.externalMedia;

    if (status !== "pending" || !sanitizedHash) {
      return;
    }

    const validationKey = `${provider}:${sanitizedHash}`;
    validationRequestKeyRef.current = validationKey;

    let cancelled = false;

    const runValidation = async () => {
      try {
        const result = await validateInteractivePreview({
          provider,
          path: sanitizedHash,
        });

        if (cancelled || validationRequestKeyRef.current !== validationKey) {
          return;
        }

        if (result.ok) {
          dispatch({
            type: "SET_EXTERNAL_MEDIA_VALIDATION",
            payload: {
              status: "valid",
              error: null,
              finalUrl: result.finalUrl,
            },
          });
          validationRequestKeyRef.current = null;
        } else {
          dispatch({
            type: "SET_EXTERNAL_MEDIA_VALIDATION",
            payload: {
              status: "invalid",
              error:
                result.reason ??
                "Interactive media must respond with an HTML document.",
            },
          });
          validationRequestKeyRef.current = null;
        }
      } catch (error) {
        console.error(
          "[useArtworkSubmissionForm] validateInteractivePreview failed",
          {
            provider,
            sanitizedHash,
            error,
          }
        );
        if (cancelled || validationRequestKeyRef.current !== validationKey) {
          return;
        }

        dispatch({
          type: "SET_EXTERNAL_MEDIA_VALIDATION",
          payload: {
            status: "invalid",
            error: "Unable to verify media URL. Try again later.",
          },
        });
        validationRequestKeyRef.current = null;
      }
    };

    runValidation();

    return () => {
      cancelled = true;
    };
  }, [
    state.mediaSource,
    state.externalMedia.status,
    state.externalMedia.sanitizedHash,
    state.externalMedia.provider,
    state.externalMedia,
    dispatch,
  ]);

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
    const { traits, artworkUrl, operationalData } = state;
    return {
      imageUrl: artworkUrl,
      traits: {
        ...traits,
        title: traits.title,
        description: traits.description,
      },
      operationalData,
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

  const setAirdropConfig = useCallback(
    (entries: AirdropEntry[]) => {
      dispatch({ type: "SET_AIRDROP_CONFIG", payload: entries });
    },
    [dispatch]
  );

  const setPaymentInfo = useCallback(
    (paymentInfo: Partial<PaymentInfo>) => {
      dispatch({ type: "SET_PAYMENT_INFO", payload: paymentInfo });
    },
    [dispatch]
  );

  const setAllowlistBatches = useCallback(
    (batches: AllowlistBatchRaw[]) => {
      dispatch({ type: "SET_ALLOWLIST_BATCHES", payload: batches });
    },
    [dispatch]
  );

  const setAdditionalMedia = useCallback(
    (additionalMedia: Partial<AdditionalMedia>) => {
      dispatch({ type: "SET_ADDITIONAL_MEDIA", payload: additionalMedia });
    },
    [dispatch]
  );

  const setCommentary = useCallback(
    (commentary: string) => {
      dispatch({ type: "SET_COMMENTARY", payload: commentary });
    },
    [dispatch]
  );

  return {
    currentStep: state.currentStep,
    agreements: state.agreements,
    setAgreements: (value: boolean) =>
      dispatch({ type: "SET_AGREEMENTS", payload: value }),
    handleContinueFromTerms,
    handleContinueFromArtwork,
    handleBackToArtwork,

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
    externalMediaValidationStatus: state.externalMedia.status,
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

    operationalData: state.operationalData,
    setAirdropConfig,
    setPaymentInfo,
    setAllowlistBatches,
    setAdditionalMedia,
    setCommentary,

    getSubmissionData,
    getMediaSelection,
  };
}
