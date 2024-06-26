import WavesOutcomeTypes from "./WavesOutcomeTypes";
import WavesOutcomeManual from "./create-wave/overview/WavesOutcomeManual";
import WavesOutcomeRep from "./create-wave/overview/WavesOutcomeRep";
import WavesOutcomeCIC from "./create-wave/overview/WavesOutcomeCIC";
import WavesOutcomeCards from "./create-wave/overview/WavesOutcomeCards";

export default function WavesOutcome() {
  return (
    <div className="tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Choose outcome type
      </p>
      <div className="tw-mt-3 tw-space-y-6">
        
        <WavesOutcomeTypes />

        {/*   <WavesOutcomeManual /> */}

        {/*   <WavesOutcomeRep /> */}

        {/*   <WavesOutcomeCIC /> */}

        <WavesOutcomeCards />
        
      </div>
    </div>
  );
}
