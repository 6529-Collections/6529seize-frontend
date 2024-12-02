import React, { useState, useEffect } from "react";
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
  const [snapTimeout, setSnapTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const memeticValues: number[] = [
    -69420, -42069, -6529, -420, -69, 69, 420, 6529, 42069, 69420,
  ];

  const handleSliderChange = (newValue: number) => {
    if (isDragging) {
      const snapThreshold = 100;
      const nearestMemetic = memeticValues.find(meme => 
        Math.abs(meme - newValue) < snapThreshold && 
        meme >= minValue && 
        meme <= maxValue
      );

      if (nearestMemetic) {
        setVoteValue(nearestMemetic);
        
        if (snapTimeout) {
          clearTimeout(snapTimeout);
        }
        
        const timeout = setTimeout(() => {
          setVoteValue(newValue);
        }, 150);
        
        setSnapTimeout(timeout);
      } else {
        setVoteValue(newValue);
      }
    } else {
      setVoteValue(newValue);
    }
  };

  useEffect(() => {
    return () => {
      if (snapTimeout) {
        clearTimeout(snapTimeout);
      }
    };
  }, [snapTimeout]);

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
            onChange={(e) => handleSliderChange(Number(e.target.value))}
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
            <div className="tw-relative">
              <div className={`tw-absolute tw-bottom-6 tw-left-0 tw-transform -tw-translate-x-[calc(50%+2.5px)]
                tw-bg-gray-700 tw-rounded-md tw-py-1 tw-px-3 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-min-w-[120px] tw-text-center
                tw-transition-all tw-duration-200 ${valueColorClasses}`}>
                <span className="tw-block">{formatNumberWithCommas(typeof voteValue === 'string' ? 0 : voteValue)} TDH</span>
                <div className={`tw-absolute tw-w-2 tw-h-2 tw-bottom-[-4px] tw-left-[calc(50%-1px)]
                  tw-rotate-45 tw-bg-gray-700`} />
              </div>
              <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-bg-gray-700 tw-border-2 ${thumbBorderColor} 
                tw-shadow-lg tw--translate-x-1/2 tw-transition-all tw-duration-200
                group-hover:tw-shadow-xl group-hover:tw-bg-gray-600`} 
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
