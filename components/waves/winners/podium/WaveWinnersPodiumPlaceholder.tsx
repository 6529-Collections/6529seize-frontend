import React from "react";

interface WaveWinnersPodiumPlaceholderProps {
  readonly height: string;
  readonly position: "first" | "second" | "third";
}

export const WaveWinnersPodiumPlaceholder: React.FC<WaveWinnersPodiumPlaceholderProps> = ({
  height,
  position,
}) => {
  const positionColors = {
    first: "tw-border-yellow-900/20",
    second: "tw-border-iron-700/20",
    third: "tw-border-amber-900/20",
  };

  return (
    <div className="tw-relative">
      <div className="tw-absolute tw-left-1/2 -tw-translate-x-1/2 -tw-top-6 tw-z-10">
        <div className="tw-w-12 tw-h-12 tw-rounded-xl tw-bg-iron-900/40 tw-border tw-border-iron-800/20" />
      </div>
      <div
        className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full ${height} tw-bg-iron-950/40 tw-rounded-xl tw-border ${positionColors[position]} tw-backdrop-blur-sm tw-pt-8`}
      >
        <div className="tw-w-24 tw-h-4 tw-mb-2 tw-rounded-lg tw-bg-iron-900/40" />
        <div className="tw-w-20 tw-h-4 tw-mb-2 tw-rounded-lg tw-bg-iron-900/40" />
        <div className="tw-w-16 tw-h-4 tw-rounded-lg tw-bg-iron-900/40" />
      </div>
    </div>
  );
}; 