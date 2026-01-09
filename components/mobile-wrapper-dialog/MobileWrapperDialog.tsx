import useCapacitor from "@/hooks/useCapacitor";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";

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
}) {
  const { isCapacitor } = useCapacitor();

  const bottomPadding = noPadding
    ? "env(safe-area-inset-bottom,0px)"
    : "calc(env(safe-area-inset-bottom,0px) + 1.5rem)";

  const getHeight = () => {
    if (tall && !isCapacitor) {
      return "calc(100dvh - 4rem)";
    }
    return "calc(100dvh - 10rem)";
  };

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
            <div className="tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-justify-center tw-pt-10">
              <TransitionChild
                as={Fragment}
                enter="tw-duration-250 sm:tw-duration-350 tw-transform tw-transition tw-ease-in-out"
                enterFrom="tw-translate-y-full"
                enterTo="tw-translate-y-0"
                leave="tw-duration-250 sm:tw-duration-350 tw-transform tw-transition tw-ease-in-out"
                leaveFrom="tw-translate-y-0"
                leaveTo="tw-translate-y-full"
              >
                <DialogPanel
                  className="tw-pointer-events-auto tw-relative tw-w-screen tw-transform-gpu tw-will-change-transform md:tw-max-w-screen-md"
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
                    <div className="tw-absolute -tw-top-16 tw-right-0 -tw-ml-8 tw-flex tw-pr-2 tw-pt-4 sm:-tw-ml-10 sm:tw-pr-4">
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
                    }`}
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
