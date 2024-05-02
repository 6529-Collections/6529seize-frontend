export default function WavesOverview() {
  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex-tw-flex-col tw-divide-y tw-divide-iron-700 tw-divide-solid tw-divide-x-0 tw-space-y-6">
        <div className="tw-flex tw-flex-col tw-gap-y-6">
          <div className="tw-relative">
            <input
              type="text"
              id="floating_name"
              className="tw-form-input tw-block tw-px-2.5 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-1 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
     tw-border-0 tw-py-3 tw-pl-4 tw-pr-4 tw-bg-[#1C1D20] tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              htmlFor="floating_name"
              className="tw-absolute tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0]  tw-bg-[#1C1D20] tw-px-2 peer-focus:tw-px-2  peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Name
            </label>
          </div>
          <div className="tw-relative">
            <input
              type="text"
              id="floating_description"
              className="tw-form-input tw-block tw-px-2.5 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-1 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
     tw-border-0 tw-py-3 tw-pl-4 tw-pr-4 tw-bg-[#1C1D20] tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              htmlFor="floating_description"
              className="tw-absolute tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0]  tw-bg-[#1C1D20] tw-px-2 peer-focus:tw-px-2  peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Description
            </label>
          </div>
        </div>
        <div className="tw-pt-6">
          <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
            Signature Type
          </p>
          <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
            <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
              <input
                type="radio"
                className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
              />
              <span className="tw-flex tw-items-center">
                <span className="tw-flex tw-flex-col tw-text-sm">
                  <span className="tw-font-semibold tw-text-iron-300">
                    None
                  </span>
                </span>
              </span>
            </div>
            <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
              <input
                type="radio"
                className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
              />
              <span className="tw-flex tw-items-center">
                <span className="tw-flex tw-flex-col tw-text-sm">
                  <span className="tw-font-semibold tw-text-iron-300">
                    Drops only
                  </span>
                </span>
              </span>
            </div>
            <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
              <input
                type="radio"
                className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
              />
              <span className="tw-flex tw-items-center">
                <span className="tw-flex tw-flex-col tw-text-sm">
                  <span className="tw-font-semibold tw-text-iron-300">
                    Ratings only
                  </span>
                </span>
              </span>
            </div>
            <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
              <input
                type="radio"
                className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
              />
              <span className="tw-flex tw-items-center">
                <span className="tw-flex tw-flex-col tw-text-sm">
                  <span className="tw-font-semibold tw-text-iron-300">
                    Drops and Ratings
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="tw-pt-6 tw-text-right">
          <button
            type="button"
            className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            <span>Next step</span>
          </button>
        </div>
      </div>
    </div>
  );
}
