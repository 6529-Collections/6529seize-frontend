import WavesOutcome6529ActionsOptions from "./WavesOutcome6529ActionsOptions";
import WavesOutcomeAppsOptions from "./WavesOutcomeAppsOptions";
import WavesOutcomeGeneralDataOptions from "./WavesOutcomeGeneralDataOptions";
import WavesOutcomeManualOptions from "./WavesOutcomeManualOptions";
import WavesOutcomeOnChainOptions from "./WavesOutcomeOnChainOptions";
import WavesOutcomeSocialMediaOptions from "./WavesOutcomeSocialMediaOptions";
import WavesOutcomeTabs from "./WavesOutcomeTabs";

export default function WavesOutcome() {
  return (
    <div className="tw-max-w-[40rem] tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
        Actions
      </p>
      <div className="tw-mt-5">
        <WavesOutcomeTabs />
      </div>
      <div className="tw-mt-6">
        <WavesOutcomeManualOptions />
        {/*  <WavesOutcome6529ActionsOptions /> */}
        {/*  <WavesOutcomeSocialMediaOptions />  */}
        {/*  <WavesOutcomeOnChainOptions />  */}
        {/*  <WavesOutcomeGeneralDataOptions /> */}
        {/* <WavesOutcomeAppsOptions /> */}
      </div>
      <div className="tw-mt-6 tw-text-right">
        <button
          type="button"
          className="tw-w-full sm:tw-w-auto tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div>
    </div>
  );
}
