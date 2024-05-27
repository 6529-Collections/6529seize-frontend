import WavesDrops from "./WavesDrops";
import WavesMainSteps from "./WavesMainSteps";
import WavesOverview from "./WavesOverview";
import WavesRating from "./WavesRating";
import WavesGroups from "./WavesGroups";
import WavesDates from "./WavesDates";
import WavesOutcome from "./WavesOutcome";

export default function Waves() {
  return (
    <div className="tailwind-scope">
      <div className="lg:tw-grid lg:tw-grid-cols-12 lg:tw-min-h-screen tw-w-full">
        <WavesMainSteps />
        <div className="tw-relative tw-bg-iron-900 tw-w-full tw-h-full lg:tw-rounded-l-[40px] tw-px-8 tw-pt-12 tw-pb-12 lg:tw-pb-0 lg:tw-col-span-9">
          {/* <WavesOverview />  */}
          {/*  <WavesGroups /> */}
          {/*  <WavesDates /> */}
          <WavesDrops />
          {/*   <WavesRating />  */}
          {/* <WavesOutcome /> */}
        </div>
      </div>
    </div>
  );
}
