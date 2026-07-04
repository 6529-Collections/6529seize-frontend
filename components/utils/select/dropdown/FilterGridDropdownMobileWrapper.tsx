import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Fragment } from "react";

export default function FilterGridDropdownMobileWrapper({
  isOpen,
  setOpen,
  label,
  gridColumnClassName,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly label?: string | undefined;
  readonly gridColumnClassName: string;
  readonly children: ReactNode;
}) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tailwind-scope tw-absolute tw-z-[1000] lg:tw-hidden"
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="tw-duration-300 tw-ease-in-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-300 tw-ease-in-out"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] tw-transition-opacity" />
        </Transition.Child>

        <div className="tw-fixed tw-inset-0 tw-overflow-hidden">
          <div className="tw-absolute tw-inset-0 tw-overflow-hidden">
            <div className="tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-pt-10">
              <Transition.Child
                as={Fragment}
                enter="tw-transform tw-transition tw-duration-300 tw-ease-out"
                enterFrom="tw-translate-y-full"
                enterTo="tw-translate-y-0"
                leave="tw-transform tw-transition tw-duration-300 tw-ease-in"
                leaveFrom="tw-translate-y-0"
                leaveTo="tw-translate-y-full"
              >
                <Dialog.Panel className="tw-pointer-events-auto tw-relative tw-w-screen">
                  <Transition.Child
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
                        <XMarkIcon
                          className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  <div
                    className="tw-flex tw-scroll-py-3 tw-flex-col tw-overflow-y-auto tw-rounded-t-xl tw-bg-iron-950 tw-pt-6"
                    style={{ maxHeight: "calc(100vh - 8rem)" }}
                  >
                    {label && (
                      <div className="tw-px-6">
                        <Dialog.Title className="tw-text-base tw-font-semibold tw-text-iron-50">
                          {label}
                        </Dialog.Title>
                      </div>
                    )}
                    <div className="tw-relative tw-mt-3 tw-flex tw-flex-1 tw-flex-col tw-gap-y-6 tw-px-4 tw-pb-[env(safe-area-inset-bottom,0px)] sm:tw-px-6">
                      <div
                        className={`tw-grid ${gridColumnClassName} tw-gap-3`}
                      >
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
