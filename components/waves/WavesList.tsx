import WavesCard from "./WavesCard";

export default function WavesList({
  showCreateNewWaveButton,
  onCreateNewWave,
}: {
  readonly showCreateNewWaveButton?: boolean;
  readonly onCreateNewWave: () => void;
}) {
  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl tw-mx-auto tw-py-12 ">
        <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
          <h1>Waves</h1>
          {showCreateNewWaveButton && (
            <button
              onClick={onCreateNewWave}
              type="button"
              className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Create New</span>
            </button>
          )}
        </div>
        <div className="tw-flex tw-flex-col tw-gap-y-6">
          <WavesCard />
        </div>
      </div>
    </div>
  );
}
