import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

export default function MobileWrapperDialog({
  title,
  isOpen,
  onClose,
  onBeforeLeave,
  onAfterLeave,
  children,
  noPadding,
}: {
  readonly title?: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onBeforeLeave?: () => void;
  readonly onAfterLeave?: () => void;
  readonly children: React.ReactNode;
  readonly noPadding?: boolean;
}) {
  return (
    <Transition appear={true} show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tailwind-scope tw-relative tw-z-[1000]"
        onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="tw-ease-in-out tw-duration-250"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in-out tw-duration-250"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
          beforeLeave={onBeforeLeave}
          afterLeave={onAfterLeave}>
          <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-transition-opacity" />
        </TransitionChild>

        <div className="tw-fixed tw-inset-0">
          <div className="tw-absolute tw-inset-0 tw-overflow-hidden">
            <div className="tw-flex tw-justify-center tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-pt-10">
              <TransitionChild
                as={Fragment}
                enter="tw-transform tw-transition tw-ease-in-out tw-duration-250 sm:tw-duration-350"
                enterFrom="tw-translate-y-full"
                enterTo="tw-translate-y-0"
                leave="tw-transform tw-transition tw-ease-in-out tw-duration-250 sm:tw-duration-350"
                leaveFrom="tw-translate-y-0"
                leaveTo="tw-translate-y-full">
                <DialogPanel className="tw-pointer-events-auto tw-relative tw-w-screen md:tw-max-w-screen-md">
                  <TransitionChild
                    as={Fragment}
                    enter="tw-ease-in-out tw-duration-250"
                    enterFrom="tw-opacity-0"
                    enterTo="tw-opacity-100"
                    leave="tw-ease-in-out tw-duration-250"
                    leaveFrom="tw-opacity-100"
                    leaveTo="tw-opacity-0">
                    <div className="tw-absolute tw-right-0 -tw-top-16 -tw-ml-8 tw-flex tw-pr-2 tw-pt-4 sm:-tw-ml-10 sm:tw-pr-4">
                      <button
                        type="button"
                        title="Close panel"
                        aria-label="Close panel"
                        className="tw-p-2.5 tw-relative tw-bg-transparent tw-rounded-md focus:tw-outline-none tw-border-none focus:tw-ring-2 focus:tw-ring-white"
                        onClick={onClose}>
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
                  </TransitionChild>
                  <div
                    className={`tw-flex tw-flex-col tw-bg-iron-950 tw-rounded-t-xl tw-overflow-y-auto tw-scroll-py-3 ${
                      noPadding ? "tw-py-0" : "tw-py-6 "
                    }`}
                    style={{ maxHeight: "calc(100dvh - 12rem)" }}>
                    <div className="tw-px-4 sm:tw-px-6">
                      {title && (
                        <DialogTitle className="tw-text-base tw-font-semibold tw-text-iron-50">
                          {title}
                        </DialogTitle>
                      )}
                    </div>
                    {children}
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
