import { Wave } from "../../../generated/models/Wave";
import WaveCreateDrop from "./drop/WaveCreateDrop";
import WaveDescriptionDrop from "./drops/WaveDescriptionDrop";
import WaveDrops from "./drops/WaveDrops";
import WaveHeader from "./header/WaveHeader";
import WaveLeaderboard from "./leaderboard/WaveLeaderboard";
import WaveOutcomes from "./outcome/WaveOutcomes";
import WaveSpecs from "./specs/WaveSpecs";
import WaveGroups from "./groups/WaveGroups";

export default function WaveDetailed({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen">
      <WaveHeader wave={wave} />
      <div className="tw-mt-6 md:tw-mt-12 tw-pb-16 lg:tw-pb-20 tw-max-w-5xl tw-mx-auto sm:tw-px-6 md:tw-px-0">
        <div className="tw-flex tw-items-start tw-justify-center tw-gap-x-6">
          <div className="tw-hidden tw-flex-1 lg:tw-flex tw-flex-col tw-gap-y-6">
            <WaveSpecs wave={wave} />
            <WaveGroups wave={wave} />
            {false && (
              <>
                <WaveLeaderboard wave={wave} />
                <WaveOutcomes wave={wave} />{" "}
              </>
            )}
          </div>
          <div className="tw-w-[672px] tw-rounded-xl tw-overflow-hidden">
            <WaveCreateDrop wave={wave} />
            <WaveDescriptionDrop wave={wave} />
            <WaveDrops wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
}
