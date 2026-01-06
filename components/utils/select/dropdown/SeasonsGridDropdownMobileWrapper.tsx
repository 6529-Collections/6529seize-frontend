import { Dialog, Transition } from "@headlessui/react";
import type { ReactNode } from "react";
import { Fragment } from "react";

export default function SeasonsGridDropdownMobileWrapper({
  isOpen,
  setOpen,
  label,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly label?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tailwind-scope tw-z-[1000] tw-absolute lg:tw-hidden"
        onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="tw-ease-in-out tw-duration-300"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in-out tw-duration-300"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0">
          <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-transition-opacity" />
        </Transition.Child>

        <div className="tw-fixed tw-inset-0 tw-overflow-hidden">
          <div className="tw-absolute tw-inset-0 tw-overflow-hidden">
            <div className="tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-pt-10">
              <Transition.Child
                as={Fragment}
                enter="tw-transform tw-transition tw-ease-out tw-duration-300"
                enterFrom="tw-translate-y-full"
                enterTo="tw-translate-y-0"
                leave="tw-transform tw-transition tw-ease-in tw-duration-300"
                leaveFrom="tw-translate-y-0"
                leaveTo="tw-translate-y-full">
                <Dialog.Panel className="tw-pointer-events-auto tw-relative tw-w-screen">
                  <Transition.Child
                    as={Fragment}
                    enter="tw-ease-in-out tw-duration-300"
                    enterFrom="tw-opacity-0"
                    enterTo="tw-opacity-100"
                    leave="tw-ease-in-out tw-duration-300"
                    leaveFrom="tw-opacity-100"
                    leaveTo="tw-opacity-0">
                    <div className="tw-absolute tw-right-0 -tw-top-16 -tw-ml-8 tw-flex tw-pr-2 tw-pt-4 sm:-tw-ml-10 sm:tw-pr-4">
                      <button
                        type="button"
                        title="Close panel"
                        aria-label="Close panel"
                        className="tw-p-2.5 tw-relative tw-bg-transparent tw-rounded-md focus:tw-outline-none tw-border-none focus:tw-ring-2 focus:tw-ring-white"
                        onClick={() => setOpen(false)}>
                        <svg
                          className="tw-w-6 tw-h-6 tw-flex-shrink-0 tw-text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg">
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
                  </Transition.Child>
                  <div
                    className="tw-flex tw-flex-col tw-bg-iron-950 tw-rounded-t-xl tw-overflow-y-auto tw-scroll-py-3 tw-pt-6"
                    style={{ maxHeight: "calc(100vh - 8rem)" }}>
                    {label && (
                      <div className="tw-px-6">
                        <Dialog.Title className="tw-text-base tw-font-semibold tw-text-iron-50">
                          {label}
                        </Dialog.Title>
                      </div>
                    )}
                    <div className="tw-relative tw-mt-3 tw-flex-1 tw-px-4 sm:tw-px-6 tw-gap-y-6 tw-flex tw-flex-col tw-pb-[env(safe-area-inset-bottom,0px)]">
                      <div className="tw-grid tw-grid-cols-4 tw-gap-3">
                        {children}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

