import WavesCreditTypeRep from "./WavesCreditTypeRep";

export default function WavesCreditType() {
  return (
    <div>
      <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
        How can they rate
      </p>
      <div className="tw-mt-5 tw-grid tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400 tw-bg-primary-400/10 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out">
          <input
            type="radio"
            checked
            className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-500 focus:tw-ring-primary-500 tw-cursor-pointer"
          />
          <span className="tw-flex tw-items-center">
            <span className="tw-flex tw-flex-col tw-text-sm">
              <span className="tw-font-bold tw-text-primary-400">TDH</span>
            </span>
          </span>
        </div>
        <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out">
          <input
            type="radio"
            className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
          />
          <span className="tw-flex tw-items-center">
            <span className="tw-flex tw-flex-col tw-text-sm">
              <span className="tw-font-semibold tw-text-iron-300">Rep</span>
            </span>
          </span>
        </div>
        <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out">
          <input
            type="radio"
            className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
          />
          <span className="tw-flex tw-items-center">
            <span className="tw-flex tw-flex-col tw-text-sm">
              <span className="tw-font-semibold tw-text-iron-300">Unique</span>
            </span>
          </span>
        </div>
        {/* <div className="tw-col-span-full">
          <WavesCreditTypeRep />
        </div>  */}
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
