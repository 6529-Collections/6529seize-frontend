import React, { useState, useEffect, useRef } from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { SliderTheme, SLIDER_THEMES } from "./types/slider.types";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";

interface WaveDropVoteSliderProps {
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

export default function WaveDropVoteSlider({
  voteValue,
  setVoteValue,
  minValue,
  maxValue,
  rank = null,
  creditType,
}: WaveDropVoteSliderProps) {
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

          {/* Thumb hit area */}
          <div
            className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-z-30"
            style={{
              clipPath: `circle(12px at ${currentPercentage}% 50%)`,
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
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsDragging(false);
              }}
              className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-appearance-none tw-cursor-pointer tw-opacity-0"
            />
          </div>

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

          {/* Thumb visual */}
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
            transition={{ duration: 0.3, type: "spring" }}
          >
            <div className="tw-relative">
              <div
                className={`tw-absolute tw-bottom-6 tw-left-1/2 
                  ${theme.tooltip.background} tw-rounded-lg 
                  tw-py-1.5 tw-px-3 tw-text-xs tw-font-medium tw-whitespace-nowrap tw-min-w-[120px] tw-text-center
                  tw-shadow-lg tw-border tw-border-gray-600/20 ${theme.tooltip.text}
                  tw-transition-transform tw-duration-200 tw-ease-out`}
                style={{
                  transform: `translateX(calc(-50% + ${
                    currentPercentage <= 10 ? 50 : 0
                  }%))`,
                }}
              >
                <span className="tw-block">
                  {formatNumberWithCommas(
                    typeof voteValue === "string" ? 0 : voteValue
                  )}{" "}
                  {creditType}
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
                style={{
                  scale: isDragging ? 1.1 : scale,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
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
}; 