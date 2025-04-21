import { useRef } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import CommonAnimationWrapper from "../animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../animation/CommonAnimationOpacity";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export enum CommonModalWrapperSize {
  SMALL = "SMALL",
  LARGE = "LARGE",
  X_LARGE = "X_LARGE",
}

interface CommonModalWrapperProps {
  readonly children: React.ReactNode;
  readonly showModal: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly modalSize?: CommonModalWrapperSize;
}

const MODAL_SIZE_CLASSES: Record<CommonModalWrapperSize, string> = {
  [CommonModalWrapperSize.SMALL]: "tw:sm:max-w-lg",
  [CommonModalWrapperSize.LARGE]: "tw:sm:max-w-xl",
  [CommonModalWrapperSize.X_LARGE]: "tw:sm:max-w-2xl",
};

export default function CommonModalWrapper({
  children,
  showModal,
  onClose,
  title,
  modalSize = CommonModalWrapperSize.SMALL,
}: CommonModalWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, () => onClose());
  useKeyPressEvent("Escape", () => onClose());

  const modalSizeClass = MODAL_SIZE_CLASSES[modalSize];
  return (
    <CommonAnimationWrapper mode="sync" initial={true}>
      {showModal && (
        <CommonAnimationOpacity
          key="modal"
          elementClasses="tw:relative tw:z-10"
          elementRole="dialog"
          onClicked={(e) => e.stopPropagation()}
        >
          <div className="tw:relative tw:z-10">
            <div className="tw:fixed tw:inset-0 tw:bg-gray-500/75"></div>
            <div className="tw:fixed tw:inset-0 tw:z-10 tw:overflow-y-auto">
              <div className="tw:flex tw:min-h-full tw:items-end tw:justify-center tw:p-4 tw:text-center tw:sm:items-center tw:sm:p-0">
                <div
                  ref={modalRef}
                  className={`tw:relative tw:w-full tw:transform tw:rounded-lg tw:bg-neutral-900 tw:text-left tw:shadow-xl tw:transition-all tw:sm:my-8 tw:sm:w-full ${modalSizeClass}`}
                >
                  <div className="tw:absolute tw:right-4 tw:top-6 tw:flex tw:justify-between tw:items-center">
                    <p className="tw:max-w-sm tw:text-lg tw:text-white tw:font-medium tw:mb-0">
                      {title}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      type="button"
                      className="tw:p-2.5 tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-neutral-900 tw:border-0 tw:text-neutral-400 tw:hover:text-neutral-50 tw:focus:outline-none tw:transition tw:duration-300 tw:ease-out"
                    >
                      <span className="tw:sr-only tw:text-sm">Close</span>
                      <FontAwesomeIcon
                        icon={faXmark}
                        height={16}
                        className="tw:h-6 tw:w-6"
                      />
                    </button>
                  </div>

                  {children}
                </div>
              </div>
            </div>
          </div>
        </CommonAnimationOpacity>
      )}
    </CommonAnimationWrapper>
  );
}
