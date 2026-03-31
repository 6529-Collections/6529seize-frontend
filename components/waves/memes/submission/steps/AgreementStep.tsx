import React from "react";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import AgreementStepAgreement from "./AgreementStepAgreement";

interface AgreementStepProps {
  readonly wave: ApiWave;
  readonly agreements: boolean;
  readonly setAgreements: (agreed: boolean) => void;
  readonly onContinue: () => void;
}

const AgreementStep: React.FC<AgreementStepProps> = ({
  wave,
  agreements,
  setAgreements,
  onContinue,
}) => {
  return (
    <div className="tw-relative tw-flex tw-h-full tw-flex-col">
      <div className="tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-px-4 tw-pb-6 tw-pt-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 md:tw-px-8">
        <div className="tw-mx-auto tw-max-w-5xl">
          <div className="tw-mt-6 tw-max-w-4xl tw-space-y-2 tw-text-base tw-text-iron-300">
            <p className="tw-mb-0">
              Before you submit your work to The Memes, we would like to make
              sure we are all on the same page about what this means for you and
              your work!
            </p>
            <p className="tw-mb-0">
              Please read the important information below and confirm that you
              understand and agree. If you have any questions, please reach out
              to one of the team members before you submit!
            </p>
          </div>
          <div className="tw-mt-6 tw-flex tw-flex-col tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-ring-1 tw-ring-iron-800 lg:tw-p-6">
            <AgreementStepAgreement text={wave.participation.terms ?? ""} />
          </div>
        </div>
      </div>
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950">
        <div className="tw-px-4 tw-py-4 md:tw-px-8">
          <div className="tw-mx-auto tw-flex tw-max-w-5xl tw-flex-col tw-items-center tw-justify-between tw-gap-4 md:tw-flex-row">
            <button
              onClick={() => setAgreements(!agreements)}
              className="tw-flex tw-flex-1 tw-items-start tw-gap-3 tw-rounded-lg tw-border-none tw-bg-iron-900/50 tw-px-4 tw-py-3 tw-text-left tw-ring-1 tw-ring-iron-800 tw-transition-all desktop-hover:hover:tw-ring-iron-700"
              aria-label={
                agreements ? "Uncheck terms agreement" : "Check terms agreement"
              }
            >
              <div
                className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid tw-transition-all tw-duration-300 ${
                  agreements
                    ? "tw-border-primary-500 tw-bg-primary-500 tw-shadow-[0_0_0_4px_rgba(139,92,246,0.1)]"
                    : "tw-border-iron-700 tw-bg-iron-800"
                } tw-flex tw-items-center tw-justify-center`}
              >
                {agreements && (
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
              </div>
              <span
                className={`tw-text-sm tw-font-medium tw-transition-colors ${
                  agreements ? "tw-text-iron-100" : "tw-text-iron-300"
                }`}
              >
                I have read and understood the above and will certify it with a
                signature from my wallet.
              </span>
            </button>
            <PrimaryButton
              onClicked={onContinue}
              loading={false}
              disabled={!agreements}
              padding="tw-px-6 tw-py-3"
            >
              I Agree & Continue
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementStep;
