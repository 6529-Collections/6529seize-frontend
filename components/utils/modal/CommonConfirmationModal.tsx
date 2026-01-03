"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";

interface CommonConfirmationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly confirmText?: string | undefined;
  readonly cancelText?: string | undefined;
  readonly isConfirming?: boolean | undefined;
  readonly icon?: React.ReactNode | undefined;
  readonly confirmButtonClass?: string | undefined;
}

export default function CommonConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isConfirming = false,
  icon,
  confirmButtonClass,
}: CommonConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="tw-cursor-default tw-relative tw-z-[80]">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl sm:tw-flex sm:tw-space-x-4">
                {icon && <div>{icon}</div>}
                <div className="tw-mt-3 sm:tw-mt-0 sm:tw-max-w-sm tw-flex tw-flex-col">
                  <p className=" tw-text-lg tw-text-iron-50 tw-font-medium tw-mb-0">
                    {title}
                  </p>
                  <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-text-iron-400">
                    {message}
                  </p>
                </div>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-justify-between tw-items-center">
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
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
            </div>
            <div className="tw-mt-8">
              <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
                <button
                  disabled={isConfirming}
                  onClick={onConfirm}
                  type="button"
                  className={`tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-justify-center tw-relative  tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out ${isConfirming
                      ? "tw-cursor-not-allowed tw-bg-iron-400 tw-border-iron-400"
                      : confirmButtonClass ??
                      "tw-cursor-pointer tw-bg-[#F04438] tw-border-[#F04438] hover:tw-bg-[#D92D20] hover:tw-border-[#D92D20]"
                    }`}
                >
                  <div
                    style={{
                      visibility: isConfirming ? "hidden" : "visible",
                    }}
                  >
                    {confirmText}
                  </div>
                  {isConfirming && (
                    <svg
                      aria-hidden="true"
                      role="output"
                      className="tw-inline tw-w-5 tw-h-5 tw-text-white tw-animate-spin tw-absolute"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        className="tw-text-iron-600"
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  )}
                </button>
                <button
                  disabled={isConfirming}
                  onClick={onClose}
                  type="button"
                  className={`tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out ${isConfirming
                      ? "tw-cursor-not-allowed"
                      : "hover:tw-bg-iron-800 hover:tw-border-iron-700"
                    }`}
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
