"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiDelete } from "@/services/api/common-api";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { Fragment, useContext, useState } from "react";
import { createPortal } from "react-dom";

export default function DropsListItemDeleteDropModal({
  drop,
  closeModal,
  onDropDeleted,
}: {
  readonly drop: ApiDrop;
  readonly closeModal: () => void;
  readonly onDropDeleted?: (() => void) | undefined;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { processDropRemoved } = useMyStream();

  const contentType =
    drop.drop_type === ApiDropType.Participatory ? "Drop" : "Post";

  const [mutating, setMutating] = useState(false);
  const deleteDropMutation = useMutation({
    mutationFn: async () =>
      await commonApiDelete({
        endpoint: `drops/${drop.id}`,
      }),
    onSuccess: () => {
      setToast({
        message: `${contentType} deleted.`,
        type: "warning",
      });
      invalidateDrops();
      processDropRemoved(drop.wave.id, drop.id);
      if (onDropDeleted) {
        onDropDeleted();
      } else {
        closeModal();
      }
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: `Couldn't delete this ${contentType.toLowerCase()}.`,
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
    try {
      await deleteDropMutation.mutateAsync();
    } catch {
      // The mutation callbacks own the visible error state and reset loading.
    }
  };

  return createPortal(
    <Transition appear show as={Fragment}>
      <Dialog
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1020] tw-cursor-default"
        onClose={mutating ? () => undefined : closeModal}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-transition-opacity tw-duration-200 tw-ease-out motion-reduce:tw-transition-none"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-transition-opacity tw-duration-150 tw-ease-in motion-reduce:tw-transition-none"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-gray-600/50" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-6">
            <TransitionChild
              as={Fragment}
              enter="tw-transform tw-transition tw-duration-200 tw-ease-out motion-reduce:tw-transition-none"
              enterFrom="tw-translate-y-4 tw-opacity-0 sm:tw-translate-y-0 sm:tw-scale-95"
              enterTo="tw-translate-y-0 tw-opacity-100 sm:tw-scale-100"
              leave="tw-transform tw-transition tw-duration-150 tw-ease-in motion-reduce:tw-transition-none"
              leaveFrom="tw-translate-y-0 tw-opacity-100 sm:tw-scale-100"
              leaveTo="tw-translate-y-4 tw-opacity-0 sm:tw-translate-y-0 sm:tw-scale-95"
            >
              <DialogPanel className="tw-relative tw-w-full tw-transform tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5 tw-text-left tw-shadow-2xl tw-shadow-black/30 sm:tw-max-w-lg sm:tw-p-6">
                <div className="tw-flex tw-items-start tw-gap-3 tw-pr-12 sm:tw-gap-4">
                  <span className="tw-inline-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-red/10 tw-bg-red/10">
                    <svg
                      className="tw-size-5 tw-flex-shrink-0 tw-text-red"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11.5V16.5M14 11.5V16.5M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="tw-min-w-0 tw-flex-1">
                    <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50">
                      Delete {contentType}
                    </DialogTitle>
                    <Description className="tw-mb-0 tw-mt-1 tw-text-pretty tw-text-sm tw-leading-5 tw-text-iron-400">
                      Are you sure you want to delete this{" "}
                      {contentType.toLowerCase()}?
                    </Description>
                  </div>
                  <div className="tw-absolute tw-right-5 tw-top-5 sm:tw-right-6 sm:tw-top-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={mutating}
                      className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950 tw-p-2 tw-text-iron-400 tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-text-iron-50"
                    >
                      <span className="tw-sr-only tw-text-sm">Close</span>
                      <svg
                        className="tw-h-6 tw-w-6"
                        aria-hidden="true"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="tw-mt-6">
                  <div className="tw-gap-x-3 sm:tw-flex sm:tw-flex-row-reverse">
                    <Button
                      onClick={onDelete}
                      loading={mutating}
                      variant="destructive"
                      size="md"
                      fullWidth
                      hideChildrenWhenLoading
                      className="sm:tw-w-auto"
                    >
                      Delete
                    </Button>
                    <Button
                      data-autofocus
                      disabled={mutating}
                      onClick={closeModal}
                      variant="secondary"
                      size="md"
                      fullWidth
                      className="tw-mt-3 sm:tw-mt-0 sm:tw-w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>,
    document.body
  );
}
