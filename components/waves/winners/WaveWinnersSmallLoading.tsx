import React from "react";

export const WaveWinnersSmallLoading: React.FC = () => {
  return (
    <div className="tw-p-3">
      <div className="tw-animate-pulse tw-space-y-4">
        <div className="tw-h-6 tw-bg-iron-800 tw-rounded-md tw-w-1/3"></div>
        <div className="tw-space-y-3">
          <div className="tw-h-24 tw-bg-iron-800 tw-rounded-xl"></div>
          <div className="tw-h-24 tw-bg-iron-800 tw-rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};