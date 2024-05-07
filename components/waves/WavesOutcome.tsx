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
        {/*  <WavesOutcomeManualOptions /> */}
        {/* <WavesOutcome6529ActionsOptions /> */}
        {/*  <WavesOutcomeSocialMediaOptions />  */}
       {/*  <WavesOutcomeOnChainOptions /> */}
       {/*  <WavesOutcomeGeneralDataOptions /> */}
        <WavesOutcomeAppsOptions /> 
      </div>
    </div>
  );
}
