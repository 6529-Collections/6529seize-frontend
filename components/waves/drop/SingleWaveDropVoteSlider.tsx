import React, { useState, useEffect, useRef } from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { SliderTheme, SLIDER_THEMES } from "./types/slider.types";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";

interface SingleWaveDropVoteSliderProps {
  readonly voteValue: number | string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly rank?: number | null;
  readonly creditType: ApiWaveCreditType;
}

interface PresetMark {
  percentage: number;
  label: string;
  position: number;
}

const transformToLog = (value: number, minValue: number, maxValue: number): number => {
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

const transformFromLog = (value: number, minValue: number, maxValue: number): number => {
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

const calculatePresetMarks = (minValue: number, maxValue: number) => {
  const zeroPoint = ((transformToLog(0, minValue, maxValue) - minValue) / (maxValue - minValue)) * 100;
  const marks: PresetMark[] = [];

  // Add 0% mark
  marks.push({
    percentage: 0,
    label: "0%",
    position: zeroPoint,
  });

  // Negative presets
  if (minValue < 0) {
    const negativeValues = [-75, -50, -25];
    negativeValues.forEach(percentage => {
      const value = -(Math.abs(minValue) * Math.abs(percentage)) / 100;
      const logValue = transformToLog(value, minValue, maxValue);
      const position = ((logValue - minValue) / (maxValue - minValue)) * 100;
      marks.push({
        percentage,
        label: `${percentage}%`,
        position,
      });
    });
  }

  // Positive presets
  if (maxValue > 0) {
    const positiveValues = [25, 50, 75];
    positiveValues.forEach(percentage => {
      const value = (maxValue * percentage) / 100;
      const logValue = transformToLog(value, minValue, maxValue);
      const position = ((logValue - minValue) / (maxValue - minValue)) * 100;
      marks.push({
        percentage,
        label: `${percentage}%`,
        position,
      });
    });
  }

  // Sort marks by position to ensure proper rendering order
  return marks.sort((a, b) => a.position - b.position);
};

export default function SingleWaveDropVoteSlider({
  voteValue,
  setVoteValue,
  minValue,
  maxValue,
  rank = null,
  creditType,
}: SingleWaveDropVoteSliderProps) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPreset, setHoveredPreset] = useState<number | null>(null);

  const presetMarks = calculatePresetMarks(minValue, maxValue);

  const getTheme = (rank: number | null): SliderTheme => {
    if (rank === 1 || rank === 2 || rank === 3) {
      return SLIDER_THEMES[rank];
    }
    return SLIDER_THEMES.default;
  };

  const theme = getTheme(rank);

  const handleSliderChange = (newValue: number) => {
    const transformedValue = transformFromLog(newValue, minValue, maxValue);
    setVoteValue(transformedValue);
  };

  const handlePresetClick = (percentage: number) => {
    if (percentage < 0) {
      const negativeRange = Math.abs(minValue);
      const value = Math.round(-(negativeRange * Math.abs(percentage)) / 100);
      setVoteValue(value);
    } else {
      const positiveRange = maxValue;
      const value = Math.round((positiveRange * percentage) / 100);
      setVoteValue(value);
    }
  };

  const numericVoteValue = typeof voteValue === "string" ? 0 : voteValue;
  const logValue = transformToLog(numericVoteValue, minValue, maxValue);
  
  const zeroPercentage =
    minValue === 0 && maxValue === 0
      ? 50
      : ((0 - minValue) / (maxValue - minValue)) * 100;
      
  const currentPercentage =
    minValue === 0 && maxValue === 0 && logValue === 0
      ? 50
      : ((logValue - minValue) / (maxValue - minValue)) * 100;

  const x = useMotionValue(currentPercentage);
  const xSmooth = useSpring(x, { damping: 20, stiffness: 300 });
  const scale = useTransform(xSmooth, [0, 100], [0.95, 1.05]);

  useEffect(() => {
    x.set(currentPercentage);
  }, [currentPercentage]);

  const progressBarStyle =
    numericVoteValue >= 0
      ? {
          left: `${zeroPercentage}%`,
          width: `${currentPercentage - zeroPercentage}%`,
        }
      : {
          left: `${currentPercentage}%`,
          width: `${zeroPercentage - currentPercentage}%`,
        };

  return (
    <div
      className="tw-h-[20px] tw-flex tw-items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="tw-relative tw-flex-1 tw-overflow-visible">
        <div className="tw-relative tw-h-[8px] tw-group">
          {/* Base range input for track clicks */}
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={logValue}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-appearance-none tw-cursor-pointer tw-opacity-0 tw-z-10"
          />

          {/* Track and progress */}
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

          {/* Ticks */}
          {presetMarks.map((mark) => (
            <div
              key={mark.percentage}
              className="tw-absolute tw-z-20"
              style={{ left: `${mark.position}%` }}
              onClick={(e) => {
                e.stopPropagation();
                handlePresetClick(mark.percentage);
              }}
            >
              <div
                className="tw-relative -tw-top-[2px] tw-cursor-pointer tw-group"
                onMouseEnter={() => setHoveredPreset(mark.percentage)}
                onMouseLeave={() => setHoveredPreset(null)}
              >
                <div className="tw-absolute tw-h-4 tw-w-8 -tw-left-4" />
                <div
                  className="tw-h-4 tw-w-0.5 tw-bg-iron-400/30 tw-rounded-full tw-mx-auto
                  group-hover:tw-bg-iron-400/60 tw-transition-colors tw-duration-200"
                />
              </div>
              <div className="tw-relative">
                <motion.div
                  className={`tw-absolute tw-top-1 tw-left-1/2 -tw-translate-x-1/2 
                    tw-text-[10px] tw-font-medium
                    tw-whitespace-nowrap tw-select-none
                    tw-transition-all tw-duration-200
                    ${
                      hoveredPreset === mark.percentage
                        ? "tw-opacity-0"
                        : "tw-text-iron-400 tw-opacity-60"
                    }`}
                >
                  {mark.label}
                </motion.div>
                <motion.div
                  className={`tw-absolute tw-top-1 tw-left-1/2 -tw-translate-x-1/2 
                    tw-text-[10px] tw-font-medium tw-text-iron-200
                    tw-whitespace-nowrap tw-select-none
                    tw-transition-all tw-duration-200
                    ${
                      hoveredPreset === mark.percentage
                        ? "tw-opacity-100"
                        : "tw-opacity-0"
                    }`}
                >
                  {formatNumberWithCommas(
                    mark.percentage === 0
                      ? 0
                      : mark.percentage < 0
                      ? Math.round(
                          -(Math.abs(minValue) * Math.abs(mark.percentage)) / 100
                        )
                      : Math.round((maxValue * mark.percentage) / 100)
                  )}{" "}
                  {creditType}
                </motion.div>
              </div>
            </div>
          ))}

          {/* Thumb */}
          <motion.div
            ref={thumbRef}
            className={`tw-absolute tw-top-1/2 -tw-translate-y-1/2 -tw-ml-[10px] tw-z-30 tw-pointer-events-none`}
            style={{
              left: `${currentPercentage}%`,
              scale,
            }}
          >
            <div
              className={`tw-w-5 tw-h-5 tw-rounded-full tw-shadow-lg ${theme.thumb.background} ${theme.thumb.glow}`}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}; 