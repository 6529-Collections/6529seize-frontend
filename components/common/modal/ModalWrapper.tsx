import { useRef } from "react";
import AnimationWrapper from "../animation/AnimationWrapper";
import { useClickAway, useKeyPressEvent } from "react-use";
import AnimationOpacity from "../animation/AnimationOpacity";

export enum ModalSize {
  SMALL = "SMALL",
  LARGE = "LARGE",
  X_LARGE = "X_LARGE",
}

interface ModalWrapperProps {
  children: React.ReactNode;
  showModal: boolean;
  onClose: () => void;
  title?: string;
  modalSize?: ModalSize;
  showTitle?: boolean;
}

export default function ModalWrapper({
  children,
  showModal,
  onClose,
  title,
  modalSize = ModalSize.SMALL,
  showTitle = true,
}: ModalWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, () => onClose());
  useKeyPressEvent("Escape", () => onClose());
  const modalSizeClasses: Record<ModalSize, string> = {
    [ModalSize.SMALL]: "sm:tw-max-w-lg",
    [ModalSize.LARGE]: "sm:tw-max-w-xl",
    [ModalSize.X_LARGE]: "sm:tw-max-w-2xl",
  };

  const modalSizeClass = modalSizeClasses[modalSize];
  return (
    <AnimationWrapper mode="sync" initial={true}>
      {showModal && (
        <AnimationOpacity
          key="modal"
          elementClasses="tw-relative tw-z-10"
          elementRole="dialog"
          onClicked={(e) => e.stopPropagation()}
        >
          <div className="tw-relative tw-z-10" role="dialog">
            <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
            <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
              <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
                <div
                  ref={modalRef}
                  className={`tw-relative tw-w-full tw-transform tw-rounded-lg tw-bg-neutral-900  tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full  ${modalSizeClass}`}
                >
                  {showTitle && (
                    <div className="tw-absolute tw-right-4 tw-top-6 tw-flex tw-justify-between tw-items-center">
                      <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
                        {title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                        }}
                        type="button"
                        className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                      >
                        <span className="tw-sr-only tw-text-sm">Close</span>
                        <svg
                          className="tw-h-6 tw-w-6"
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
                  )}
                  <div className="tw-mt-12">
                  {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimationOpacity>
      )}
    </AnimationWrapper>
  );
}
