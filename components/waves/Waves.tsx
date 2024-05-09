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
      <div className="lg:tw-grid lg:tw-grid-cols-12 tw-min-h-screen tw-w-full">
        <WavesMainSteps />
        <div className="tw-relative tw-bg-iron-900 tw-w-full tw-h-full lg:tw-rounded-l-[40px] tw-px-8 tw-pt-12 lg:tw-col-span-9">
         {/*  <WavesOverview /> */}
          <WavesVisibility />
          {/*  <WavesDrops />  */}
          {/*  <WavesRating /> */}
          {/* <WavesPeriod /> */}
          {/* <WavesOutcome /> */}
        </div>
      </div>
    </div>
  );
}
