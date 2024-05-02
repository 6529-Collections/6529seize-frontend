import WavesRatingTypeThresholdTopInput from "./WavesRatingTypeThresholdTopInput";

export default function WavesRatingType() {
  return (
    <div>
      <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
        Ratingtype
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
                Threshold Top
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
              <span className="tw-font-semibold tw-text-iron-300">Chat</span>
            </span>
          </span>
        </div>
        {/*  <div className="tw-col-span-full">
          <WavesRatingTypeThresholdTopInput />
        </div> */}
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
