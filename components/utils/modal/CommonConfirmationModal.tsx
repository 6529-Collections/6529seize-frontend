"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";

import Button from "@/components/utils/button/Button";
import type { ButtonVariant } from "@/components/utils/button/buttonStyles";

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
  readonly confirmVariant?: ButtonVariant | undefined;
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
  confirmVariant = "destructive",
}: CommonConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="tw-cursor-default tw-relative tw-z-[80]">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50" />
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
                  <p className="tw-mb-0 tw-text-lg tw-font-medium tw-text-iron-50">
                    {title}
                  </p>
                  <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
                    {message}
                  </p>
                </div>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-items-center tw-justify-between">
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950 tw-p-2.5 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50 focus:tw-outline-none"
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
              <div className="tw-gap-x-3 sm:tw-flex sm:tw-flex-row-reverse">
                <Button
                  variant={confirmVariant}
                  size="lg"
                  loading={isConfirming}
                  onClick={onConfirm}
                  fullWidth
                  hideChildrenWhenLoading
                  className="sm:tw-w-auto"
                >
                  {confirmText}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={isConfirming}
                  onClick={onClose}
                  fullWidth
                  className="tw-mt-3 sm:tw-mt-0 sm:tw-w-auto"
                >
                  {cancelText}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
