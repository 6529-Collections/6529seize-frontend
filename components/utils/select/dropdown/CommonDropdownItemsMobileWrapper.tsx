"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";

import useHasTouchInput from "@/hooks/useHasTouchInput";

import type { ReactNode } from "react";

export default function CommonDropdownItemsMobileWrapper({
  isOpen,
  setOpen,
  label,
  hideOnDesktopHover = true,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly label?: string | undefined;
  readonly hideOnDesktopHover?: boolean | undefined;
  readonly children: ReactNode;
}) {
  const hasTouchInput = useHasTouchInput();
  const shouldHideOnDesktopHover = hideOnDesktopHover && !hasTouchInput;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`tailwind-scope tw-absolute tw-z-[1000] ${shouldHideOnDesktopHover ? "lg:desktop-hover:tw-hidden" : ""}`}
        onClose={setOpen}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-duration-300 tw-ease-in-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-300 tw-ease-in-out"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-iron-600/60 tw-transition-opacity" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0 tw-overflow-hidden">
          <div className="tw-absolute tw-inset-0 tw-overflow-hidden">
            <div className="tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-pt-10">
              <TransitionChild
                as={Fragment}
                enter="tw-transform tw-transition tw-duration-300 tw-ease-out"
                enterFrom="tw-translate-y-full"
                enterTo="tw-translate-y-0"
                leave="tw-transform tw-transition tw-duration-300 tw-ease-in"
                leaveFrom="tw-translate-y-0"
                leaveTo="tw-translate-y-full"
              >
                <DialogPanel className="tw-pointer-events-auto tw-relative tw-w-screen tw-transform-gpu">
                  <TransitionChild
                    as={Fragment}
                    enter="tw-duration-300 tw-ease-in-out"
                    enterFrom="tw-opacity-0"
                    enterTo="tw-opacity-100"
                    leave="tw-duration-300 tw-ease-in-out"
                    leaveFrom="tw-opacity-100"
                    leaveTo="tw-opacity-0"
                  >
                    <div className="tw-absolute -tw-top-16 tw-right-0 -tw-ml-8 tw-flex tw-pr-2 tw-pt-4 sm:-tw-ml-10 sm:tw-pr-4">
                      <button
                        type="button"
                        title="Close panel"
                        aria-label="Close panel"
                        className="tw-relative tw-rounded-md tw-border-none tw-bg-transparent tw-p-2.5 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white"
                        onClick={() => setOpen(false)}
                      >
                        <svg
                          className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </TransitionChild>
                  <div
                    className="tw-flex tw-scroll-py-3 tw-flex-col tw-overflow-y-auto tw-rounded-t-xl tw-bg-iron-950 tw-pt-4"
                    style={{
                      maxHeight: "calc(100vh - 8rem)",
                      paddingBottom: "env(safe-area-inset-bottom,0px)",
                    }}
                  >
                    {label && (
                      <div className="tw-px-6">
                        <DialogTitle className="tw-text-base tw-font-semibold tw-text-iron-50">
                          {label}
                        </DialogTitle>
                      </div>
                    )}
                    <div className="tw-relative tw-mt-3 tw-flex tw-flex-1 tw-flex-col tw-gap-y-6 tw-px-4 sm:tw-px-6">
                      <ul className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-space-y-3 tw-pl-0">
                        {children}
                      </ul>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
