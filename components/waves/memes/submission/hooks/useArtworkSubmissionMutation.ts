"use client";

import { useAuth } from "@/components/auth/Auth";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { commonApiPost } from "@/services/api/common-api";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, getWalletAddress } from "@/services/auth/auth.utils";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { OperationalData } from "../types/OperationalData";
import type { TraitsData } from "../types/TraitsData";
import type { SubmissionPhase } from "../ui/SubmissionProgress";
import { getSubmissionMetadataLengthValidation } from "../utils/submissionMetadata";
import { transformToApiRequest } from "../utils/artworkSubmissionRequest";

/**
 * Interface for the artwork submission data
 */
interface ArtworkSubmissionData {
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

/**
 * Hook for submitting artwork with enhanced UX
 */
export function useArtworkSubmissionMutation() {
  const { setToast, requestAuth } = useAuth();
  const { signDrop, isLoading: isSigningDrop } = useDropSignature();
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

      if (callbacks?.onPhaseChange) {
        callbacks.onPhaseChange(phase, error);
      }
    },
    []
  );

  // File upload mutation
  const uploadMutation = useMutation<
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
        error?.message || error?.toString() || "Unknown error"
      }`;
      updatePhase("error", variables.callbacks, errorMsg);

      setToast({
        message: errorMsg,
        type: "error",
      });
    },
  });

  // Submission mutation
  const submissionMutation = useMutation<
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

      // Submit to API
      return commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: "drops/",
        body: data,
      });
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

      // Validate required fields
      const hasFile = Boolean(data.imageFile);
      const existingUrl = data.existingMedia?.url.trim() ?? "";
      const hasExisting = existingUrl.length > 0;
      const externalUrl = data.externalMedia?.url?.trim() ?? "";
      const hasExternal = externalUrl.length > 0;

      if (!hasFile && !hasExisting && !hasExternal) {
        setToast({
          message: "Upload a file or provide valid media.",
          type: "error",
        });
        return null;
      }

      if (hasExisting && !data.existingMedia?.mimeType) {
        setToast({
          message: "Select the media type for this media.",
          type: "error",
        });
        return null;
      }

      if (hasExternal && !data.externalMedia?.mimeType) {
        setToast({
          message: "Select the media type for your URL.",
          type: "error",
        });
        return null;
      }

      if (!data.traits.title) {
        setToast({
          message: "Add a title for your artwork.",
          type: "error",
        });
        return null;
      }

      const metadataLengthValidation = getSubmissionMetadataLengthValidation({
        traits: data.traits,
        operationalData: data.operationalData,
      });
      if (metadataLengthValidation.hasErrors) {
        const fields = metadataLengthValidation.errors
          .map((item) => `${item.dataKey} (${item.length}/${item.maxLength})`)
          .join(", ");

        setToast({
          message: `Metadata exceeds character limits for: ${fields}`,
          type: "error",
        });
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

      // Step 1: Resolve the media payload (upload when necessary)
      let media: ApiDropMedia;

      if (hasFile && data.imageFile) {
        media = await uploadMutation.mutateAsync({
          file: data.imageFile,
          callbacks,
        });
      } else if (hasExisting && data.existingMedia) {
        media = {
          url: existingUrl,
          mime_type: data.existingMedia.mimeType,
        };
      } else if (hasExternal && data.externalMedia) {
        media = {
          url: externalUrl,
          mime_type: data.externalMedia.mimeType,
        };
      } else {
        return null;
      }

      if (!isSubmissionSignerCurrent(signerAddress)) {
        setToast({ message: options.identityChangedMessage, type: "error" });
        throw new Error(ACTIVE_WALLET_CHANGED_ERROR);
      }
      const signingAuthStateFingerprint = getAuthStateFingerprint({
        walletAddress: getWalletAddress(),
        jwt: getAuthJwt(),
      });

      // Step 2: Transform data to API format
      const transformedRequest = transformToApiRequest({
        waveId: data.waveId,
        traits: data.traits,
        operationalData: data.operationalData,
        isAdditionalActionPromised: data.isAdditionalActionPromised,
        media,
        signerAddress,
        isSafeSignature,
      });

      // Step 3: Sign the drop
      updatePhase("signing", callbacks);
      const signatureResult = await signDrop({
        drop: transformedRequest,
        termsOfService: data.termsOfService,
      });

      if (!signatureResult.success) {
        updatePhase("idle", callbacks);
        return null;
      }

      // Add signature to the request
      transformedRequest.signature = signatureResult.signature ?? null;
      if (signatureResult.signatureMessage) {
        transformedRequest.signature_message = signatureResult.signatureMessage;
      }

      // Step 4: Submit the signed drop
      const result = await submissionMutation.mutateAsync({
        data: transformedRequest,
        callbacks,
        expectedAuthStateFingerprint: signingAuthStateFingerprint,
        signerAddress,
        identityChangedMessage: options.identityChangedMessage,
      });

      // Call success callback if provided
      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
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
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }

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
    isSigning: isSigningDrop,
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
