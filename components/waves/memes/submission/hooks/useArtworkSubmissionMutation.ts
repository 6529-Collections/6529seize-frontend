"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";
import { commonApiPost } from "@/services/api/common-api";
import type { TraitsData } from "../types/TraitsData";
import type { SubmissionPhase } from "../ui/SubmissionProgress";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import type { InteractiveMediaMimeType } from "../constants/media";
import { validateStrictAddress } from "../utils/addressValidation";

import { OperationalData } from "../types/OperationalData";

/**
 * Interface for the artwork submission data
 */
interface ArtworkSubmissionData {
  imageFile?: File | undefined;
  externalMedia?:
    | {
        url: string;
        mimeType: InteractiveMediaMimeType;
      }
    | undefined;
  traits: TraitsData;
  operationalData?: OperationalData;
  waveId: string;
  termsOfService: string | null;
}

/**
 * Function to transform form data into API request format
 */
export const transformToApiRequest = (data: {
  waveId: string;
  traits: TraitsData;
  operationalData?: OperationalData | undefined;
  mediaUrl: string;
  mimeType: string;
  signerAddress: string;
  isSafeSignature: boolean;
}): ApiCreateDropRequest => {
  const { waveId, traits, operationalData, mediaUrl, mimeType, signerAddress, isSafeSignature } = data;

  // Create metadata array from trait data
  const metadata: ApiDropMetadata[] = Object.entries(traits)
    .map(([key, value]) => ({
      data_key: key,
      data_value: value?.toString(),
    }))
    .filter(
      (metadata) =>
        metadata.data_value !== undefined && metadata.data_value.length > 0
    );

  // Append operational data if provided
  if (operationalData) {
    if (operationalData.airdrop_config && operationalData.airdrop_config.length > 0) {
      // Filter out entries with empty addresses before saving
      const validEntries = operationalData.airdrop_config.filter(
        (e) => {
          const trimmedAddress = e.address?.trim() ?? "";
          return validateStrictAddress(trimmedAddress) && e.count > 0;
        }
      );
      if (validEntries.length > 0) {
        metadata.push({
          data_key: "airdrop_config",
          data_value: JSON.stringify(validEntries),
        });
      }
    }

    if (operationalData.payment_info?.payment_address?.trim()) {
      metadata.push({
        data_key: "payment_info",
        data_value: JSON.stringify(operationalData.payment_info),
      });
    }

    if (operationalData.allowlist_batches && operationalData.allowlist_batches.length > 0) {
      const processedBatches = operationalData.allowlist_batches.map((batch) => ({
        contract: batch.contract,
        token_ids: batch.token_ids_raw || "",
      }));
      metadata.push({
        data_key: "allowlist_batches",
        data_value: JSON.stringify(processedBatches),
      });
    }

    if (operationalData.additional_media) {
      metadata.push({
        data_key: "additional_media",
        data_value: JSON.stringify(operationalData.additional_media),
      });
    }

    if (operationalData.commentary) {
      metadata.push({
        data_key: "commentary",
        data_value: operationalData.commentary,
      });
    }
  }

  // Create the request object
  const request: ApiCreateDropRequest = {
    wave_id: waveId,
    drop_type: ApiDropType.Participatory,
    title: traits.title,
    parts: [
      {
        content: traits.description,
        media: [
          {
            url: mediaUrl,
            mime_type: mimeType,
          },
        ],
      },
    ],
    referenced_nfts: [],
    mentioned_users: [],
    metadata,
    signature: null,
    is_safe_signature: isSafeSignature,
    signer_address: signerAddress,
  };

  return request;
};

/**
 * Phase transition callback type
 */
interface PhaseChangeCallbacks {
  onPhaseChange?:
    | ((phase: SubmissionPhase, error?: string) => void)
    | undefined
    | undefined;
}

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
    }
  >({
    mutationFn: async ({ data, callbacks }) => {
      // Update phase to processing
      updatePhase("processing", callbacks);

      // Ensure user is authenticated
      const { success } = await requestAuth();
      if (!success) {
        throw new Error("Authentication required");
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
        message: "Artwork submitted successfully!",
        type: "success",
      });
    },
    onError: (error, variables) => {
      console.error("Submission error:", error);
      const errorMsg = `Submission failed: ${
        error?.message || error?.toString() || "Unknown error"
      }`;
      updatePhase("error", variables.callbacks, errorMsg);

      setToast({
        message: errorMsg,
        type: "error",
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
    options?: {
      onSuccess?: ((data: ApiDrop) => void) | undefined;
      onError?: ((error: Error) => void) | undefined;
      onPhaseChange?:
        | ((phase: SubmissionPhase, error?: string) => void)
        | undefined
        | undefined;
    }
  ) => {
    try {
      // Reset state for a new submission
      setUploadProgress(0);
      setSubmissionError(undefined);

      // Validate required fields
      const hasFile = Boolean(data.imageFile);
      const externalUrl = data.externalMedia?.url?.trim() ?? "";
      const hasExternal = externalUrl.length > 0;

      if (!hasFile && !hasExternal) {
        setToast({
          message: "Please upload a file or provide a valid media URL",
          type: "error",
        });
        return null;
      }

      if (hasExternal && !data.externalMedia?.mimeType) {
        setToast({
          message: "Please select the media type for your URL",
          type: "error",
        });
        return null;
      }

      if (!data.traits.title) {
        setToast({
          message: "Please provide a title for your artwork",
          type: "error",
        });
        return null;
      }

      // Create callbacks object
      const callbacks = { onPhaseChange: options?.onPhaseChange };

      // Step 1: Resolve the media payload (upload when necessary)
      let media: ApiDropMedia;

      if (hasFile && data.imageFile) {
        media = await uploadMutation.mutateAsync({
          file: data.imageFile,
          callbacks,
        });
      } else if (hasExternal && data.externalMedia) {
        media = {
          url: externalUrl,
          mime_type: data.externalMedia.mimeType,
        };
      } else {
        return null;
      }

      // Step 2: Transform data to API format
      const transformedRequest = transformToApiRequest({
        waveId: data.waveId,
        traits: data.traits,
        operationalData: data.operationalData,
        mediaUrl: media.url,
        mimeType: media.mime_type,
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
        throw new Error("Failed to sign the drop");
      }

      // Add signature to the request
      transformedRequest.signature = signatureResult.signature ?? null;

      // Step 4: Submit the signed drop
      const result = await submissionMutation.mutateAsync({
        data: transformedRequest,
        callbacks,
      });

      // Call success callback if provided
      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      // Call error callback if provided
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }

      return null;
    }
  };

  return {
    submitArtwork,
    isSubmitting:
      uploadMutation.isPending ?? isSigningDrop ?? submissionMutation.isPending,
    isUploading: uploadMutation.isPending,
    isSigning: isSigningDrop,
    isProcessing: submissionMutation.isPending,
    uploadProgress,
    submissionPhase,
    submissionError,
    isSuccess: submissionMutation.isSuccess,
    isError: uploadMutation.isError ?? submissionMutation.isError,
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
