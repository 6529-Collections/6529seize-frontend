import { FC, useState, useEffect } from "react";
import { FocusTrap } from "focus-trap-react";

import PrimaryButton from "../utils/button/PrimaryButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

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
        aria-labelledby="terms-modal-title"
      >
        <div className="tw-bg-iron-800 tw-rounded-lg tw-shadow-lg tw-w-full tw-max-w-3xl tw-mx-4">
          <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-b tw-border-iron-700">
            <h3 className="tw-text-xl tw-font-semibold" id="terms-modal-title">
              Terms of Service
            </h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="tw-p-1 tw-rounded-full hover:tw-bg-iron-700 tw-transition tw-duration-150"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} className="tw-h-6 tw-w-6" />
            </button>
          </div>

          <div className="tw-p-4">
            <div
              className="tw-max-h-[400px] tw-overflow-y-auto tw-border tw-border-iron-700 tw-rounded tw-p-4 tw-mb-4 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
              tabIndex={0}
            >
              {termsContent ? (
                <div className="tw-whitespace-pre-wrap">{termsContent}</div>
              ) : (
                <div className="tw-text-center tw-text-iron-400 tw-py-8">
                  No terms of service found.
                </div>
              )}
            </div>

            <div className="tw-mb-4">
              <label className="tw-flex tw-items-center tw-cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  disabled={isLoading}
                  className="tw-mr-2"
                  aria-required="true"
                />
                <span>I have read and agree to the terms of service</span>
              </label>
            </div>
          </div>

          <div className="tw-flex tw-justify-end tw-p-4 tw-gap-3 tw-border-t tw-border-iron-700">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="tw-px-4 tw-py-2 tw-rounded tw-bg-iron-700 hover:tw-bg-iron-600 tw-transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton
              onClicked={onAccept}
              disabled={!hasAcknowledged}
              loading={isLoading}
            >
              Agree & Continue
            </PrimaryButton>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default TermsOfServiceModal;
