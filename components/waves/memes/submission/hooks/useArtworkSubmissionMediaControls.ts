"use client";

import type { Dispatch } from "react";
import { useCallback, useEffect, useRef } from "react";
import { validateInteractivePreview } from "../actions/validateInteractivePreview";
import type {
  InteractiveMediaMimeType,
  InteractiveMediaProvider,
} from "../constants/media";
import type {
  FormAction,
  FormState,
  MediaSource,
} from "./artworkSubmissionFormState";
import { buildExternalMediaState } from "./artworkSubmissionFormState";

interface UseArtworkSubmissionMediaControlsParams {
  readonly state: FormState;
  readonly dispatch: Dispatch<FormAction>;
}

const FILE_READ_ERROR_MESSAGE =
  "Unable to read the selected file. Please try again.";
const FILE_READ_ABORT_MESSAGE =
  "File reading was cancelled. Select the artwork again.";

export function useArtworkSubmissionMediaControls({
  state,
  dispatch,
}: UseArtworkSubmissionMediaControlsParams) {
  useExternalMediaValidation({ state, dispatch });

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
      let readFailed = false;

      const setUploadError = (message: string): void => {
        if (readFailed) {
          return;
        }
        readFailed = true;
        dispatch({ type: "SET_UPLOAD_ERROR", payload: message });
      };

      dispatch({ type: "SET_UPLOAD_ERROR", payload: null });

      reader.onerror = () => {
        setUploadError(FILE_READ_ERROR_MESSAGE);
      };
      reader.onabort = () => {
        setUploadError(FILE_READ_ABORT_MESSAGE);
      };
      reader.onloadend = () => {
        if (readFailed) {
          return;
        }

        if (typeof reader.result !== "string") {
          setUploadError(FILE_READ_ERROR_MESSAGE);
          return;
        }

        dispatch({
          type: "SET_UPLOAD_MEDIA",
          payload: { file, artworkUrl: reader.result },
        });
      };

      try {
        reader.readAsDataURL(file);
      } catch {
        setUploadError(FILE_READ_ERROR_MESSAGE);
      }
    },
    [dispatch]
  );

  const setArtworkUploaded = useCallback(
    (uploaded: boolean) => {
      if (uploaded) {
        return;
      }

      if (state.mediaSource === "url") {
        updateExternalMediaState("", state.externalMedia.provider);
        return;
      }

      dispatch({ type: "RESET_UPLOAD_MEDIA" });
    },
    [
      dispatch,
      state.externalMedia.provider,
      state.mediaSource,
      updateExternalMediaState,
    ]
  );

  return {
    clearExternalMedia,
    handleFileSelect,
    setArtworkUploaded,
    setExternalMediaHash,
    setExternalMediaMimeType,
    setExternalMediaProvider,
    setMediaSource,
  };
}

function useExternalMediaValidation({
  state,
  dispatch,
}: UseArtworkSubmissionMediaControlsParams): void {
  const validationRequestKeyRef = useRef<string | null>(null);
  const { provider, sanitizedHash, status } = state.externalMedia;

  useEffect(() => {
    if (state.mediaSource !== "url") {
      validationRequestKeyRef.current = null;
      return;
    }

    if (status !== "pending" || !sanitizedHash) {
      return;
    }

    const validationKey = `${provider}:${sanitizedHash}`;
    validationRequestKeyRef.current = validationKey;

    let cancelled = false;

    const runValidation = async (): Promise<void> => {
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
        }
        validationRequestKeyRef.current = null;
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

    void runValidation();

    return () => {
      cancelled = true;
    };
  }, [dispatch, provider, sanitizedHash, state.mediaSource, status]);
}
