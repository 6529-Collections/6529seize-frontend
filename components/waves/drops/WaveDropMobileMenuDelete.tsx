"use client";

import React, { useContext, useState } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDrop } from "@/services/api/signed-drop-writes";
import { isSignedWriteCancelled } from "@/lib/device-signing/signing-decision";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import {
  chainWriteDetails,
  chainWriteFailure,
} from "@/components/chain-waves/chainWavesErrorMessage";
import {
  invalidateChainEntryQueries,
  useChainEntryWriters,
} from "@/components/chain-waves/useChainEntryWriters";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { ChainEntryPendingError } from "@/lib/chain-waves/entryWriters";
import Button from "@/components/utils/button/Button";

interface WaveDropMobileMenuDeleteProps {
  readonly drop: ApiDrop;
  readonly onDropDeleted: () => void;
}

const WaveDropMobileMenuDelete: React.FC<WaveDropMobileMenuDeleteProps> = ({
  drop,
  onDropDeleted,
}) => {
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { processDropRemoved } = useMyStreamActions();
  const queryClient = useQueryClient();
  const locale = useBrowserLocale();
  // On the 6529 Network an entry's delete is its author's withdrawal; the
  // delete controls offer it to the author only.
  const chainEntries = useChainEntryWriters();
  const chainWithdrawal =
    drop.drop_type === ApiDropType.Chat ? null : chainEntries;
  const [mutating, setMutating] = useState<boolean>(false);
  const deleteDropMutation = useMutation({
    mutationFn: async () =>
      chainWithdrawal
        ? await chainWithdrawal.withdrawEntry({ dropId: drop.id })
        : await deleteDrop({ dropId: drop.id, waveId: drop.wave.id }),
    onSuccess: () => {
      setToast({
        message: chainWithdrawal ? "Entry withdrawn." : "Drop deleted.",
        type: "warning",
      });
      invalidateDrops();
      if (chainWithdrawal) {
        void invalidateChainEntryQueries(queryClient, drop.wave.id).catch(
          () => undefined
        );
      }
      processDropRemoved(drop.wave.id, drop.id);
      onDropDeleted();
    },
    onError: (error) => {
      // Cancelled at the signing prompt: nothing was sent.
      if (isSignedWriteCancelled(error) || isUserRejectedSigningError(error)) {
        return;
      }
      // Sent, not final yet: it may still land.
      if (error instanceof ChainEntryPendingError) {
        setToast({ message: error.message, type: "warning" });
        return;
      }
      // The 6529 Network's reason in plain words, with no second line;
      // 6529.io's own wording for its delete.
      setToast({
        type: "error",
        title: chainWithdrawal
          ? "Couldn't withdraw this entry."
          : "Couldn't delete this drop.",
        description: chainWriteFailure(
          locale,
          error,
          "Please try again.",
          "withdrawal"
        ),
        details: chainWriteDetails(error),
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });
  const onDelete = async () => {
    if (mutating) {
      return;
    }
    setMutating(true);
    // On the 6529 Network the withdrawal carries its own signature.
    const { success } = chainWithdrawal
      ? { success: true }
      : await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    try {
      await deleteDropMutation.mutateAsync();
    } catch {
      // The mutation callbacks own the visible error state and reset loading.
    }
  };
  const deleteLabel = chainWithdrawal ? "Withdraw" : "Delete";
  let confirmLabel = "Are you sure?";
  if (mutating) {
    confirmLabel = chainWithdrawal ? "Withdrawing..." : "Deleting...";
  }

  return (
    <div className="tw-w-full tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800">
      <AnimatePresence mode="wait">
        {!isDeleteMode ? (
          <motion.button
            key="delete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="tw-mt-4 tw-flex tw-w-full tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-px-4 tw-py-3 tw-transition-colors tw-duration-200"
            onClick={() => setIsDeleteMode(true)}
          >
            <svg
              className="tw-size-5 tw-flex-shrink-0 tw-text-red"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            <span className="tw-text-base tw-font-semibold tw-text-red">
              {deleteLabel}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="tw-mt-4 tw-flex tw-gap-x-2"
          >
            <Button
              onClick={onDelete}
              loading={mutating}
              variant="destructive"
              size="lg"
              fullWidth
            >
              {confirmLabel}
            </Button>
            <Button
              onClick={() => setIsDeleteMode(false)}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaveDropMobileMenuDelete;
