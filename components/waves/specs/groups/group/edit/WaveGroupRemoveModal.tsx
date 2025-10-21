"use client";

import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";

export default function WaveGroupRemoveModal({
  closeModal,
  removeGroup,
}: {
  readonly closeModal: () => void;
  readonly removeGroup: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, closeModal);
  useKeyPressEvent("Escape", closeModal);
  return createPortal(
    <div className="tw-cursor-default tw-relative tw-z-50">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6">
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl sm:tw-flex sm:tw-space-x-4">
                <div>
                  <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-red/10 tw-border tw-border-solid tw-border-red/10">
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-red tw-transition tw-duration-300 tw-ease-out"
                    />
                  </span>
                </div>
                <div className="tw-mt-3 sm:tw-mt-0 sm:tw-max-w-sm tw-flex tw-flex-col">
                  <p className=" tw-text-lg tw-text-iron-50 tw-font-medium tw-mb-0">
                    Remove Group
                  </p>
                  <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-iron-400">
                    Are you sure you want to remove this group?
                  </p>
                </div>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
                <button
                  onClick={closeModal}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out">
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <FontAwesomeIcon icon={faXmark} className="tw-h-6 tw-w-6" />
                </button>
              </div>
            </div>
            <form>
              <div className="tw-mt-8">
                <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
                  <button
                    onClick={removeGroup}
                    type="button"
                    className="tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-justify-center tw-relative  tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-bg-[#F04438] tw-border-[#F04438] hover:tw-bg-[#D92D20] hover:tw-border-[#D92D20]">
                    <div>Remove</div>
                  </button>
                  <button
                    onClick={closeModal}
                    type="button"
                    className="tw-mt-3 sm:tw-mt-0 tw-w-full hover:tw-bg-iron-800 hover:tw-border-iron-700 sm:tw-w-auto tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
