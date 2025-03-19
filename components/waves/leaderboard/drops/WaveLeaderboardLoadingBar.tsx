import React from "react";

export const WaveLeaderboardLoadingBar: React.FC = () => {
  return (
    <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
      <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
    </div>
  );
};