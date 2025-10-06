import React from "react";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { ApiWave } from "@/generated/models/ApiWave";
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
    <div className="tw-h-full tw-flex tw-flex-col tw-relative">
      <div className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-px-4 md:tw-px-8 tw-pt-2 tw-pb-6">
        <div className="tw-max-w-6xl tw-mx-auto">
          <div className="tw-text-iron-300 tw-text-base tw-space-y-2">
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
          <div className="tw-mt-6 tw-flex tw-flex-col tw-bg-iron-900 tw-rounded-xl tw-p-4 lg:tw-p-6 tw-ring-1 tw-ring-iron-800">
            <AgreementStepAgreement text={wave.participation.terms ?? ""} />
          </div>
        </div>
      </div>
      <div className="tw-bg-iron-950 tw-border-t tw-border-iron-800 tw-border-solid tw-border-b-0 tw-border-x-0">
        <div className="tw-px-4 md:tw-px-8 tw-py-4">
          <div className="tw-max-w-6xl tw-mx-auto tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-between tw-gap-4">
            <button
              onClick={() => setAgreements(!agreements)}
              className="tw-flex tw-items-start tw-py-3 tw-px-4 tw-gap-3 tw-text-left tw-bg-iron-900/50 tw-rounded-lg tw-border-none tw-ring-1 tw-ring-iron-800 desktop-hover:hover:tw-ring-iron-700 tw-transition-all tw-flex-1"
              aria-label={
                agreements ? "Uncheck terms agreement" : "Check terms agreement"
              }
            >
              <div
                className={`tw-w-5 tw-h-5 tw-flex-shrink-0 tw-rounded tw-border tw-border-solid tw-transition-all tw-duration-300 ${
                  agreements
                    ? "tw-bg-primary-500 tw-border-primary-500 tw-shadow-[0_0_0_4px_rgba(139,92,246,0.1)]"
                    : "tw-bg-iron-800 tw-border-iron-700"
                } tw-flex tw-items-center tw-justify-center`}
              >
                {agreements && (
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
