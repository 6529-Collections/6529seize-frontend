"use client";

import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiMemeCollaboratorProfile } from "@/generated/models/ApiMemeCollaboratorProfile";
import { useOptionalCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionEntrySubmit } from "@/hooks/competitions/useCompetitionEntrySubmit";
import { useAuth } from "@/components/auth/Auth";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { OperationalData } from "../types/OperationalData";
import type { TraitsData } from "../types/TraitsData";
import type { SubmissionPhase } from "../ui/SubmissionProgress";
import { getSubmissionMetadataLengthValidation } from "../utils/submissionMetadata";
import { transformToApiRequest } from "../utils/artworkSubmissionRequest";
import type { ProposalCardLayout } from "@/lib/proposal-card/document";
import { prepareProposalCard } from "../utils/prepareProposalCard";
import {
  PROPOSAL_FRAME_METADATA_KEY,
  type ProposalFrameMetadata,
} from "@/lib/proposal-card/metadata";

/**
 * Interface for the artwork submission data
 */
interface ArtworkSubmissionData {
  collaborators?: ApiMemeCollaboratorProfile[];
  proposalFrame?: ProposalCardLayout | null | undefined;
  imageFile?: File | undefined;
  existingMedia?:
    | {
        url: string;
        mimeType: string;
      }
    | undefined;
  externalMedia?:
    | {
        url: string;
        mimeType: string;
      }
    | undefined;
  traits: TraitsData;
  operationalData?: OperationalData;
  isAdditionalActionPromised: boolean;
  waveId: string;
  waveName: string;
  termsOfService: string | null;
}

/**
 * Phase transition callback type
 */
interface PhaseChangeCallbacks {
  onPhaseChange?:
    | ((phase: SubmissionPhase, error?: string) => void)
    | undefined;
}

interface SubmissionOptions extends PhaseChangeCallbacks {
  readonly onSuccess?: ((data: ApiDrop) => void) | undefined;
  readonly onError?: ((error: Error) => void) | undefined;
  readonly expectedAuthStateFingerprint: string;
  readonly identityChangedMessage: string;
}

const ACTIVE_WALLET_CHANGED_ERROR =
  "The active wallet changed during submission";

const isSubmissionSignerCurrent = (signerAddress: string): boolean =>
  getWalletAddress()?.toLowerCase() === signerAddress.toLowerCase();

const isSubmissionWalletCurrent = ({
  signerAddress,
  expectedAuthStateFingerprint,
}: {
  readonly signerAddress: string;
  readonly expectedAuthStateFingerprint: string;
}): boolean => {
  const walletAddress = getWalletAddress();
  if (!isSubmissionSignerCurrent(signerAddress)) {
    return false;
  }

  return (
    getAuthStateFingerprint({ walletAddress, jwt: getAuthJwt() }) ===
    expectedAuthStateFingerprint
  );
};

function useArtworkUpload({
  updatePhase,
  setUploadProgress,
  setToast,
}: {
  readonly updatePhase: (
    phase: SubmissionPhase,
    callbacks?: PhaseChangeCallbacks,
    error?: string
  ) => void;
  readonly setUploadProgress: (progress: number) => void;
  readonly setToast: ReturnType<typeof useAuth>["setToast"];
}) {
  return useMutation<
    ApiDropMedia, // Response type
    Error, // Error type
    {
      file: File;
      callbacks?: PhaseChangeCallbacks | undefined;
    }
  >({
    mutationFn: async ({ file, callbacks }) => {
      updatePhase("uploading", callbacks);

      return multiPartUpload({
        file,
        path: "drop",
        onProgress: setUploadProgress,
      });
    },
    onError: (error, variables) => {
      console.error("Upload error:", error);
      const errorMsg = `Error uploading file: ${
        error.message || error.toString() || "Unknown error"
      }`;
      updatePhase("error", variables.callbacks, errorMsg);

      setToast({
        message: errorMsg,
        type: "error",
      });
    },
  });
}

function getArtworkValidationError(data: ArtworkSubmissionData): string | null {
  const hasExisting = Boolean(data.existingMedia?.url.trim());
  const hasExternal = Boolean(data.externalMedia?.url.trim());
  if (!data.imageFile && !hasExisting && !hasExternal)
    return "Upload a file or provide valid media.";
  if (hasExisting && !data.existingMedia?.mimeType)
    return "Select the media type for this media.";
  if (hasExternal && !data.externalMedia?.mimeType)
    return "Select the media type for your URL.";
  if (!data.traits.title) return "Add a title for your artwork.";
  const validation = getSubmissionMetadataLengthValidation({
    traits: data.traits,
    operationalData: data.operationalData,
    isAdditionalActionPromised: data.isAdditionalActionPromised,
  });
  if (!validation.hasErrors) return null;
  const fields = validation.errors
    .map((item) => `${item.dataKey} (${item.length}/${item.maxLength})`)
    .join(", ");
  return `Metadata exceeds character limits for: ${fields}`;
}

function useArtworkSubmissionPost(
  competition: ApiCompetition | null,
  updatePhase: (
    phase: SubmissionPhase,
    callbacks?: PhaseChangeCallbacks,
    error?: string
  ) => void
) {
  const { setToast, requestAuth } = useAuth();
  const submitCompetitionEntry = useCompetitionEntrySubmit(competition);
  return useMutation<
    ApiDrop, // Response type
    Error, // Error type
    {
      data: ApiCreateDropRequest;
      callbacks?: PhaseChangeCallbacks | undefined;
      expectedAuthStateFingerprint: string;
      signerAddress: string;
      identityChangedMessage: string;
    }
  >({
    mutationFn: async ({
      data,
      callbacks,
      expectedAuthStateFingerprint,
      signerAddress,
    }) => {
      // Update phase to processing
      updatePhase("processing", callbacks);

      // Ensure user is authenticated
      const { success } = await requestAuth({
        expectedAuthStateFingerprint,
      });
      if (!success) {
        throw new Error("Authentication required");
      }

      const currentWalletAddress = getWalletAddress();
      if (currentWalletAddress?.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error(ACTIVE_WALLET_CHANGED_ERROR);
      }

      return submitCompetitionEntry(data);
    },
    onSuccess: (_, variables) => {
      updatePhase("success", variables.callbacks);

      // Show success toast
      setToast({
        message: "Artwork submitted.",
        type: "success",
      });
    },
    onError: (error, variables) => {
      if (isUserRejectedSigningError(error)) {
        updatePhase("idle", variables.callbacks);
        return;
      }
      console.error("Submission error:", error);
      if (error.message === ACTIVE_WALLET_CHANGED_ERROR) {
        updatePhase("error", variables.callbacks, error.message);
        setToast({ message: variables.identityChangedMessage, type: "error" });
        return;
      }
      const errorMsg =
        getToastErrorDetails(error) ?? "Submission failed. Please try again.";
      updatePhase("error", variables.callbacks, errorMsg);

      setToast({
        type: "error",
        title: "Couldn't submit this artwork.",
        description: "Please try again.",
        details: errorMsg,
      });
    },
  });
}

async function prepareArtworkRequest({
  data,
  signerAddress,
  isSafeSignature,
  expectedAuthStateFingerprint,
  identityChangedMessage,
  callbacks,
  locale,
  upload,
  updatePhase,
  setToast,
}: {
  readonly data: ArtworkSubmissionData;
  readonly signerAddress: string;
  readonly isSafeSignature: boolean;
  readonly expectedAuthStateFingerprint: string;
  readonly identityChangedMessage: string;
  readonly callbacks: PhaseChangeCallbacks;
  readonly locale: ReturnType<typeof useBrowserLocale>;
  readonly upload: ReturnType<typeof useArtworkUpload>["mutateAsync"];
  readonly updatePhase: (
    phase: SubmissionPhase,
    callbacks?: PhaseChangeCallbacks,
    error?: string
  ) => void;
  readonly setToast: ReturnType<typeof useAuth>["setToast"];
}) {
  const existingUrl = data.existingMedia?.url.trim() ?? "";
  const externalUrl = data.externalMedia?.url.trim() ?? "";
  let media: ApiDropMedia;

  if (data.imageFile) {
    media = await upload({
      file: data.imageFile,
      callbacks,
    });
  } else if (existingUrl && data.existingMedia) {
    media = {
      url: existingUrl,
      mime_type: data.existingMedia.mimeType,
    };
  } else if (externalUrl && data.externalMedia) {
    media = {
      url: externalUrl,
      mime_type: data.externalMedia.mimeType,
    };
  } else {
    throw new Error("Upload a file or provide valid media.");
  }

  let operationalData = data.operationalData;
  let proposalFrameMetadata: ProposalFrameMetadata | null = null;
  if (data.proposalFrame) {
    updatePhase("processing", callbacks);
    const framed = await prepareProposalCard({
      media,
      layout: data.proposalFrame,
      title: data.traits.title,
      locale,
      operationalData,
      uploadThumbnail: async (file) => {
        const uploaded = await upload({
          file,
          callbacks,
        });
        updatePhase("processing", callbacks);
        return uploaded;
      },
      assertIdentity: () => {
        if (
          !isSubmissionWalletCurrent({
            signerAddress,
            expectedAuthStateFingerprint: expectedAuthStateFingerprint,
          })
        ) {
          throw new Error(ACTIVE_WALLET_CHANGED_ERROR);
        }
      },
    }).catch((error: unknown) => {
      setToast({
        type: "error",
        message:
          getToastErrorDetails(error) ??
          t(locale, "memes.proposalFrame.publishError"),
      });
      throw error;
    });
    media = framed.media;
    operationalData = framed.operationalData;
    proposalFrameMetadata = framed.metadata;
  }

  if (!isSubmissionSignerCurrent(signerAddress)) {
    setToast({ message: identityChangedMessage, type: "error" });
    throw new Error(ACTIVE_WALLET_CHANGED_ERROR);
  }
  const signingAuthStateFingerprint = getAuthStateFingerprint({
    walletAddress: getWalletAddress(),
    jwt: getAuthJwt(),
  });

  // Step 2: Transform data to API format
  const transformedRequest = transformToApiRequest({
    collaboratorIds: data.collaborators?.map((profile) => profile.id) ?? [],
    waveId: data.waveId,
    traits: data.traits,
    operationalData,
    isAdditionalActionPromised: data.isAdditionalActionPromised,
    media,
    signerAddress,
    isSafeSignature,
  });

  if (proposalFrameMetadata) {
    transformedRequest.metadata.push({
      data_key: PROPOSAL_FRAME_METADATA_KEY,
      data_value: JSON.stringify(proposalFrameMetadata),
    });
  }

  return { transformedRequest, signingAuthStateFingerprint };
}

/**
 * Hook for submitting artwork with enhanced UX
 */
export function useArtworkSubmissionMutation(
  explicitCompetition?: ApiCompetition | null
) {
  const context = useOptionalCompetition();
  const competition =
    explicitCompetition === undefined
      ? (context?.competition ?? null)
      : explicitCompetition;
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionPhase, setSubmissionPhase] =
    useState<SubmissionPhase>("idle");
  const [submissionError, setSubmissionError] = useState<string | undefined>(
    undefined
  );
  const submissionInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update submission phase with callbacks
  const updatePhase = useCallback(
    (
      phase: SubmissionPhase,
      callbacks?: PhaseChangeCallbacks,
      error?: string
    ) => {
      setSubmissionPhase(phase);
      setSubmissionError(error);

      callbacks?.onPhaseChange?.(phase, error);
    },
    []
  );

  const uploadMutation = useArtworkUpload({
    updatePhase,
    setUploadProgress,
    setToast,
  });

  const submissionMutation = useArtworkSubmissionPost(competition, updatePhase);

  /**
   * Submit the artwork with media upload
   */
  const submitArtwork = async (
    data: ArtworkSubmissionData,
    signerAddress: string,
    isSafeSignature: boolean,
    options: SubmissionOptions
  ) => {
    if (submissionInFlightRef.current) {
      return null;
    }

    try {
      // Reset state for a new submission
      setUploadProgress(0);
      setSubmissionError(undefined);

      const validationError = getArtworkValidationError(data);
      if (validationError) {
        setToast({ message: validationError, type: "error" });
        return null;
      }

      if (
        !isSubmissionWalletCurrent({
          signerAddress,
          expectedAuthStateFingerprint: options.expectedAuthStateFingerprint,
        })
      ) {
        setToast({
          message: options.identityChangedMessage,
          type: "error",
        });
        return null;
      }

      submissionInFlightRef.current = true;
      setIsSubmitting(true);

      // Create callbacks object
      const callbacks = { onPhaseChange: options?.onPhaseChange };

      const { transformedRequest, signingAuthStateFingerprint } =
        await prepareArtworkRequest({
          data,
          signerAddress,
          isSafeSignature,
          callbacks,
          locale,
          expectedAuthStateFingerprint: options.expectedAuthStateFingerprint,
          identityChangedMessage: options.identityChangedMessage,
          upload: uploadMutation.mutateAsync,
          updatePhase,
          setToast,
        });

      // Step 3: Sign the drop
      updatePhase("signing", callbacks);
      // Step 4: Submit the signed drop
      const result = await submissionMutation.mutateAsync({
        data: transformedRequest,
        callbacks,
        expectedAuthStateFingerprint: signingAuthStateFingerprint,
        signerAddress,
        identityChangedMessage: options.identityChangedMessage,
      });

      // Call success callback if provided
      options.onSuccess?.(result);

      return result;
    } catch (error) {
      if (isUserRejectedSigningError(error)) {
        updatePhase("idle", { onPhaseChange: options.onPhaseChange });
        return null;
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Submission failed. Please try again.";
      updatePhase(
        "error",
        { onPhaseChange: options.onPhaseChange },
        errorMessage
      );

      // Call error callback if provided
      if (error instanceof Error) options.onError?.(error);

      return null;
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    submitArtwork,
    isSubmitting,
    isUploading: uploadMutation.isPending,
    isSigning: submissionPhase === "signing",
    isProcessing: submissionMutation.isPending,
    uploadProgress,
    submissionPhase,
    submissionError,
    isSuccess: submissionMutation.isSuccess,
    isError: uploadMutation.isError || submissionMutation.isError,
    error: uploadMutation.error ?? submissionMutation.error,
    reset: () => {
      uploadMutation.reset();
      submissionMutation.reset();
      setUploadProgress(0);
      setSubmissionPhase("idle");
      setSubmissionError(undefined);
    },
  };
}
