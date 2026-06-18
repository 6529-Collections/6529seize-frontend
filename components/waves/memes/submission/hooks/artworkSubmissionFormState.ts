import { getInitialTraitsValues } from "@/components/waves/memes/traits/schema";
import {
  parseDecentralizedMediaRef,
  toNativeUri,
} from "@/lib/media/decentralized-media";
import { stripArweaveGatewayUrlPrefix } from "@/lib/media/arweave-gateways";
import type {
  InteractiveMediaMimeType,
  InteractiveMediaProvider,
} from "../constants/media";
import { DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE } from "../constants/media";
import {
  INTERACTIVE_MEDIA_GATEWAY_BASE_URL,
  isInteractiveMediaContentIdentifier,
} from "../constants/security";
import type {
  AdditionalMedia,
  AirdropEntry,
  AllowlistBatchRaw,
  OperationalData,
  PaymentInfo,
} from "../types/OperationalData";
import { AIRDROP_TOTAL } from "../types/OperationalData";
import { SubmissionStep } from "../types/Steps";
import type { TraitsData } from "../types/TraitsData";
import type {
  ExistingSubmissionMedia,
  MemesSubmissionInitialDraft,
} from "../utils/submissionDraft";
import { getResubmissionMediaTypeInfo } from "../utils/resubmissionMediaType";

export type MediaSource = "upload" | "url";

export interface ExternalMediaState {
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

export interface ProfileDefaults {
  readonly handle?: string;
  readonly primaryWallet?: string;
  readonly aboutArtist?: string;
}

export type FormAction =
  | { type: "SET_STEP"; payload: SubmissionStep }
  | { type: "SET_AGREEMENTS"; payload: boolean }
  | { type: "SET_ADDITIONAL_ACTION_PROMISED"; payload: boolean }
  | { type: "APPLY_PROFILE_DEFAULTS"; payload: ProfileDefaults }
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
  | { type: "SET_UPLOAD_ERROR"; payload: string | null }
  | { type: "RESET_UPLOAD_MEDIA" }
  | { type: "SET_AIRDROP_CONFIG"; payload: AirdropEntry[] }
  | { type: "SET_PAYMENT_INFO"; payload: PaymentInfo }
  | { type: "SET_ALLOWLIST_BATCHES"; payload: AllowlistBatchRaw[] }
  | { type: "SET_ADDITIONAL_MEDIA"; payload: Partial<AdditionalMedia> }
  | { type: "SET_COMMENTARY"; payload: string }
  | { type: "SET_ABOUT_ARTIST"; payload: string };

export interface FormState {
  currentStep: SubmissionStep;
  agreements: boolean;
  artworkUploaded: boolean;
  artworkUrl: string;
  uploadArtworkUrl: string;
  uploadError: string | null;
  traits: TraitsData;
  mediaSource: MediaSource;
  selectedFile: File | null;
  existingMedia: ExistingSubmissionMedia | null;
  externalMedia: ExternalMediaState;
  operationalData: OperationalData;
  isAdditionalActionPromised: boolean;
}

const sanitizeInteractiveHash = (
  input: string,
  provider: InteractiveMediaProvider
): string => {
  if (!input) {
    return "";
  }

  let value = input.trim();
  const parsed = parseDecentralizedMediaRef(value);
  if (
    parsed &&
    ((provider === "ipfs" && parsed.protocol === "ipfs") ||
      (provider === "arweave" && parsed.protocol === "arweave"))
  ) {
    if (provider === "ipfs") {
      return parsed.id;
    }

    return parsed.path ? `${parsed.id}/${parsed.path}` : parsed.id;
  }

  if (provider === "ipfs") {
    value = value.replace(/^ipfs:\/\//i, "");
    value = value.replace(/^https?:\/\/[^/]+\/ipfs\//i, "");
    value = value.replace(/^ipfs\//i, "");
  } else {
    value = stripArweaveGatewayUrlPrefix(value);
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

interface ExternalMediaHashValidation {
  readonly sanitizedHash: string;
  readonly hasHash: boolean;
  readonly error: string | null;
}

const getSubpathError = (provider: InteractiveMediaProvider): string => {
  if (provider === "ipfs") {
    return "IPFS embeds must reference the root CID without subpaths.";
  }

  return "Arweave embeds must reference the transaction ID without subpaths.";
};

const getInvalidIdentifierError = (
  provider: InteractiveMediaProvider
): string => {
  if (provider === "ipfs") {
    return "Enter a valid IPFS CID (CIDv0 or CIDv1).";
  }

  return "Enter a valid Arweave transaction ID.";
};

const buildExternalMediaHashValidation = (
  input: string,
  provider: InteractiveMediaProvider
): ExternalMediaHashValidation => {
  const trimmedInput = input.trim();
  const sanitizedHash = sanitizeInteractiveHash(trimmedInput, provider);
  const hasHash = sanitizedHash.length > 0;

  if (!trimmedInput) {
    return { sanitizedHash, hasHash, error: null };
  }

  if (!hasHash) {
    return {
      sanitizedHash,
      hasHash,
      error: "Enter a valid hash or CID.",
    };
  }

  if (/\s/.test(sanitizedHash)) {
    return {
      sanitizedHash,
      hasHash,
      error: "Hashes cannot contain whitespace.",
    };
  }

  if (!isSafeRelativeGatewayPath(sanitizedHash)) {
    return {
      sanitizedHash,
      hasHash,
      error: "Only relative paths under the gateway origin are allowed.",
    };
  }

  const hashWithoutQuery = sanitizedHash.split(/[?#]/)[0] ?? sanitizedHash;
  if (hashWithoutQuery !== sanitizedHash) {
    return {
      sanitizedHash: hashWithoutQuery,
      hasHash,
      error: "Remove query strings or fragments from the hash.",
    };
  }

  if (sanitizedHash.includes("/")) {
    return {
      sanitizedHash,
      hasHash,
      error: getSubpathError(provider),
    };
  }

  if (sanitizedHash.includes("..")) {
    return {
      sanitizedHash,
      hasHash,
      error: "Remove path traversal segments from the hash.",
    };
  }

  if (!isInteractiveMediaContentIdentifier(provider, sanitizedHash)) {
    return {
      sanitizedHash,
      hasHash,
      error: getInvalidIdentifierError(provider),
    };
  }

  return { sanitizedHash, hasHash, error: null };
};

const getExternalMediaStatus = (
  hasHash: boolean,
  error: string | null
): ExternalMediaState["status"] => {
  if (!hasHash) {
    return "idle";
  }

  if (error) {
    return "invalid";
  }

  return "pending";
};

const buildExternalMediaUrls = (
  provider: InteractiveMediaProvider,
  sanitizedHash: string,
  status: ExternalMediaState["status"],
  error: string | null
): Pick<ExternalMediaState, "previewUrl" | "url"> => {
  if (status === "idle" || error) {
    return { previewUrl: "", url: "" };
  }

  const previewUrl = `${INTERACTIVE_MEDIA_GATEWAY_BASE_URL[provider]}${sanitizedHash}`;
  const url = toNativeUri({
    protocol: provider === "arweave" ? "arweave" : "ipfs",
    id: sanitizedHash,
    path: "",
  });

  return { previewUrl, url };
};

export const buildExternalMediaState = (
  input: string,
  provider: InteractiveMediaProvider,
  mimeType: InteractiveMediaMimeType
): ExternalMediaState => {
  const { sanitizedHash, hasHash, error } = buildExternalMediaHashValidation(
    input,
    provider
  );
  const status = getExternalMediaStatus(hasHash, error);
  const { previewUrl, url } = buildExternalMediaUrls(
    provider,
    sanitizedHash,
    status,
    error
  );

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

const buildEmptyExternalMediaState = (): ExternalMediaState => ({
  input: "",
  sanitizedHash: "",
  provider: "ipfs",
  url: "",
  previewUrl: "",
  mimeType: DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE,
  error: null,
  status: "idle",
  isValid: false,
});

const getDefaultOperationalData = (): OperationalData => ({
  airdrop_config: [{ id: "initial", address: "", count: AIRDROP_TOTAL }],
  payment_info: {
    payment_address: "",
    has_designated_payee: false,
    designated_payee_name: "",
  },
  allowlist_batches: [],
  additional_media: {
    artist_profile_media: [],
    artwork_commentary_media: [],
    preview_image: "",
    promo_video: "",
  },
  commentary: "",
  about_artist: "",
});

export interface CreateInitialStateInput {
  readonly initialDraft?: MemesSubmissionInitialDraft | undefined;
  readonly profileDefaults?: ProfileDefaults | undefined;
}

export const createInitialState = ({
  initialDraft,
  profileDefaults,
}: CreateInitialStateInput): FormState => {
  const existingMedia = initialDraft?.existingMedia ?? null;

  const state: FormState = {
    currentStep: SubmissionStep.AGREEMENT,
    agreements: false,
    artworkUploaded: Boolean(existingMedia),
    artworkUrl: existingMedia?.url ?? "",
    uploadArtworkUrl: "",
    uploadError: null,
    traits: initialDraft?.traits ?? getInitialTraitsValues(),
    mediaSource: "upload",
    selectedFile: null,
    existingMedia,
    externalMedia: buildEmptyExternalMediaState(),
    operationalData:
      initialDraft?.operationalData ?? getDefaultOperationalData(),
    isAdditionalActionPromised:
      initialDraft?.isAdditionalActionPromised ?? false,
  };

  if (initialDraft) {
    return state;
  }

  return reduceProfileDefaults(state, profileDefaults ?? {});
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };

    case "SET_AGREEMENTS":
      return { ...state, agreements: action.payload };

    case "SET_ADDITIONAL_ACTION_PROMISED":
      return { ...state, isAdditionalActionPromised: action.payload };

    case "APPLY_PROFILE_DEFAULTS":
      return reduceProfileDefaults(state, action.payload);

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

    case "SET_MEDIA_SOURCE":
      return reduceMediaSource(state, action.payload);

    case "SET_EXTERNAL_MEDIA":
      return reduceExternalMedia(state, action.payload);

    case "SET_EXTERNAL_MEDIA_VALIDATION":
      return reduceExternalMediaValidation(state, action.payload);

    case "SET_UPLOAD_MEDIA":
      return reduceSetUploadMedia(state, action.payload);

    case "SET_UPLOAD_ERROR":
      return reduceUploadError(state, action.payload);

    case "RESET_UPLOAD_MEDIA":
      return reduceResetUploadMedia(state);

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
          payment_info: action.payload,
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

    case "SET_ABOUT_ARTIST":
      return {
        ...state,
        operationalData: {
          ...state.operationalData,
          about_artist: action.payload,
        },
      };

    default:
      return state;
  }
}

const reduceProfileDefaults = (
  state: FormState,
  defaults: ProfileDefaults
): FormState => {
  const handle = defaults.handle ?? "";
  const primaryWallet = defaults.primaryWallet ?? "";
  const aboutArtist = defaults.aboutArtist ?? "";
  const traitDefaults: Partial<TraitsData> = {};

  if (handle && !state.traits.artist.trim()) {
    traitDefaults.artist = handle;
  }

  if (handle && !state.traits.seizeArtistProfile.trim()) {
    traitDefaults.seizeArtistProfile = handle;
  }

  const hasTraitDefaults = Object.keys(traitDefaults).length > 0;
  const currentPaymentInfo = state.operationalData.payment_info;
  const shouldApplyPaymentAddress =
    Boolean(primaryWallet) && !currentPaymentInfo.payment_address.trim();
  const currentAirdropEntry = state.operationalData.airdrop_config[0];
  const shouldApplyAirdropAddress =
    Boolean(primaryWallet) &&
    state.operationalData.airdrop_config.length === 1 &&
    currentAirdropEntry?.id === "initial" &&
    !currentAirdropEntry.address.trim();
  const shouldApplyAboutArtist =
    Boolean(aboutArtist) && !state.operationalData.about_artist.trim();

  if (
    !hasTraitDefaults &&
    !shouldApplyPaymentAddress &&
    !shouldApplyAirdropAddress &&
    !shouldApplyAboutArtist
  ) {
    return state;
  }

  const airdropConfig = shouldApplyAirdropAddress
    ? [
        {
          ...currentAirdropEntry,
          address: primaryWallet,
        },
      ]
    : state.operationalData.airdrop_config;

  return {
    ...state,
    traits: hasTraitDefaults
      ? {
          ...state.traits,
          ...traitDefaults,
        }
      : state.traits,
    operationalData: {
      ...state.operationalData,
      payment_info: shouldApplyPaymentAddress
        ? {
            ...currentPaymentInfo,
            payment_address: primaryWallet,
          }
        : state.operationalData.payment_info,
      airdrop_config: airdropConfig,
      about_artist: shouldApplyAboutArtist
        ? aboutArtist
        : state.operationalData.about_artist,
    },
  };
};

const reduceSetUploadMedia = (
  state: FormState,
  payload: Extract<FormAction, { type: "SET_UPLOAD_MEDIA" }>["payload"]
): FormState => {
  const mediaTypeInfo = getResubmissionMediaTypeInfo({
    mimeType: payload.file.type,
    fileName: payload.file.name,
  });
  const additionalMedia =
    mediaTypeInfo.label === null
      ? {
          ...state.operationalData.additional_media,
          preview_image: "",
          promo_video: "",
        }
      : state.operationalData.additional_media;

  return {
    ...state,
    selectedFile: payload.file,
    artworkUrl: payload.artworkUrl,
    uploadArtworkUrl: payload.artworkUrl,
    uploadError: null,
    artworkUploaded: true,
    mediaSource: "upload",
    operationalData: {
      ...state.operationalData,
      additional_media: additionalMedia,
    },
  };
};

const reduceMediaSource = (
  state: FormState,
  nextSource: MediaSource
): FormState => {
  if (nextSource === "upload") {
    const hasFile = state.selectedFile !== null;
    const hasExistingMedia = state.existingMedia !== null;
    return {
      ...state,
      mediaSource: nextSource,
      uploadError: null,
      artworkUploaded: hasFile || hasExistingMedia,
      artworkUrl: hasFile
        ? state.uploadArtworkUrl
        : (state.existingMedia?.url ?? ""),
    };
  }

  return {
    ...state,
    mediaSource: nextSource,
    uploadError: null,
    artworkUploaded: state.externalMedia.isValid,
    artworkUrl: state.externalMedia.isValid ? state.externalMedia.url : "",
  };
};

const reduceExternalMedia = (
  state: FormState,
  externalMedia: ExternalMediaState
): FormState => {
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
};

const reduceExternalMediaValidation = (
  state: FormState,
  payload: Extract<
    FormAction,
    { type: "SET_EXTERNAL_MEDIA_VALIDATION" }
  >["payload"]
): FormState => {
  const { status, error, finalUrl } = payload;
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
};

const reduceResetUploadMedia = (state: FormState): FormState => {
  const existingMedia = state.existingMedia;
  const shouldFallbackToExternal =
    state.mediaSource === "url" && state.externalMedia.isValid;
  const shouldFallbackToExisting =
    state.selectedFile !== null && existingMedia !== null;
  let fallbackArtworkUrl = "";
  if (shouldFallbackToExternal) {
    fallbackArtworkUrl = state.externalMedia.url;
  } else if (shouldFallbackToExisting) {
    fallbackArtworkUrl = existingMedia.url;
  }

  return {
    ...state,
    selectedFile: null,
    artworkUrl: fallbackArtworkUrl,
    uploadArtworkUrl: "",
    uploadError: null,
    artworkUploaded: fallbackArtworkUrl.length > 0,
  };
};

const reduceUploadError = (
  state: FormState,
  uploadError: string | null
): FormState => {
  if (!uploadError) {
    return {
      ...state,
      uploadError: null,
    };
  }

  const fallbackArtworkUrl = state.existingMedia?.url ?? "";

  return {
    ...state,
    selectedFile: null,
    artworkUrl: fallbackArtworkUrl,
    uploadArtworkUrl: "",
    uploadError,
    artworkUploaded: fallbackArtworkUrl.length > 0,
    mediaSource: "upload",
  };
};
