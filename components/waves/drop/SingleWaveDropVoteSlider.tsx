"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getSliderTheme } from "./types/slider.types";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote";

interface WaveDropVoteSliderProps {
  readonly voteValue: number | string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly rank?: number | null | undefined;
  readonly label: string;
  readonly size?: SingleWaveDropVoteSize | undefined;
}

type ProgressBarStyle = {
  left: string;
  width: string;
};

const getProgressBarStyle = (
  voteValue: number,
  currentPercentage: number,
  zeroPercentage: number
): ProgressBarStyle => {
  if (voteValue >= 0) {
    return {
      left: `${zeroPercentage}%`,
      width: `${currentPercentage - zeroPercentage}%`,
    };
  }

  return {
    left: `${currentPercentage}%`,
    width: `${zeroPercentage - currentPercentage}%`,
  };
};

const transformToLog = (
  value: number,
  minValue: number,
  maxValue: number
): number => {
  const absMin = Math.abs(minValue);
  const absMax = Math.abs(maxValue);
  const maxAbs = Math.max(absMin, absMax);

  if (value === 0) return 0;

  const sign = Math.sign(value);
  const absValue = Math.abs(value);

  const logScale = Math.log10(maxAbs);
  const logValue = Math.log10(absValue) / logScale;

  return sign * logValue * maxAbs;
};

const transformFromLog = (
  value: number,
  minValue: number,
  maxValue: number
): number => {
  const absMin = Math.abs(minValue);
  const absMax = Math.abs(maxValue);
  const maxAbs = Math.max(absMin, absMax);

  if (value === 0) return 0;

  const sign = Math.sign(value);
  const absValue = Math.abs(value);
  const normalizedValue = absValue / maxAbs;

  const logScale = Math.log10(maxAbs);
  const result = sign * Math.pow(10, normalizedValue * logScale);

  return Math.round(result);
};



export default function WaveDropVoteSlider({
  voteValue,
  setVoteValue,
  minValue,
  maxValue,
  rank = null,
  label,
  size = SingleWaveDropVoteSize.NORMAL,
}: WaveDropVoteSliderProps) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isMini = size === SingleWaveDropVoteSize.MINI;
  const hitAreaPadding = isMini ? 16 : 24;
  const thumbHitWidth = isMini ? 72 : 96;
  const thumbHitHeight = isMini ? 48 : 64;
  const theme = getSliderTheme(rank);

  const handleSliderChange = (newValue: number) => {
    const transformedValue = transformFromLog(newValue, minValue, maxValue);
    setVoteValue(transformedValue);
  };

  const numericVoteValue = typeof voteValue === "string" ? 0 : voteValue;
  const logValue = transformToLog(numericVoteValue, minValue, maxValue);

  const isZeroRange = minValue === 0 && maxValue === 0;

  const zeroPercentage = isZeroRange
    ? 50
    : ((0 - minValue) / (maxValue - minValue)) * 100;

  const currentPercentage = isZeroRange && logValue === 0
    ? 50
    : ((logValue - minValue) / (maxValue - minValue)) * 100;

  const x = useMotionValue(currentPercentage);
  const xSmooth = useSpring(x, { damping: 20, stiffness: 300 });
  const scale = useTransform(xSmooth, [0, 100], [0.95, 1.05]);

  useEffect(() => {
    x.set(currentPercentage);
  }, [currentPercentage, x]);

  const progressBarStyle = getProgressBarStyle(
    numericVoteValue,
    currentPercentage,
    zeroPercentage
  );

  return (
    <div
      className={`tw-flex tw-items-center [touch-action:none] ${isMini ? "tw-h-6" : "tw-h-9"
        }`}
      onClick={(e) => e.stopPropagation()}>
      <div className="tw-relative tw-flex-1 tw-overflow-visible">
        <div
          className={`tw-relative tw-h-[6px] tw-group ${isMini ? "tw-mt-3" : "tw-mt-6 sm:tw-mt-0"
            }`}>

          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={logValue}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            onTouchStart={(e) => {
              e.stopPropagation();
              // Force immediate focus to allow dragging without double-tap
              e.currentTarget.focus();
            }}
            className="tw-absolute tw-left-0 tw-right-0 tw-w-full tw-appearance-none tw-cursor-pointer tw-opacity-0 tw-z-10"
            style={{
              top: -hitAreaPadding,
              bottom: -hitAreaPadding,
            }}
          />


          <motion.div
            className={`tw-absolute tw-inset-0 tw-rounded-full tw-z-0 tw-shadow-inner tw-pointer-events-none ${theme.track.background} ${theme.track.hover}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />

          <motion.div
            className={`tw-absolute tw-h-full tw-rounded-full tw-z-10 tw-backdrop-blur-sm tw-pointer-events-none ${theme.progress.background} ${theme.progress.glow}`}
            style={progressBarStyle}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />


          <div
            className="tw-absolute tw-left-0 tw-right-0 tw-z-30"
            style={{
              top: -hitAreaPadding,
              bottom: -hitAreaPadding,
              clipPath: `ellipse(${thumbHitWidth / 2}px ${thumbHitHeight / 2}px at ${currentPercentage}% 50%)`,
            }}>
            <input
              type="range"
              min={minValue}
              max={maxValue}
              value={logValue}
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
                // Force immediate focus to allow dragging without double-tap
                e.currentTarget.focus();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsDragging(false);
              }}
              className="tw-absolute tw-inset-y-0 tw-left-0 tw-right-0 tw-w-full tw-appearance-none tw-cursor-pointer tw-opacity-0"
            />
          </div>


          <motion.div
            ref={thumbRef}
            style={{
              left: `${currentPercentage}%`,
              top: "50%",
              x: "-50%",
              y: "-50%",
              scale: isDragging ? 1.1 : 1,
            }}
            className="tw-absolute tw-z-40 tw-pointer-events-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring" }}>
            <div className="tw-relative">
              <div
                className={`tw-absolute tw-bottom-6 tw-left-1/2 
                  ${theme.tooltip.background} tw-rounded-lg 
                  tw-py-1.5 tw-px-3 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-min-w-[120px] tw-text-center
                  tw-shadow-lg tw-border tw-border-gray-600/20 ${theme.tooltip.text}
                  tw-transition-transform tw-duration-200 tw-ease-out`}
                style={{
                  transform: `translateX(calc(-50% + ${currentPercentage <= 10 ? 50 : 0
                    }%))`,
                }}>
                <span className="tw-block">
                  {formatNumberWithCommas(
                    typeof voteValue === "string" ? 0 : voteValue
                  )}{" "}
                  {label}
                </span>
                <div
                  className={`tw-absolute tw-w-2 tw-h-2 tw-bottom-[-4px] tw-left-1/2 -tw-translate-x-1/2
                    tw-rotate-45 ${theme.tooltip.background} tw-border-r tw-border-b tw-border-gray-600/20`}
                />
              </div>

              <motion.div
                className={`tw-w-5 tw-h-5 tw-rounded-full 
                  ${theme.thumb.background}
                  tw-border-2 ${theme.thumb.border} 
                  tw-shadow-lg tw-transition-shadow
                  after:tw-content-[''] after:tw-absolute after:tw-inset-0 
                  after:tw-rounded-full after:tw-transition-all after:tw-duration-200
                  ${theme.thumb.glow} ${theme.thumb.hover}`}
                style={{
                  scale: isDragging ? 1.1 : scale,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: isDragging
                    ? "0 0 15px rgba(255,255,255,0.2)"
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
