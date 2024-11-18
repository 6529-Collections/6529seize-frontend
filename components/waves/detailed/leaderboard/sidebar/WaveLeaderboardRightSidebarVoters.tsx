import React from "react";

interface WaveLeaderboardRightSidebarVotersProps {
}

export const WaveLeaderboardRightSidebarVoters: React.FC<WaveLeaderboardRightSidebarVotersProps> = () => {
  return (
    <div className="tw-space-y-2">
    {[1, 2, 3].map((index) => (
      <div
        key={index}
        className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200"
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-text-iron-400 tw-font-medium">
            {index}.
          </span>
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <img
              src=""
              alt=""
              className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-white/10 tw-bg-iron-800"
            />
            <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
              Username
            </span>
          </div>
        </div>
        <span>
          <span className="tw-text-iron-400">123 </span>{" "}
          <span className="tw-text-xs tw-text-iron-400">
            TDH total
          </span>
        </span>
      </div>
    ))}
  </div>
  );
};
