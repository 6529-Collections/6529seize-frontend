import React, { useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

interface WaveDropVoteSliderProps {
  readonly voteValue: number | string;
  readonly currentVoteValue: number;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly availableCredit: number;
}

export const WaveDropVoteSlider: React.FC<WaveDropVoteSliderProps> = ({
  voteValue,
  setVoteValue,
  currentVoteValue,
  availableCredit,
}) => {
  const minValue = currentVoteValue - availableCredit;
  const maxValue = currentVoteValue + availableCredit;
  
  const [isDragging, setIsDragging] = useState(false);

  const zeroPercentage = ((0 - minValue) / (maxValue - minValue)) * 100;
  const currentPercentage = ((Number(typeof voteValue === 'string' ? 0 : voteValue) - minValue) / (maxValue - minValue)) * 100;
  
  const progressBarStyle = Number(typeof voteValue === 'string' ? 0 : voteValue) >= 0 
    ? {
        left: `${zeroPercentage}%`,
        width: `${currentPercentage - zeroPercentage}%`
      }
    : {
        left: `${currentPercentage}%`,
        width: `${zeroPercentage - currentPercentage}%`
      };

  const colorClasses = Number(typeof voteValue === 'string' ? 0 : voteValue) >= 0
    ? "tw-bg-gradient-to-r tw-from-emerald-600 tw-to-emerald-500"
    : "tw-bg-gradient-to-r tw-from-rose-600 tw-to-rose-500";

  const valueColorClasses = Number(typeof voteValue === 'string' ? 0 : voteValue) >= 0
    ? "tw-text-emerald-400"
    : "tw-text-rose-400";

  const thumbBorderColor = Number(typeof voteValue === 'string' ? 0 : voteValue) >= 0 ? "tw-border-emerald-600" : "tw-border-rose-600";

  return (
    <div className="tw-flex tw-items-center tw-gap-4 tw-h-9">
      <div className="tw-relative tw-flex-1">
        <div className="tw-relative tw-h-1.5 tw-group tw-mt-1">
          <div className="tw-absolute tw-inset-0 tw-bg-gray-600 tw-rounded-full tw-z-0 tw-transition-all tw-duration-200 group-hover:tw-bg-gray-500" />
          <div 
            className={`tw-absolute tw-h-full ${colorClasses} tw-rounded-full tw-z-10 tw-transition-all tw-duration-200 tw-ease-out`}
            style={progressBarStyle}
          />
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={typeof voteValue === 'string' ? 0 : voteValue}
            onChange={(e) => setVoteValue(Number(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-appearance-none tw-cursor-pointer tw-opacity-0 tw-z-30"
          />
          <div 
            className={`tw-absolute tw-h-4 tw-pointer-events-none tw-z-20 tw-top-1/2 tw-transform tw--translate-y-1/2
              tw-transition-all tw-duration-200 tw-ease-out ${isDragging ? 'tw-scale-110' : ''}`}
            style={{ left: `${currentPercentage}%` }}
          >
            <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-bg-gray-700 tw-border-2 ${thumbBorderColor} 
              tw-shadow-lg tw--translate-x-1/2 tw-transition-all tw-duration-200
              group-hover:tw-shadow-xl group-hover:tw-bg-gray-600`} 
            />
          </div>
        </div>
      </div>

      <div className={`tw-w-32 tw-text-right tw-font-medium ${valueColorClasses} tw-transition-all tw-duration-150 
        tw-whitespace-nowrap tw-overflow-hidden tw-text-ellipsis ${isDragging ? 'tw-scale-105' : ''}`}>
        {formatNumberWithCommas(typeof voteValue === 'string' ? 0 : voteValue)} TDH
      </div>
    </div>
  );
};
