import { Wave } from "../../../../generated/models/Wave";
import { WaveType } from "../../../../generated/models/WaveType";
import WaveLeaderboardApprove from "./WaveLeaderboardApprove";
import WaveLeaderboardRank from "./WaveLeaderboardRank";

export default function WaveLeaderboard({ wave }: { readonly wave: Wave }) {
  const components: Record<WaveType, JSX.Element> = {
    [WaveType.Chat]: <WaveLeaderboardRank />,
    [WaveType.Rank]: <WaveLeaderboardRank />,
    [WaveType.Approve]: <WaveLeaderboardApprove />,
  };
  return (
    <div className="tw-w-full">
      <div className="tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
        <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-800">
          <div className="tw-px-4 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
            <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
              Leaderboard
            </p>
          </div>
          {components[wave.wave.type]}
        </div>
      </div>
    </div>
  );
}
