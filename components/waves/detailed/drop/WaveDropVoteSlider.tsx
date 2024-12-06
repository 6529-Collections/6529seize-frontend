import React, { useState, useEffect, useRef } from "react";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { SliderTheme, SLIDER_THEMES } from "./types/slider.types";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface WaveDropVoteSliderProps {
  readonly voteValue: number | string;
  readonly currentVoteValue: number;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly availableCredit: number;
  readonly rank?: number | null;
}

export default function WaveDropVoteSlider({
  voteValue,
  setVoteValue,
  currentVoteValue,
  availableCredit,
  rank = null,
}: WaveDropVoteSliderProps) {
  const minValue = currentVoteValue - availableCredit;
  const maxValue = currentVoteValue + availableCredit;
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getTheme = (rank: number | null): SliderTheme => {
    if (rank === 1 || rank === 2 || rank === 3) {
      return SLIDER_THEMES[rank];
    }
    return SLIDER_THEMES.default;
  };

  const theme = getTheme(rank);

  const handleSliderChange = (newValue: number) => {
    setVoteValue(newValue);
  };

  const zeroPercentage = ((0 - minValue) / (maxValue - minValue)) * 100;
  const currentPercentage =
    ((Number(typeof voteValue === "string" ? 0 : voteValue) - minValue) /
      (maxValue - minValue)) *
    100;

  const x = useMotionValue(currentPercentage);
  const xSmooth = useSpring(x, { damping: 20, stiffness: 300 });
  const scale = useTransform(xSmooth, [0, 100], [0.95, 1.05]);

  useEffect(() => {
    x.set(currentPercentage);
  }, [currentPercentage]);

  const progressBarStyle =
    Number(typeof voteValue === "string" ? 0 : voteValue) >= 0
      ? {
          left: `${zeroPercentage}%`,
          width: `${currentPercentage - zeroPercentage}%`,
        }
      : {
          left: `${currentPercentage}%`,
          width: `${zeroPercentage - currentPercentage}%`,
        };

  return (
    <div className="tw-h-[20px] tw-flex tw-items-center" onClick={(e) => e.stopPropagation()}>
      <div className="tw-relative tw-flex-1">
        <div className="tw-relative tw-h-[8px] tw-group">
          <motion.div
            className={`tw-absolute tw-inset-0 tw-rounded-full tw-z-0 tw-shadow-inner ${theme.track.background} ${theme.track.hover}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />

          <motion.div
            className={`tw-absolute tw-h-full tw-rounded-full tw-z-10 tw-backdrop-blur-sm ${theme.progress.background} ${theme.progress.glow}`}
            style={progressBarStyle}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />

          <motion.div
            className="tw-absolute tw-h-4 tw-w-0.5 tw-bg-iron-400/30 tw-rounded-full tw-z-5 tw-top-1/2 tw-transform -tw-translate-y-1/2"
            style={{ left: `${zeroPercentage}%` }}
            whileHover={{
              height: "20px",
              backgroundColor: "rgba(168, 168, 179, 0.4)",
            }}
            transition={{ duration: 0.2 }}
          />

          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={typeof voteValue === "string" ? 0 : voteValue}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDragging(true);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              setIsDragging(false);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsDragging(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setIsDragging(false);
            }}
            className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-appearance-none tw-cursor-pointer tw-opacity-0 tw-z-30"
          />

          <motion.div
            ref={thumbRef}
            style={{
              left: `${currentPercentage}%`,
              top: "50%",
              x: "-50%",
              y: "-50%",
              scale: isDragging ? 1.1 : 1,
            }}
            className="tw-absolute tw-z-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            <div className="tw-relative">
              <div
                className={`tw-absolute tw-bottom-6 tw-left-1/2 tw-transform -tw-translate-x-1/2
                  ${theme.tooltip.background} tw-rounded-lg 
                  tw-py-1.5 tw-px-3 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-min-w-[120px] tw-text-center
                  tw-shadow-lg tw-border tw-border-gray-600/20 ${theme.tooltip.text}`}
              >
                <span className="tw-block">
                  {formatNumberWithCommas(
                    typeof voteValue === "string" ? 0 : voteValue
                  )}{" "}
                  TDH
                </span>
                <div
                  className={`tw-absolute tw-w-2 tw-h-2 tw-bottom-[-4px] tw-left-1/2 -tw-translate-x-1/2
                    tw-rotate-45 ${theme.tooltip.background} tw-border-r tw-border-b tw-border-gray-600/20`}
                />
              </div>

              <motion.div
                className={`tw-w-5 tw-h-5 tw-rounded-full 
                  tw-bg-gradient-to-b tw-from-gray-700 tw-to-gray-800
                  tw-border-2 ${theme.thumb.border} 
                  tw-shadow-lg tw-transition-shadow
                  after:tw-content-[''] after:tw-absolute after:tw-inset-0 
                  after:tw-rounded-full after:tw-transition-all after:tw-duration-200
                  ${theme.thumb.glow} ${theme.thumb.hover}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: isDragging ? 1.1 : 1,
                  boxShadow: isDragging
                    ? "0 0 20px rgba(255,255,255,0.2)"
                    : "0 0 0 rgba(255,255,255,0)",
                }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
