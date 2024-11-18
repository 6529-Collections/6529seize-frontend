import React from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";

interface WaveLeaderboardRightSidebarActivityLogProps {
  readonly wave: ApiWave;
}

export const WaveLeaderboardRightSidebarActivityLog: React.FC<WaveLeaderboardRightSidebarActivityLogProps> = ({
  wave,
}) => {
  return (
    <div className="tw-space-y-3">
    <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          Just now
        </span>
        <span className="tw-size-1 tw-rounded-full tw-bg-iron-700"></span>
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          250 TDH
        </span>
      </div>
      <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
        <div className="tw-flex tw-items-center tw-gap-2">
          <img
            src="https://placehold.co/32x32/374151/FFF"
            alt=""
            className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
          />
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            AlexWeb3
          </span>
        </div>
        <span className="tw-text-sm tw-text-iron-400">voted</span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <img
            src="https://placehold.co/32x32/1F2937/FFF"
            alt=""
            className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
          />
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            CryptoKing
          </span>
        </div>
      </div>
    </div>
    <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          5m ago
        </span>
        <span className="tw-size-1 tw-rounded-full tw-bg-iron-700"></span>
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          175 TDH
        </span>
      </div>
      <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
        <div className="tw-flex tw-items-center tw-gap-2">
          <img
            src="https://placehold.co/32x32/4B5563/FFF"
            alt=""
            className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
          />
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            MetaMaster
          </span>
        </div>
        <span className="tw-text-sm tw-text-iron-400">voted</span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <img
            src="https://placehold.co/32x32/6B7280/FFF"
            alt=""
            className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
          />
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            BlockBuilder
          </span>
        </div>
      </div>
    </div>
    <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          15m ago
        </span>
        <span className="tw-size-1 tw-rounded-full tw-bg-iron-700"></span>
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          325 TDH
        </span>
      </div>
      <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
        <div className="tw-flex tw-items-center tw-gap-2">
          <img
            src="https://placehold.co/32x32/9CA3AF/FFF"
            alt=""
            className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
          />
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            ChainChamp
          </span>
        </div>
        <span className="tw-text-sm tw-text-iron-400">voted</span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <img
            src="https://placehold.co/32x32/D1D5DB/FFF"
            alt=""
            className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
          />
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            TokenWhiz
          </span>
        </div>
      </div>
    </div>
  </div>
  );
};
