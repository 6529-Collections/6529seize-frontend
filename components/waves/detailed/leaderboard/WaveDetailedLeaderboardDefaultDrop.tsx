import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";

interface WaveDetailedLeaderboardDefaultDropProps {
  readonly drop: ExtendedDrop;
}

export const WaveDetailedLeaderboardDefaultDrop: React.FC<
  WaveDetailedLeaderboardDefaultDropProps
> = ({ drop }) => {
  return (
    <li className="tw-flex tw-items-center tw-justify-between tw-px-3">
      <div className="tw-flex tw-gap-x-3">
        <div className="tw-text-iron-500 tw-font-semibold tw-w-4 tw-flex tw-justify-center">
          4
        </div>
        <div className="tw-flex tw-flex-col">
          <div className="tw-text-iron-50 tw-font-normal tw-mb-1 tw-line-clamp-3">
            Web3 will revolutionize...
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <img
              className="tw-size-5 tw-rounded-md tw-bg-iron-800"
              src="#"
              alt=""
            />
            <span className="tw-inline-flex tw-items-center tw-gap-x-2">
              <span className="tw-text-iron-50 tw-text-xs tw-font-semibold">
                Web3Wizard
              </span>
              <span className="tw-flex-shrink-0 tw-block tw-rounded-full tw-h-1.5 tw-w-1.5 tw-bg-[#3CCB7F]"></span>
            </span>
            <div className="tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-rounded-full tw-bg-iron-800/50">
              150 Rep
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
