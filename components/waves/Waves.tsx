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
      <div className="tw-grid tw-grid-cols-12 tw-min-h-screen tw-w-full">
        <WavesMainSteps />
        <div className="tw-relative tw-bg-[#1C1D20] tw-w-full tw-rounded-l-[40px] tw-p-8 tw-col-span-9">
          {/*    <WavesOverview /> */}
          {/*   <WavesVisibility /> */}
          {/*  <WavesDrops /> */}
          {/*  <WavesRating /> */}
          {/*  <WavesPeriod /> */}
          <WavesOutcome />
        </div>
      </div>
    </div>
  );
}
