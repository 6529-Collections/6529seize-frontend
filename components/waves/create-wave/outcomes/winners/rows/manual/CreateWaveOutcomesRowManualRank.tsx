import { Tooltip } from "react-tooltip";
import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";

export default function CreateWaveOutcomesRowManualRank({
  outcome,
  removeOutcome,
}: {
  readonly outcome: CreateWaveOutcomeConfig;
  readonly removeOutcome: () => void;
}) {
  return (
    <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-5 tw-py-2">
      <div className="tw-grid tw-grid-cols-10 tw-gap-x-4 tw-justify-between tw-items-center tw-w-full">
        <div className="tw-col-span-1">
          <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-white">
            Manual
          </h3>
        </div>
        <div className="tw-col-span-8">
          <>
            <p 
              className="tw-mb-0 tw-text-sm tw-text-white tw-font-normal tw-truncate"
              data-tooltip-id={`manual-title-${outcome.title}`}
            >
              {outcome.title}
            </p>
            <Tooltip
              id={`manual-title-${outcome.title}`}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}
            >
              {outcome.title}
            </Tooltip>
          </>
        </div>
        <div className="tw-col-span-1 tw-flex tw-justify-end">
          <button
            onClick={removeOutcome}
            aria-label="Remove"
            className="tw-h-8 tw-w-8 tw-text-error tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-error/10 focus:tw-scale-90 tw-transform tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-flex-shrink-0 tw-h-5 tw-w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
