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

  const isPositive = Number(typeof voteValue === 'string' ? 0 : voteValue) >= 0;
  const colorClasses = isPositive
    ? "tw-bg-gradient-to-r tw-from-emerald-600/90 tw-via-emerald-500 tw-to-emerald-400/90 tw-shadow-[0_0_15px_rgba(16,185,129,0.15)]"
    : "tw-bg-gradient-to-r tw-from-rose-600/90 tw-via-rose-500 tw-to-rose-400/90 tw-shadow-[0_0_15px_rgba(225,29,72,0.15)]";

  const valueColorClasses = isPositive
    ? "tw-text-emerald-400"
    : "tw-text-rose-400";

  const thumbBorderColor = isPositive ? "tw-border-emerald-500" : "tw-border-rose-500";
  const thumbGlowColor = isPositive 
    ? "after:tw-shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
    : "after:tw-shadow-[0_0_12px_rgba(225,29,72,0.4)]";

  return (
    <div className="tw-flex tw-items-center tw-gap-4 tw-h-9">
      <div className="tw-relative tw-flex-1">
        <div className="tw-relative tw-h-2 tw-group tw-mt-1">
          {/* Track background with subtle pattern */}
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-r tw-from-gray-800 tw-via-gray-700 tw-to-gray-800 tw-rounded-full tw-z-0 tw-transition-all tw-duration-200 group-hover:tw-from-gray-700 group-hover:tw-via-gray-600 group-hover:tw-to-gray-700" />
          
          {/* Progress bar with glow effect */}
          <div 
            className={`tw-absolute tw-h-full ${colorClasses} tw-rounded-full tw-z-10 tw-transition-all tw-duration-200 tw-ease-out`}
            style={progressBarStyle}
          />

          {/* Zero marker */}
          <div 
            className="tw-absolute tw-h-3 tw-w-0.5 tw-bg-iron-400/30 tw-rounded-full tw-z-5 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-transition-all tw-duration-200 group-hover:tw-bg-iron-400/40"
            style={{ left: `${zeroPercentage}%` }}
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

          {/* Thumb with tooltip */}
          <div 
            className={`tw-absolute tw-h-4 tw-pointer-events-none tw-z-20 tw-top-1/2 tw-transform tw--translate-y-1/2
              tw-transition-all tw-duration-200 tw-ease-out ${isDragging ? 'tw-scale-110' : ''}`}
            style={{ left: `${currentPercentage}%` }}
          >
            <div className="tw-relative">
              {/* Tooltip */}
              <div className={`tw-absolute tw-bottom-6 tw-left-0 tw-transform -tw-translate-x-[calc(50%+2.5px)]
                tw-bg-gradient-to-b tw-from-gray-800 tw-to-gray-700 tw-rounded-lg 
                tw-py-1.5 tw-px-3 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-min-w-[120px] tw-text-center
                tw-shadow-lg tw-border tw-border-gray-600/20
                tw-transition-all tw-duration-200 ${valueColorClasses}`}>
                <span className="tw-block">{formatNumberWithCommas(typeof voteValue === 'string' ? 0 : voteValue)} TDH</span>
                <div className={`tw-absolute tw-w-2 tw-h-2 tw-bottom-[-4px] tw-left-[calc(50%-1px)]
                  tw-rotate-45 tw-bg-gray-700 tw-border-r tw-border-b tw-border-gray-600/20`} />
              </div>

              {/* Thumb with glow effect */}
              <div className={`tw-relative tw-w-5 tw-h-5 tw-rounded-full 
                tw-bg-gradient-to-b tw-from-gray-700 tw-to-gray-800
                tw-border-2 ${thumbBorderColor} 
                tw-shadow-lg tw--translate-x-1/2 
                tw-transition-all tw-duration-200
                after:tw-content-[''] after:tw-absolute after:tw-inset-0 
                after:tw-rounded-full after:tw-transition-all after:tw-duration-200
                ${thumbGlowColor}
                group-hover:tw-shadow-xl group-hover:tw-from-gray-600 group-hover:tw-to-gray-700
                ${isDragging ? 'tw-scale-110' : ''}`} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
