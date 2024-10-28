import { FC } from "react";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";

interface WaveDetailedOutcomesProps {
  readonly wave: ApiWave;
}

export const WaveDetailedOutcomes: FC<WaveDetailedOutcomesProps> = ({
  wave,
}) => {
  return (
    <div className="tw-p-4">
      <h2 className="tw-text-iron-50 tw-text-lg tw-font-semibold tw-mb-3">
        Outcome
      </h2>
      <div className="tw-space-y-3">
        <div className="tw-grid tw-grid-cols-3 tw-px-2">
          <span className="tw-pr-2 tw-text-iron-500 tw-font-normal tw-text-xs tw-uppercase">
            Category
          </span>
          <span className="tw-px-2 tw-text-iron-500 tw-font-normal tw-text-xs tw-text-right tw-uppercase">
            Winners
          </span>
          <span className="tw-pl-2 tw-text-iron-500 tw-font-normal tw-text-xs tw-text-right tw-uppercase">
            Prize
          </span>
        </div>
        <div className="tw-grid tw-grid-cols-3 tw-items-center tw-bg-iron-900 tw-rounded-lg tw-px-2 tw-py-2.5">
          <div className="tw-text-iron-50 tw-whitespace-nowrap tw-pr-2">
            Rep Category
          </div>
          <div className="tw-flex tw-items-center tw-justify-end tw-space-x-2 tw-px-2">
            <svg
              className="tw-size-4 tw-flex-shrink-0 tw-text-primary-300"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
            >
              {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
              <path
                fill="currentColor"
                d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
              />
            </svg>
            <span className="tw-text-primary-300 tw-font-semibold tw-text-sm">
              1
            </span>
          </div>
          <div className="tw-ml-2 tw-whitespace-nowrap tw-bg-iron-800 tw-text-iron-50 tw-text-sm tw-rounded-full tw-px-3 tw-py-1 tw-text-right">
            100k Rep
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-3 tw-items-center tw-bg-iron-900 tw-rounded-lg tw-p-3">
          <span className="tw-text-iron-50 tw-pr-2">NIC</span>
          <div className="tw-flex tw-items-center tw-justify-end tw-space-x-2 tw-px-2">
            <svg
              className="tw-size-4 tw-flex-shrink-0 tw-text-primary-300"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
            >
              {/* Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
              <path
                fill="currentColor"
                d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
              />
            </svg>
            <span className="tw-text-primary-300 tw-font-semibold tw-text-sm">
              10
            </span>
          </div>
          <span className="tw-ml-2 tw-whitespace-nowrap tw-bg-iron-800 tw-text-iron-50 tw-text-sm tw-rounded-full tw-px-3 tw-py-1 tw-text-right">
            1000 NIC
          </span>
        </div>
      </div>
    </div>
  );
};
