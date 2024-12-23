import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { WaveWinnersDropHeader } from "./header/WaveWinnersDropHeader";
import { WaveWinnersDropContent } from "./WaveWinnersDropContent";
import WaveWinnersDropOutcome from "./header/WaveWinnersDropOutcome";
import { ApiWave } from "../../../../../generated/models/ApiWave";

interface WaveWinnersDropProps {
  readonly drop: ExtendedDrop & { wave: ApiWave };
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const getColorClasses = (rank: number | null) => {
  const rankStyles = {
    1: {
      base: "tw-border tw-border-solid tw-border-amber-400/10 tw-bg-[linear-gradient(180deg,rgba(31,31,37,0.98)_0%,rgba(51,46,41,0.95)_100%)] tw-shadow-[inset_0_0_16px_rgba(251,191,36,0.01)]",
      hover:
        "desktop-hover:hover:tw-shadow-[inset_0_0_20px_rgba(251,191,36,0.02)] desktop-hover:hover:tw-border-amber-400/15 desktop-hover:hover:tw-bg-[linear-gradient(180deg,rgba(35,35,41,0.98)_0%,rgba(56,51,46,0.95)_100%)]",
    },
    2: {
      base: "tw-border tw-border-solid tw-border-slate-400/10 tw-bg-[linear-gradient(180deg,rgba(31,31,37,0.98)_0%,rgba(46,46,51,0.95)_100%)] tw-shadow-[inset_0_0_16px_rgba(226,232,240,0.01)]",
      hover:
        "desktop-hover:hover:tw-shadow-[inset_0_0_20px_rgba(226,232,240,0.02)] desktop-hover:hover:tw-border-slate-400/15 desktop-hover:hover:tw-bg-[linear-gradient(180deg,rgba(35,35,41,0.98)_0%,rgba(51,51,56,0.95)_100%)]",
    },
    3: {
      base: "tw-border tw-border-solid tw-border-[#CD7F32]/10 tw-bg-[linear-gradient(180deg,rgba(31,31,37,0.98)_0%,rgba(46,41,36,0.95)_100%)] tw-shadow-[inset_0_0_16px_rgba(205,127,50,0.01)]",
      hover:
        "desktop-hover:hover:tw-shadow-[inset_0_0_20px_rgba(205,127,50,0.02)] desktop-hover:hover:tw-border-[#CD7F32]/15 desktop-hover:hover:tw-bg-[linear-gradient(180deg,rgba(35,35,41,0.98)_0%,rgba(51,46,41,0.95)_100%)]",
    },
    default: {
      base: "tw-border tw-border-solid tw-border-iron-600/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.95)_0%,rgba(35,35,40,0.98)_100%)] tw-shadow-[inset_0_0_16px_rgba(255,255,255,0.03)]",
      hover:
        "desktop-hover:hover:tw-shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] desktop-hover:hover:tw-border-iron-500/40",
    },
  };

  const style =
    rankStyles[rank as keyof typeof rankStyles] ?? rankStyles.default;
  return `${style.base} ${style.hover}`;
};

export const WaveWinnersDrop: React.FC<WaveWinnersDropProps> = ({
  drop,
  onDropClick,
}) => {
  const colorClasses = getColorClasses(drop.rank);

  return (
    <div
      onClick={() => onDropClick(drop)}
      role="button"
      className={`tw-cursor-pointer tw-relative tw-w-full tw-rounded-xl tw-py-5 tw-px-4 ${colorClasses} tw-overflow-hidden tw-backdrop-blur-sm
        tw-transition-all tw-duration-300 tw-ease-out
        tw-shadow-lg tw-shadow-black/5
        desktop-hover:hover:tw-shadow-xl desktop-hover:hover:tw-shadow-black/10
        tw-group`}
    >
      <div>
        <div className="tw-flex tw-flex-col">
          <WaveWinnersDropHeader drop={drop} />
          <WaveWinnersDropContent drop={drop} />
          <div className="tw-ml-auto tw-mt-2">
            <WaveWinnersDropOutcome drop={drop} wave={drop.wave} />
          </div>
        </div>
      </div>
    </div>
  );
};
