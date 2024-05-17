import WavesDrops from "./WavesDrops";
import WavesMainSteps from "./WavesMainSteps";
import WavesOverview from "./WavesOverview";
import WavesRating from "./WavesRating";
import WavesVisibility from "./WavesVisibility";
import WavesPeriod from "./WavesPeriod";
import WavesOutcome from "./WavesOutcome";

export default function Waves() {
  return (
    <div className="tailwind-scope">
      <div className="lg:tw-grid lg:tw-grid-cols-12 lg:tw-min-h-screen tw-w-full">
        <WavesMainSteps />
        <div className="tw-relative tw-bg-iron-900 
        tw-bg-[radial-gradient(169.40%_89.55%_at_94.76%_6.29%,rgba(0,0,0,0.40)_0%,rgba(255,255,255,0.00)_100%)] tw-w-full tw-h-full lg:tw-rounded-l-[40px] tw-px-8 tw-pt-12 tw-pb-12 lg:tw-pb-0 lg:tw-col-span-9">
          <WavesOverview />
          {/* <WavesVisibility /> */}
          {/*  <WavesDrops /> */}
          {/* <WavesRating />  */}
          {/*  <WavesPeriod /> */}
          {/* <WavesOutcome /> */}
        </div>
      </div>
    </div>
  );
}
