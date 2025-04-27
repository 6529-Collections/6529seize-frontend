import { FC, useState, useEffect } from "react";
import { FocusTrap } from "focus-trap-react";
import ModalLayout from "../waves/memes/submission/layout/ModalLayout";

import PrimaryButton from "../utils/button/PrimaryButton";

interface TermsOfServiceModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onAccept: () => void;
  readonly termsContent: string | null;
  readonly isLoading?: boolean;
}

const TermsOfServiceModal: FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  termsContent,
  isLoading = false,
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setHasAcknowledged(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <FocusTrap active={isOpen}>
      <div
        className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/60 tw-backdrop-blur"
        role="dialog"
        aria-modal="true"
      >
        <ModalLayout title="Terms of Service" onCancel={onClose}>
          <div className="tw-p-4">
            <div
              className="tw-max-h-[400px] tw-overflow-y-auto tw-border tw-border-iron-800/50 tw-rounded-lg tw-p-3 lg:tw-p-5 tw-mb-4 tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
              tabIndex={0}
            >
              {termsContent ? (
                <div className="tw-whitespace-pre-wrap">{termsContent}</div>
              ) : (
                <div className="tw-text-center tw-text-iron-300 tw-py-8">
                  No terms of service found.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setHasAcknowledged(!hasAcknowledged)}
              className="tw-flex tw-pt-4 tw-items-start tw-p-0 tw-gap-3 tw-text-left hover:tw-opacity-80 tw-transition-opacity tw-bg-transparent tw-border-0 tw-mb-4"
              aria-label="Agree to terms of service checkbox"
              aria-checked={hasAcknowledged}
              role="checkbox"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setHasAcknowledged(!hasAcknowledged);
                }
              }}
            >
              <div
                className={`tw-w-5 tw-h-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid ${
                  hasAcknowledged
                    ? "tw-bg-primary-500 tw-border-primary-600"
                    : "tw-bg-iron-700 tw-border-iron-650"
                } tw-flex tw-items-center tw-justify-center tw-transition-colors`}
              >
                {hasAcknowledged && (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    className="tw-w-3 tw-h-3 tw-text-white tw-flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="tw-text-sm tw-text-iron-300 tw-font-bold">
                I have read and agree to the terms of service
              </span>
            </button>
          </div>

          <div className="tw-flex tw-justify-end tw-p-4 tw-gap-3 tw-border-t tw-border-iron-700">
            <PrimaryButton
              onClicked={onAccept}
              disabled={!hasAcknowledged}
              loading={isLoading}
            >
              Agree & Continue
            </PrimaryButton>
          </div>
        </ModalLayout>
      </div>
    </FocusTrap>
  );
};

export default TermsOfServiceModal;
