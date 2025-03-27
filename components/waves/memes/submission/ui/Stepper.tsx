import React from "react";

interface StepperProps {
  readonly currentStep: number;
  readonly totalSteps: number;
}

const Stepper: React.FC<StepperProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-mb-8 tw-w-full tw-max-w-full">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          {/* Step circle */}
          <div className="tw-flex tw-flex-col tw-items-center">
            <div
              className={`tw-w-8 tw-h-8 tw-rounded-full tw-flex tw-items-center tw-justify-center ${
                index < currentStep
                  ? "tw-bg-primary-500 tw-text-white"
                  : index === currentStep
                  ? "tw-bg-primary-400 tw-text-white"
                  : "tw-bg-iron-800 tw-text-iron-400"
              } tw-transition-colors`}
            >
              {index < currentStep ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="tw-w-4 tw-h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="tw-text-xs tw-mt-1 tw-text-iron-400">
              {index === 0 ? "Terms" : "Artwork"}
            </div>
          </div>

          {/* Connector line between steps (except after the last step) */}
          {index < totalSteps - 1 && (
            <div
              className={`tw-h-[2px] tw-flex-1 tw-max-w-[100px] ${
                index < currentStep ? "tw-bg-primary-500" : "tw-bg-iron-800"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;