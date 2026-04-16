"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { commonApiDelete } from "@/services/api/common-api";
import { useCallback, useContext, useState } from "react";

interface UseResubmissionDeleteParams {
  readonly sourceDrop?: ExtendedDrop | undefined;
  readonly onClose: () => void;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

export function useResubmissionDelete({
  sourceDrop,
  onClose,
  onSourceDropDeleted,
}: UseResubmissionDeleteParams) {
  const { requestAuth, setToast } = useAuth();
  const { addOptimisticDrop, invalidateDrops } = useContext(
    ReactQueryWrapperContext
  );
  const myStream = useMyStreamOptional();
  const [replacementDrop, setReplacementDrop] = useState<ApiDrop | null>(null);
  const [isDeletingOriginal, setIsDeletingOriginal] = useState(false);
  const [deleteOriginalError, setDeleteOriginalError] = useState<string | null>(
    null
  );

  const handleResubmissionSuccess = useCallback(
    async (drop: ApiDrop) => {
      try {
        await addOptimisticDrop({ drop });
      } catch (error) {
        console.error(
          "[MemesArtSubmissionContainer] Failed to cache resubmitted drop",
          error
        );
        invalidateDrops();
      }

      setReplacementDrop(drop);
      setDeleteOriginalError(null);
    },
    [addOptimisticDrop, invalidateDrops]
  );

  const handleDeleteOriginal = useCallback(async () => {
    if (!sourceDrop || isDeletingOriginal) {
      return;
    }

    setIsDeletingOriginal(true);
    setDeleteOriginalError(null);

    const { success } = await requestAuth();
    if (!success) {
      setIsDeletingOriginal(false);
      return;
    }

    let didClose = false;

    try {
      await commonApiDelete({
        endpoint: `drops/${sourceDrop.id}`,
      });

      setToast({
        message: "Original submission deleted.",
        type: "warning",
      });
      invalidateDrops();
      myStream?.processDropRemoved(sourceDrop.wave.id, sourceDrop.id);
      setIsDeletingOriginal(false);
      didClose = true;
      onClose();
      onSourceDropDeleted?.();
    } catch (error) {
      let message = "Unable to delete the original submission.";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      }
      setDeleteOriginalError(message);
      setToast({
        message,
        type: "error",
      });
    } finally {
      if (didClose) {
        return;
      }
      setIsDeletingOriginal(false);
    }
  }, [
    sourceDrop,
    isDeletingOriginal,
    requestAuth,
    setToast,
    invalidateDrops,
    myStream,
    onClose,
    onSourceDropDeleted,
  ]);

  const handleDeleteOriginalClick = useCallback(() => {
    void handleDeleteOriginal();
  }, [handleDeleteOriginal]);

  const handleKeepBoth = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    replacementDrop,
    isDeletingOriginal,
    deleteOriginalError,
    handleResubmissionSuccess,
    handleDeleteOriginalClick,
    handleKeepBoth,
  };
}
