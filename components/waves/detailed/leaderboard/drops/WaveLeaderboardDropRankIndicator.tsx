import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";

interface WaveLeaderboardDropRankIndicatorProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropRankIndicator: React.FC<
  WaveLeaderboardDropRankIndicatorProps
> = ({ drop }) => {
  if (drop.rank && drop.rank <= 3) {
    const rankStyles: {
      [key: number]: { container: string; rankColor: string };
    } = {
      1: {
        container: "tw-from-[#E8D48A]/30 tw-ring-[#E8D48A]/30",
        rankColor: "tw-text-[#E8D48A]",
      },
      2: {
        container: "tw-from-[#dddddd]/20 tw-ring-[#dddddd]/30",
        rankColor: "tw-text-[#dddddd]",
      },
      3: {
        container: "tw-from-[#CD7F32]/20 tw-ring-[#CD7F32]/30",
        rankColor: "tw-text-[#CD7F32]",
      },
    };

    const defaultContainerStyles =
      "tw-rounded-xl tw-bg-gradient-to-b tw-size-10 tw-flex tw-items-center tw-justify-center tw-shadow-lg tw-ring-1 tw-to-iron-900";

    const containerStyles = `${defaultContainerStyles} ${
      drop.rank ? rankStyles[drop.rank].container : ""
    }`;

    const rankColor = drop.rank ? rankStyles[drop.rank].rankColor : "";

    const positionLabels: Record<number, string> = {
      1: "1st",
      2: "2nd",
      3: "3rd",
    };

    const positionLabel = drop.rank ? positionLabels[drop.rank] : "";
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-w-12">
        <div className={containerStyles}>
          <svg
            className={`tw-size-5 ${rankColor}`}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
          >
            <path
              fill="currentColor"
              d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
            />
          </svg>
        </div>
        <span className={`tw-font-semibold tw-text-sm ${rankColor}`}>
          {positionLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-w-12">
      <div className="tw-size-8 tw-rounded-lg tw-bg-iron-800/80 tw-flex tw-items-center tw-justify-center tw-ring-1 tw-ring-iron-700/50">
        <span className="tw-text-base tw-font-semibold tw-text-iron-300">
          {drop.rank}
        </span>
      </div>
    </div>
  );
};
