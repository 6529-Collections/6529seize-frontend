import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";

interface WaveLeaderboardDropRankIndicatorProps {
  readonly drop: ExtendedDrop;
}

const TrophyIcon = ({ color }: { color: string }) => (
  <svg
    className="tw-size-3.5 tw-flex-shrink-0"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 576 512"
  >
    <path
      fill={color}
      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
    />
  </svg>
);

export const WaveLeaderboardDropRankIndicator: React.FC<
  WaveLeaderboardDropRankIndicatorProps
> = ({ drop }) => {
  if (!drop.rank) {
    return (
      <div className="tw-font-medium tw-text-xs md:tw-text-sm tw-text-iron-400 tw-flex tw-items-center tw-h-6 tw-min-w-6 tw-rounded-lg tw-bg-gradient-to-br tw-from-iron-700/90 tw-to-iron-800 tw-justify-center tw-ring-1 tw-ring-iron-600/50 tw-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          className="tw-size-3 tw-flex-shrink-0"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </div>
    );
  }

  if (drop.rank === 1) {
    return (
      <div className="tw-shadow-[0_4px_12px_rgba(232,212,138,0.2)] tw-ring-1 tw-bg-[#E8D48A]/10 tw-ring-[#E8D48A]/40 tw-rounded-lg tw-h-7 tw-px-2.5 tw-text-[#E8D48A] tw-font-medium tw-text-xs md:tw-text-sm tw-flex tw-items-center tw-gap-x-1.5 hover:tw-from-[#E8D48A]/40 hover:tw-ring-[#E8D48A]/50 tw-transition-all tw-duration-300">
        <TrophyIcon color="#E8D48A" />
        <span className="tw-drop-shadow-[0_2px_3px_rgba(232,212,138,0.4)]">
          #{drop.rank}
        </span>
      </div>
    );
  }

  if (drop.rank === 2) {
    return (
      <div className="tw-shadow-[0_4px_12px_rgba(221,221,221,0.15)] tw-ring-1 tw-bg-[#dddddd]/10 tw-ring-[#dddddd]/40 tw-rounded-lg tw-h-7 tw-px-2.5 tw-text-[#DDDDDD] tw-font-medium tw-text-xs md:tw-text-sm tw-flex tw-items-center tw-gap-x-1.5 hover:tw-from-[#dddddd]/35 hover:tw-ring-[#dddddd]/50 tw-transition-all tw-duration-300">
        <TrophyIcon color="#DDDDDD" />
        <span className="tw-drop-shadow-[0_2px_3px_rgba(221,221,221,0.4)]">
          #{drop.rank}
        </span>
      </div>
    );
  }

  if (drop.rank === 3) {
    return (
      <div className="tw-shadow-[0_4px_12px_rgba(205,127,50,0.15)] tw-ring-1 tw-bg-[#B87333]/10 tw-ring-[#CD7F32]/40 tw-rounded-lg tw-h-7 tw-px-2.5 tw-text-[#CD7F32] tw-font-medium tw-text-xs md:tw-text-sm tw-flex tw-items-center tw-gap-x-1.5 hover:tw-from-[#CD7F32]/35 hover:tw-ring-[#CD7F32]/50 tw-transition-all tw-duration-300">
        <TrophyIcon color="#CD7F32" />
        <span className="tw-drop-shadow-[0_2px_3px_rgba(205,127,50,0.4)]">
          #{drop.rank}
        </span>
      </div>
    );
  }

  return (
    <div className="tw-font-medium tw-text-xs md:tw-text-sm tw-text-iron-300 tw-flex tw-items-center tw-h-7 tw-min-w-7 tw-rounded-lg tw-bg-iron-800 tw-justify-center tw-ring-1 tw-ring-iron-600/50 tw-shadow-[0_2px_4px_rgba(0,0,0,0.2)] tw-transition-all tw-duration-300">
      <span className="tw-px-2">#{drop.rank}</span>
    </div>
  );
};
