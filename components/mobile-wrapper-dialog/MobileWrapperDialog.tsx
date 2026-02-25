import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";

import useCapacitor from "@/hooks/useCapacitor";

export default function MobileWrapperDialog({
  title,
  isOpen,
  onClose,
  onBeforeLeave,
  onAfterLeave,
  children,
  noPadding,
  tall,
  fixedHeight,
  tabletModal,
}: {
  readonly title?: string | undefined;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onBeforeLeave?: (() => void) | undefined;
  readonly onAfterLeave?: (() => void) | undefined;
  readonly children: React.ReactNode;
  readonly noPadding?: boolean | undefined;
  readonly tall?: boolean | undefined;
  readonly fixedHeight?: boolean | undefined;
  readonly tabletModal?: boolean | undefined;
}) {
  const { isCapacitor, isIos } = useCapacitor();

  const bottomPadding = noPadding
    ? "env(safe-area-inset-bottom,0px)"
    : "calc(env(safe-area-inset-bottom,0px) + 1.5rem)";

  const viewportHeight = "min(100vh, 100svh)";
  const getHeight = () => {
    if (tall && !isCapacitor) {
      return `calc(${viewportHeight} - 4rem)`;
    }
    return `calc(${viewportHeight} - 10rem)`;
  };

  const panelClassNames = `mobile-wrapper-dialog tw-pointer-events-auto tw-relative tw-w-screen${
    tabletModal ? "" : " md:tw-max-w-screen-md"
  }${isIos ? "" : " tw-transform-gpu tw-will-change-transform"}${
    tabletModal ? " md:tw-w-full md:tw-max-w-md" : ""
  }`;

  const containerClassNames = `tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-justify-center tw-pt-10${
    tabletModal ? " md:tw-inset-0 md:tw-items-center md:tw-pt-0 md:tw-p-6" : ""
  }`;

  return (
    <Transition appear={true} show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tailwind-scope tw-absolute tw-z-[1010]"
        onClose={onClose}
      >
        <TransitionChild
          as={Fragment}
          enter="tw-duration-250 tw-ease-in-out"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-duration-250 tw-ease-in-out"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
          {...(onBeforeLeave ? { beforeLeave: onBeforeLeave } : {})}
          {...(onAfterLeave ? { afterLeave: onAfterLeave } : {})}
        >
          <div className="tw-fixed tw-inset-0 tw-bg-iron-600/60" />
        </TransitionChild>

        <div
          className="tw-fixed tw-inset-0"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <div
            className="tw-absolute tw-inset-0 tw-overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={containerClassNames}>
              <TransitionChild
                as={Fragment}
                enter="tw-duration-250 sm:tw-duration-350 tw-transform tw-transition tw-ease-in-out"
                enterFrom={`tw-translate-y-full${
                  tabletModal ? " md:tw-translate-y-4 md:tw-opacity-0" : ""
                }`}
                enterTo={`tw-translate-y-0${
                  tabletModal ? " md:tw-opacity-100" : ""
                }`}
                leave="tw-duration-250 sm:tw-duration-350 tw-transform tw-transition tw-ease-in-out"
                leaveFrom={`tw-translate-y-0${
                  tabletModal ? " md:tw-opacity-100" : ""
                }`}
                leaveTo={`tw-translate-y-full${
                  tabletModal ? " md:tw-translate-y-4 md:tw-opacity-0" : ""
                }`}
              >
                <DialogPanel
                  className={panelClassNames}
                  style={{ touchAction: "manipulation" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <TransitionChild
                    as={Fragment}
                    enter="tw-duration-250 tw-ease-in-out"
                    enterFrom="tw-opacity-0"
                    enterTo="tw-opacity-100"
                    leave="tw-duration-250 tw-ease-in-out"
                    leaveFrom="tw-opacity-100"
                    leaveTo="tw-opacity-0"
                  >
                    <div className="tw-absolute -tw-top-16 tw-right-0 tw-flex tw-pt-4 tw-pr-2 md:tw-pr-0">
                      <button
                        type="button"
                        title="Close panel"
                        aria-label="Close panel"
                        className="tw-relative tw-rounded-md tw-border-none tw-bg-transparent tw-p-2.5 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white"
                        onClick={onClose}
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
                    className={`tw-flex tw-scroll-py-3 tw-flex-col tw-overflow-y-auto tw-rounded-t-xl tw-bg-iron-950 ${
                      noPadding ? "tw-py-0" : "tw-py-6"
                    }${tabletModal ? " md:tw-rounded-xl" : ""}`}
                    style={{
                      ...(fixedHeight
                        ? { height: getHeight() }
                        : { maxHeight: getHeight() }),
                      paddingBottom: bottomPadding,
                    }}
                  >
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
