"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getSliderTheme } from "./types/slider.types";
import {
  domAnimation,
  LazyMotion,
  m,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
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

const clampToRange = (
  value: number,
  minValue: number,
  maxValue: number
): number => {
  const lowerBound = Math.min(minValue, maxValue);
  const upperBound = Math.max(minValue, maxValue);
  const fallbackValue = lowerBound <= 0 && upperBound >= 0 ? 0 : lowerBound;
  const safeValue = Number.isFinite(value) ? value : fallbackValue;

  return Math.min(Math.max(safeValue, lowerBound), upperBound);
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
  if (maxAbs <= 1) return value;

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
  if (maxAbs <= 1) return Math.round(value);

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
    setVoteValue(clampToRange(transformedValue, minValue, maxValue));
  };

  const numericVoteValue =
    typeof voteValue === "number" && Number.isFinite(voteValue) ? voteValue : 0;
  const logValue = clampToRange(
    transformToLog(numericVoteValue, minValue, maxValue),
    minValue,
    maxValue
  );

  const isFixedRange = minValue === maxValue;
  const rangeSize = maxValue - minValue;

  const zeroPercentage = isFixedRange ? 50 : ((0 - minValue) / rangeSize) * 100;

  const currentPercentage = isFixedRange
    ? 50
    : ((logValue - minValue) / rangeSize) * 100;

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
    <LazyMotion features={domAnimation}>
      <div
        className={`tw-flex tw-items-center [touch-action:none] ${
          isMini ? "tw-h-6" : "tw-h-9"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw-relative tw-flex-1 tw-overflow-visible">
          <div
            className={`tw-group tw-relative tw-h-[6px] ${
              isMini ? "tw-mt-3" : "tw-mt-6 sm:tw-mt-0"
            }`}
          >
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
              className="tw-absolute tw-left-0 tw-right-0 tw-z-10 tw-w-full tw-cursor-pointer tw-appearance-none tw-opacity-0"
              style={{
                top: -hitAreaPadding,
                bottom: -hitAreaPadding,
              }}
            />

            <m.div
              className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-z-0 tw-rounded-full tw-shadow-inner ${theme.track.background} ${theme.track.hover}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            <m.div
              className={`tw-pointer-events-none tw-absolute tw-z-10 tw-h-full tw-rounded-full tw-backdrop-blur-sm ${theme.progress.background} ${theme.progress.glow}`}
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
              }}
            >
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
                className="tw-absolute tw-inset-y-0 tw-left-0 tw-right-0 tw-w-full tw-cursor-pointer tw-appearance-none tw-opacity-0"
              />
            </div>

            <m.div
              ref={thumbRef}
              style={{
                left: `${currentPercentage}%`,
                top: "50%",
                x: "-50%",
                y: "-50%",
                scale: isDragging ? 1.1 : 1,
              }}
              className="tw-pointer-events-none tw-absolute tw-z-40"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <div className="tw-relative">
                <div
                  className={`tw-absolute tw-bottom-6 tw-left-1/2 ${theme.tooltip.background} tw-min-w-[120px] tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-gray-600/20 tw-px-3 tw-py-1.5 tw-text-center tw-text-xs tw-font-medium tw-shadow-lg ${theme.tooltip.text} tw-transition-transform tw-duration-200 tw-ease-out`}
                  style={{
                    transform: `translateX(calc(-50% + ${
                      currentPercentage <= 10 ? 50 : 0
                    }%))`,
                  }}
                >
                  <span className="tw-block">
                    {formatNumberWithCommas(numericVoteValue)} {label}
                  </span>
                  <div
                    className={`tw-absolute tw-bottom-[-4px] tw-left-1/2 tw-h-2 tw-w-2 -tw-translate-x-1/2 tw-rotate-45 ${theme.tooltip.background} tw-border-b tw-border-r tw-border-gray-600/20`}
                  />
                </div>

                <m.div
                  className={`tw-h-5 tw-w-5 tw-rounded-full ${theme.thumb.background} tw-border-2 ${theme.thumb.border} tw-shadow-lg tw-transition-shadow after:tw-absolute after:tw-inset-0 after:tw-rounded-full after:tw-transition-all after:tw-duration-200 after:tw-content-[''] ${theme.thumb.glow} ${theme.thumb.hover}`}
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
            </m.div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
