import { Wave } from "../../../generated/models/Wave";
import DropsListItem from "../../drops/view/item/DropsListItem";
import WaveCreateDrop from "./drop/WaveCreateDrop";
import WaveDescriptionDrop from "./drops/WaveDescriptionDrop";
import WaveDrops from "./drops/WaveDrops";
import WaveHeader from "./header/WaveHeader";
import WaveLeaderboard from "./leaderboard/WaveLeaderboard";
import WaveOutcome from "./outcome/WaveOutcome";
import WaveSpecs from "./specs/WaveSpecs";

export default function WaveDetailed({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen">
      <WaveHeader wave={wave} />
      <div className="tw-mt-12 tw-pb-16 lg:tw-pb-20 tw-max-w-5xl tw-mx-auto">
        <div className="tw-flex tw-justify-center tw-gap-x-6">
          <div className="tw-flex-1 tw-flex tw-flex-col tw-gap-y-6">
            <WaveSpecs wave={wave} />
            <WaveLeaderboard wave={wave} />
            <WaveOutcome />
          </div>
          <div className="tw-w-[672px] tw-space-y-4">
            <WaveCreateDrop wave={wave} />
            <WaveDescriptionDrop wave={wave} />
            <WaveDrops wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
}
