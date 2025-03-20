import React from "react";
import PrimaryButton from "../../../../utils/button/PrimaryButton";

interface AgreementStepProps {
  readonly agreements: boolean;
  readonly setAgreements: (agreed: boolean) => void;
  readonly onContinue: () => void;
}

const AgreementStep: React.FC<AgreementStepProps> = ({ 
  agreements, 
  setAgreements, 
  onContinue, 
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div className="tw-text-iron-300 tw-text-sm">
        Before submitting your artwork to The Memes, please review and agree to
        the following terms:
      </div>

      <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-iron-900 tw-rounded-lg tw-p-5 tw-border tw-border-iron-800/50 tw-border-solid">
        <button
          onClick={() => setAgreements(!agreements)}
          className="tw-flex tw-items-start tw-gap-3 tw-w-full tw-text-left hover:tw-opacity-80 tw-transition-opacity tw-bg-transparent tw-border-0"
        >
          <div className="tw-flex-shrink-0 tw-mt-0.5">
            <div
              className={`tw-w-5 tw-h-5 tw-rounded tw-border ${
                agreements
                  ? "tw-bg-primary-500 tw-border-primary-600"
                  : "tw-bg-iron-800/70 tw-border-iron-700"
              } tw-flex tw-items-center tw-justify-center tw-transition-colors`}
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
          </div>
          <div className="tw-text-sm tw-text-iron-300">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </div>
        </button>
      </div>

      <div className="tw-mt-4 tw-flex tw-justify-center">
        <PrimaryButton
          onClicked={onContinue}
          loading={false}
          disabled={!agreements}
          padding="tw-px-6 tw-py-2.5"
        >
          I Agree & Continue
        </PrimaryButton>
      </div>
    </div>
  );
};

export default AgreementStep;
