import WavesCreditType from "./WavesCreditType";
import WavesFinalizationPeriod from "./WavesFinalizationPeriod";
import WavesRatingScope from "./WavesRatingScope";
import WavesRatingType from "./WavesRatingType";

export default function WavesRating() {
  return (
    <div className="tw-flex tw-flex-col">
      <nav aria-label="Progress" className="tw-mx-auto">
        <div className="tw-flex tw-flex-row tw-items-center tw-space-x-4">
          <button
            type="button"
            className="tw-bg-transparent tw-p-0 tw-border-none focus:tw-outline-none tw-group tw-relative tw-flex tw-items-center"
          >
            <span className="tw-relative tw-z-10 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-ring-2 tw-ring-primary-500 tw-bg-primary-600">
              <svg
                width="13"
                height="11"
                className="tw-text-white"
                viewBox="0 0 13 11"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.0965 0.390037L3.9365 7.30004L2.0365 5.27004C1.6865 4.94004 1.1365 4.92004 0.736504 5.20004C0.346504 5.49004 0.236503 6.00004 0.476503 6.41004L2.7265 10.07C2.9465 10.41 3.3265 10.62 3.7565 10.62C4.1665 10.62 4.5565 10.41 4.7765 10.07C5.1365 9.60004 12.0065 1.41004 12.0065 1.41004C12.9065 0.490037 11.8165 -0.319963 11.0965 0.380037V0.390037Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="tw-ml-4 tw-text-sm tw-font-bold tw-text-primary-400">
              Scope
            </span>
            <div className="tw-ml-2 tw-h-0.5 tw-w-9 tw-bg-primary-500 tw-rounded-sm"></div>
          </button>
          <button
            type="button"
            className="tw-bg-transparent tw-p-0 tw-border-none focus:tw-outline-none tw-group tw-relative tw-flex tw-items-center"
          >
            <span className="tw-flex tw-h-9 tw-items-center">
              <span className="tw-relative tw-z-10 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-ring-2 tw-ring-iron-700 tw-bg-iron-900">
                <svg
                  width="8"
                  height="8"
                  className="tw-text-iron-500"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="4" cy="4" r="4" fill="currentColor" />
                </svg>
              </span>
            </span>
            <span className="tw-ml-4 tw-text-sm tw-font-semibold tw-text-iron-600">
              Credit Type
            </span>
            <div className="tw-ml-2 tw-h-0.5 tw-w-9 tw-bg-iron-700 tw-rounded-sm"></div>
          </button>
          <button
            type="button"
            className="tw-bg-transparent tw-p-0 tw-border-none focus:tw-outline-none tw-group tw-relative tw-flex tw-items-center"
          >
            <span className="tw-flex tw-h-9 tw-items-center">
              <span className="tw-relative tw-z-10 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-ring-2 tw-ring-iron-700 tw-bg-iron-900">
                <svg
                  width="8"
                  height="8"
                  className="tw-text-iron-500"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="4" cy="4" r="4" fill="currentColor" />
                </svg>
              </span>
            </span>
            <span className="tw-ml-4 tw-text-sm tw-font-semibold tw-text-iron-600">
              Rating Type
            </span>
            <div className="tw-ml-2 tw-h-0.5 tw-w-9 tw-bg-iron-700 tw-rounded-sm"></div>
          </button>
          <button
            type="button"
            className="tw-bg-transparent tw-p-0 tw-border-none focus:tw-outline-none tw-group tw-relative tw-flex tw-items-center"
          >
            <span className="tw-flex tw-h-9 tw-items-center">
              <span className="tw-relative tw-z-10 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-ring-2 tw-ring-iron-700 tw-bg-iron-900">
                <svg
                  width="8"
                  height="8"
                  className="tw-text-iron-500"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="4" cy="4" r="4" fill="currentColor" />
                </svg>
              </span>
            </span>
            <span className="tw-ml-4 tw-text-sm tw-font-semibold tw-text-iron-600">
              Finalization Period
            </span>
          </button>
        </div>
      </nav>
      <div className="tw-mt-16 tw-max-w-xl tw-mx-auto tw-w-full">
        {/* <WavesRatingScope /> */}
        {/* <WavesCreditType /> */}
        <WavesRatingType />
        {/*  <WavesFinalizationPeriod /> */}
      </div>
    </div>
  );
}
