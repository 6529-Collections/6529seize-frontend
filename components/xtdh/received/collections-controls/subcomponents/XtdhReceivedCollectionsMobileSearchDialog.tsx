"use client";

import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import CommonInput from "@/components/utils/input/CommonInput";

interface XtdhReceivedCollectionsMobileSearchDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly value: string;
  readonly onChange: (value: string | null) => void;
  readonly isLoading: boolean;
}

export function XtdhReceivedCollectionsMobileSearchDialog({
  isOpen,
  onClose,
  value,
  onChange,
  isLoading,
}: XtdhReceivedCollectionsMobileSearchDialogProps) {
  return (
    <Transition appear={true} show={isOpen} as={Fragment}>
      <Dialog as="div" className="tw-relative tw-z-[1010]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="tw-ease-out tw-duration-150"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in tw-duration-100"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-black/60" aria-hidden="true" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-flex tw-items-start tw-justify-center tw-px-4 tw-pt-16 tw-pb-8">
          <TransitionChild
            as={Fragment}
            enter="tw-ease-out tw-duration-200 tw-transform"
            enterFrom="tw-translate-y-4 tw-opacity-0"
            enterTo="tw-translate-y-0 tw-opacity-100"
            leave="tw-ease-in tw-duration-150 tw-transform"
            leaveFrom="tw-translate-y-0 tw-opacity-100"
            leaveTo="tw-translate-y-4 tw-opacity-0"
          >
            <DialogPanel className="tw-w-full tw-max-w-lg tw-rounded-2xl tw-bg-iron-950 tw-p-4 tw-shadow-xl tw-ring-1 tw-ring-iron-800">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                  Search collections
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-text-iron-200 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  <FontAwesomeIcon icon={faXmark} className="tw-h-4 tw-w-4" />
                  <span className="tw-sr-only">Close search</span>
                </button>
              </div>
              <div className="tw-mt-4">
                <CommonInput
                  value={value}
                  onChange={onChange}
                  placeholder="Search collections..."
                  showSearchIcon={true}
                  disabled={isLoading}
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
