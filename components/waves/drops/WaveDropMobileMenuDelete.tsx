"use client";

import React, { useContext, useState } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { commonApiDelete } from "@/services/api/common-api";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

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
  const { processDropRemoved } = useMyStream();
  const [mutating, setMutating] = useState<boolean>(false);
  const deleteDropMutation = useMutation({
    mutationFn: async () =>
      await commonApiDelete({
        endpoint: `drops/${drop.id}`,
      }),
    onSuccess: () => {
      setToast({
        message: "Drop deleted.",
        type: "warning",
      });
      invalidateDrops();
      processDropRemoved(drop.wave.id, drop.id);
      onDropDeleted();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
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
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    await deleteDropMutation.mutateAsync();
  };

  return (
    <div className="tw-w-full tw-border-t tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-border-solid">
      <AnimatePresence mode="wait">
        {!isDeleteMode ? (
          <motion.button
            key="delete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="tw-mt-4 tw-border-0 tw-w-full tw-flex tw-items-center tw-gap-x-4 tw-py-3 tw-px-4 tw-bg-iron-950 tw-rounded-xl tw-transition-colors tw-duration-200 tw-select-none"
            onClick={() => setIsDeleteMode(true)}>
            <svg
              className="tw-size-5 tw-flex-shrink-0 tw-text-red"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            <span className="tw-text-red tw-font-semibold tw-text-base">
              Delete
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="tw-mt-4 tw-flex tw-gap-x-2">
            <button
              className="tw-flex-1 tw-border-0 tw-flex tw-items-center tw-justify-center tw-py-3 tw-px-4 tw-bg-red/100 tw-rounded-xl active:tw-bg-red/90 tw-transition-colors tw-duration-200"
              onClick={onDelete}
              disabled={mutating}>
              <span className="tw-text-white tw-font-semibold tw-text-base tw-flex tw-items-center tw-gap-x-2">
                {mutating ? (
                  <>
                    <svg
                      className="tw-size-4 tw-animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="tw-opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="tw-opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Are you sure?"
                )}
              </span>
            </button>
            <button
              className="tw-flex-1 tw-border-0 tw-flex tw-items-center tw-justify-center tw-py-3 tw-px-4 tw-bg-iron-950 tw-rounded-xl active:tw-bg-iron-800 tw-transition-colors tw-duration-200"
              onClick={() => setIsDeleteMode(false)}>
              <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
                Cancel
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaveDropMobileMenuDelete;
