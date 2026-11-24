"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMyStreamActionsOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { deleteDrop } from "@/services/api/signed-drop-writes";
import { isSignedWriteCancelled } from "@/lib/device-signing/signing-decision";
import { useCallback, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateChainEntryQueries,
  useChainEntryWriters,
  type ChainEntryWriters,
} from "@/components/chain-waves/useChainEntryWriters";
import { ChainEntryPendingError } from "@/lib/chain-waves/entryWriters";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import {
  isChainSubmittedArtwork,
  type SubmittedArtwork,
} from "./useArtworkSubmissionMutation";

interface UseResubmissionDeleteParams {
  readonly sourceDrop?: ExtendedDrop | undefined;
  readonly onClose: () => void;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

/**
 * Withdraws the original on the 6529 Network; returns what to tell the
 * author. A withdrawal sent but not final yet counts as done: it may still
 * land, and sending it again would only be refused.
 */
async function withdrawOriginal(
  chainEntries: ChainEntryWriters,
  dropId: string
): Promise<string> {
  try {
    await chainEntries.withdrawEntry({ dropId });
    return "Original submission withdrawn.";
  } catch (error) {
    if (error instanceof ChainEntryPendingError) {
      return error.message;
    }
    throw error;
  }
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
  const myStream = useMyStreamActionsOptional();
  const queryClient = useQueryClient();
  // On the 6529 Network the original is withdrawn by its author's wallet.
  const chainEntries = useChainEntryWriters();
  const [replacementDrop, setReplacementDrop] = useState<Pick<
    ApiDrop,
    "title" | "metadata"
  > | null>(null);
  // A new version sent to the 6529 Network that wasn't final when the wait
  // ended. It may still land or not, so the original stays: the author can
  // withdraw it from its menu once the new version shows.
  const [replacementPending, setReplacementPending] = useState(false);
  const [isDeletingOriginal, setIsDeletingOriginal] = useState(false);
  const [deleteOriginalError, setDeleteOriginalError] = useState<string | null>(
    null
  );

  const handleResubmissionSuccess = useCallback(
    async (drop: SubmittedArtwork) => {
      if (isChainSubmittedArtwork(drop)) {
        // No 6529.io drop to cache until its index lists the entry.
        setReplacementDrop({ title: drop.title, metadata: drop.metadata });
        setReplacementPending(drop.pending);
        setDeleteOriginalError(null);
        return;
      }
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
    if (!sourceDrop || isDeletingOriginal || replacementPending) {
      return;
    }

    setIsDeletingOriginal(true);
    setDeleteOriginalError(null);

    // On the 6529 Network the withdrawal carries its own signature.
    const { success } = chainEntries ? { success: true } : await requestAuth();
    if (!success) {
      setIsDeletingOriginal(false);
      return;
    }

    let didClose = false;

    try {
      let message = "Original submission deleted.";
      if (chainEntries) {
        message = await withdrawOriginal(chainEntries, sourceDrop.id);
      } else {
        await deleteDrop({ dropId: sourceDrop.id, waveId: sourceDrop.wave.id });
      }

      setToast({ message, type: "warning" });
      invalidateDrops();
      if (chainEntries) {
        void invalidateChainEntryQueries(queryClient, sourceDrop.wave.id).catch(
          () => undefined
        );
      }
      myStream?.processDropRemoved(sourceDrop.wave.id, sourceDrop.id);
      setIsDeletingOriginal(false);
      didClose = true;
      onClose();
      onSourceDropDeleted?.();
    } catch (error) {
      if (didClose) {
        throw error;
      }
      // Cancelled at the signing prompt: nothing was sent.
      if (isSignedWriteCancelled(error) || isUserRejectedSigningError(error)) {
        setIsDeletingOriginal(false);
        return;
      }

      let message = chainEntries
        ? "Unable to withdraw the original submission."
        : "Unable to delete the original submission.";
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
      setIsDeletingOriginal(false);
    }
  }, [
    sourceDrop,
    isDeletingOriginal,
    replacementPending,
    chainEntries,
    queryClient,
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
    replacementPending,
    // On the 6529 Network the original is withdrawn, not deleted.
    withdrawsOriginal: chainEntries !== null,
    isDeletingOriginal,
    deleteOriginalError,
    handleResubmissionSuccess,
    handleDeleteOriginalClick,
    handleKeepBoth,
  };
}
