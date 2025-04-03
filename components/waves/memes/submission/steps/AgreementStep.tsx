import React from "react";
import PrimaryButton from "../../../../utils/button/PrimaryButton";
import { ApiWave } from "../../../../../generated/models/ApiWave";
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
    <div className="tw-flex tw-flex-col tw-pb-6 lg:tw-pb-8">
      <div className="tw-text-iron-300 tw-text-sm">
        <p>
          {" "}
          Before you submit your work to The Memes, we would like to make sure
          we are all on the same page about what this means for you and your
          work!
        </p>
        <p>
          Please read the important information below and confirm that you
          understand and agree. If you have any questions, please reach out to
          one of the team members before you submit!
        </p>
      </div>

      <div className="tw-mt-4 tw-flex tw-flex-col tw-bg-iron-900 tw-rounded-lg tw-p-3 lg:tw-p-5 tw-border tw-border-iron-800/50 tw-border-solid">
        {/* Terms content separate from checkbox for better readability */}

        <AgreementStepAgreement text={wave.participation.terms ?? ""} />

        <button
          onClick={() => setAgreements(!agreements)}
          className="tw-flex tw-pt-4 tw-items-start tw-p-0 tw-gap-3 tw-text-left hover:tw-opacity-80 tw-transition-opacity tw-bg-transparent tw-border-0"
          aria-label={
            agreements ? "Uncheck terms agreement" : "Check terms agreement"
          }
        >
          <div
            className={`tw-w-5 tw-h-5 tw-flex-shrink-0 tw-rounded tw-border ${
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
          <span className="tw-text-sm tw-text-iron-300 tw-font-bold">
            I have read and understood the above and will certify it with a
            signature from my wallet.
          </span>
        </button>
      </div>
      <div className="tw-mt-6 tw-flex tw-justify-center">
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
