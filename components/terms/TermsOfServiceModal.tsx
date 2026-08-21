"use client";

import type { FC } from "react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import ModalLayout from "../waves/memes/submission/layout/ModalLayout";

import PrimaryButton from "../utils/button/PrimaryButton";

interface TermsOfServiceModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onAccept: () => void;
  readonly termsContent: string | null;
  readonly isLoading?: boolean | undefined;
}

type OpenTermsOfServiceModalProps = Omit<TermsOfServiceModalProps, "isOpen">;

const OpenTermsOfServiceModal: FC<OpenTermsOfServiceModalProps> = ({
  onClose,
  onAccept,
  termsContent,
  isLoading = false,
}) => {
  const locale = useBrowserLocale();
  const titleId = useId();
  const guidanceId = useId();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onClose]);

  return (
    <FocusTrap active>
      <div
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1100] tw-flex tw-items-center tw-justify-center tw-overflow-y-auto tw-bg-black/60 tw-px-2 tw-py-4 tw-backdrop-blur sm:tw-px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="tw-max-h-[calc(100dvh-2rem)] tw-w-full tw-max-w-4xl tw-overflow-y-auto tw-px-0 sm:tw-px-2">
          <ModalLayout
            title={t(locale, "waves.submission.acceptanceRules.modalTitle")}
            onCancel={onClose}
            closeDisabled={isLoading}
            titleId={titleId}
          >
            <div className="tw-p-4">
              <div className="tw-mb-4 tw-max-h-[45dvh] tw-overflow-y-auto tw-overflow-x-hidden tw-break-words tw-rounded-lg tw-border tw-border-iron-800/50 tw-bg-iron-900 tw-p-3 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 lg:tw-p-5">
                {termsContent ? (
                  <div
                    className="tw-whitespace-pre-wrap"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {termsContent}
                  </div>
                ) : (
                  <div className="tw-py-8 tw-text-center tw-text-iron-300">
                    {t(locale, "waves.submission.acceptanceRules.modalEmpty")}
                  </div>
                )}
              </div>

              <p
                id={guidanceId}
                className="tw-mb-0 tw-text-sm tw-leading-5 tw-text-iron-400"
              >
                {t(locale, "waves.submission.acceptanceRules.modalGuidance")}
              </p>

              <label
                className={`tw-mb-4 tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-py-3 tw-text-left tw-transition-opacity focus-within:tw-ring-2 focus-within:tw-ring-primary-400 focus-within:tw-ring-offset-2 focus-within:tw-ring-offset-iron-950 ${
                  isLoading
                    ? "tw-cursor-not-allowed tw-opacity-60"
                    : "tw-cursor-pointer desktop-hover:hover:tw-opacity-80"
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(event) => setHasAcknowledged(event.target.checked)}
                  aria-describedby={guidanceId}
                  disabled={isLoading}
                  className="tw-sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid ${
                    hasAcknowledged
                      ? "tw-border-primary-600 tw-bg-primary-500"
                      : "tw-border-iron-650 tw-bg-iron-700"
                  } tw-flex tw-items-center tw-justify-center tw-transition-colors`}
                >
                  {hasAcknowledged && (
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      className="tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-white"
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
                </span>
                <span className="tw-text-sm tw-font-bold tw-text-iron-300">
                  {t(
                    locale,
                    "waves.submission.acceptanceRules.modalCheckboxLabel"
                  )}
                </span>
              </label>
            </div>

            <div className="tw-flex tw-justify-end tw-gap-3 tw-border-t tw-border-iron-700 tw-p-4">
              <PrimaryButton
                onClicked={onAccept}
                disabled={!hasAcknowledged}
                loading={isLoading}
              >
                {t(locale, "waves.submission.acceptanceRules.modalSubmit")}
              </PrimaryButton>
            </div>
          </ModalLayout>
        </div>
      </div>
    </FocusTrap>
  );
};

const TermsOfServiceModal: FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  termsContent,
  isLoading = false,
}) => {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <OpenTermsOfServiceModal
      onClose={onClose}
      onAccept={onAccept}
      termsContent={termsContent}
      isLoading={isLoading}
    />,
    document.body
  );
};

export default TermsOfServiceModal;
