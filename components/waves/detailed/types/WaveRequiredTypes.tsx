import { Wave } from "../../../../generated/models/Wave";

export default function WaveRequiredTypes({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-w-full">
      <div>
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
                Required Types
              </p>
            </div>
            <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
              <div className="tw-group tw-text-sm tw-flex tw-flex-col">
                <div className="tw-inline-flex tw-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="tw-mr-2 tw-flex-shrink-0 tw-size-5 tw-text-iron-300"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>

                  <span className="tw-font-medium tw-text-iron-400">Image</span>
                </div>
                <div className="tw-flex tw-w-full tw-justify-between">
                  <span className="tw-font-medium tw-text-white tw-text-md">
                    Required
                  </span>
                  <div className="tw-flex tw-h-6 tw-items-center">
                    <input
                      type="checkbox"
                      className="tw-form-checkbox tw-w-4 tw-h-4 sm:tw-w-5 sm:tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="tw-group tw-text-sm tw-flex tw-flex-col">
                <div className="tw-inline-flex tw-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="tw-mr-2 tw-flex-shrink-0 tw-size-5 tw-text-iron-300"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>

                  <span className="tw-font-medium tw-text-iron-400">Audio</span>
                </div>
                <div className="tw-flex tw-w-full tw-justify-between">
                  <span className="tw-font-medium tw-text-white tw-text-md">
                    Required
                  </span>
                  <div className="tw-flex tw-h-6 tw-items-center">
                    <input
                      type="checkbox"
                      className="tw-form-checkbox tw-w-4 tw-h-4 sm:tw-w-5 sm:tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="tw-group tw-text-sm tw-flex tw-flex-col">
                <div className="tw-inline-flex tw-items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="tw-mr-2 tw-flex-shrink-0 tw-size-5 tw-text-iron-300"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>

                  <span className="tw-font-medium tw-text-iron-400">Video</span>
                </div>
                <div className="tw-flex tw-w-full tw-justify-between">
                  <span className="tw-font-medium tw-text-white tw-text-md">
                    Optional
                  </span>
                  <div className="tw-flex tw-h-6 tw-items-center">
                    <input
                      type="checkbox"
                      className="tw-form-checkbox tw-w-4 tw-h-4 sm:tw-w-5 sm:tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
