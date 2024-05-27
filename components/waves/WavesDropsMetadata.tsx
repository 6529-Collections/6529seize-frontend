export default function WavesDropsMetadata() {
  return (
    <div className="tw-pt-6">
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Required metadata
      </p>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-col-span-full tw-grid tw-grid-cols-3 tw-gap-4">
          <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400 tw-bg-primary-400/10 tw-px-5 tw-py-4 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out">
            <input
              type="radio"
              checked
              className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-500 focus:tw-ring-primary-500 tw-cursor-pointer"
            />
            <span className="tw-flex tw-items-center">
              <span className="tw-flex tw-flex-col tw-text-base">
                <span className="tw-font-bold tw-text-primary-400">Text</span>
              </span>
            </span>
          </div>
          <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-px-5 tw-py-4 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out">
            <input
              type="radio"
              className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
            />
            <span className="tw-flex tw-items-center">
              <span className="tw-flex tw-flex-col tw-text-base">
                <span className="tw-font-semibold tw-text-iron-300">
                  Number
                </span>
              </span>
            </span>
          </div>
        </div>
        <div className="tw-col-span-full">
          <div className="tw-relative tw-w-full">
            <input
              type="text"
              id="floating_metadata_name"
              className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              htmlFor="floating_metadata_name"
              className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0]  tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Name
            </label>
          </div>
        </div>
        <div className="tw-col-span-full">
          <div className="tw-relative tw-w-full">
            <input
              type="text"
              id="floating_metadata_name"
              className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              htmlFor="floating_metadata_name"
              className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0]  tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Name
            </label>
          </div>
        </div>
      </div>
      <div className="tw-mt-6 tw-text-right">
        <button
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div>
    </div>
  );
}
