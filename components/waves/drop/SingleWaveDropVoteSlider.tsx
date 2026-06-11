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
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote.types";

interface WaveDropVoteSliderProps {
  readonly voteValue: number | string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly setVoteValue: React.Dispatch<React.SetStateAction<string | number>>;
  readonly onValueAccepted?: ((value: number) => void) | undefined;
  readonly rank?: number | null | undefined;
  readonly label: string;
  readonly size?: SingleWaveDropVoteSize | undefined;
}

type ProgressBarStyle = {
  left: string;
  width: string;
};

type SliderTheme = ReturnType<typeof getSliderTheme>;

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

const getTrackClasses = (
  isMini: boolean,
  theme: SliderTheme
): string => {
  if (isMini) {
    return `${theme.track.background} ${theme.track.hover} tw-shadow-inner`;
  }

  return "tw-bg-[#26272B]";
};

const getProgressClasses = ({
  isMini,
  isPositiveVote,
  isNegativeVote,
  theme,
}: {
  readonly isMini: boolean;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
  readonly theme: SliderTheme;
}): string => {
  if (isMini) {
    return `${theme.progress.background} ${theme.progress.glow} tw-backdrop-blur-sm`;
  }

  if (isPositiveVote) {
    return "tw-bg-emerald-500";
  }

  if (isNegativeVote) {
    return "tw-bg-rose-500";
  }

  return "tw-bg-iron-400";
};

const getTooltipClasses = ({
  isMini,
  isPositiveVote,
  isNegativeVote,
  theme,
}: {
  readonly isMini: boolean;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
  readonly theme: SliderTheme;
}): string => {
  if (isMini) {
    return `${theme.tooltip.background} ${theme.tooltip.text} tw-min-w-[120px] tw-rounded-lg tw-border-gray-600/20 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-shadow-lg`;
  }

  if (isPositiveVote) {
    return "tw-min-h-[22px] tw-min-w-[56px] tw-max-w-[108px] tw-rounded tw-border-dashed tw-border-emerald-500/40 tw-bg-[#0d0d10] tw-px-2 tw-py-1 tw-text-[11px] tw-font-bold tw-leading-[14px] tw-text-emerald-500";
  }

  if (isNegativeVote) {
    return "tw-min-h-[22px] tw-min-w-[56px] tw-max-w-[108px] tw-rounded tw-border-dashed tw-border-rose-500/40 tw-bg-[#0d0d10] tw-px-2 tw-py-1 tw-text-[11px] tw-font-bold tw-leading-[14px] tw-text-rose-500";
  }

  return "tw-min-h-[22px] tw-min-w-[56px] tw-max-w-[108px] tw-rounded tw-border-dashed tw-border-[#37373E] tw-bg-[#0d0d10] tw-px-2 tw-py-1 tw-text-[11px] tw-font-bold tw-leading-[14px] tw-text-[#848490]";
};

const getTooltipArrowClasses = ({
  isMini,
  isPositiveVote,
  isNegativeVote,
  theme,
}: {
  readonly isMini: boolean;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
  readonly theme: SliderTheme;
}): string => {
  if (isMini) {
    return `${theme.tooltip.background} tw-border-gray-600/20`;
  }

  if (isPositiveVote) {
    return "tw-border-emerald-500/40 tw-bg-[#0d0d10]";
  }

  if (isNegativeVote) {
    return "tw-border-rose-500/40 tw-bg-[#0d0d10]";
  }

  return "tw-border-[#26272B] tw-bg-[#0d0d10]";
};

const getThumbClasses = ({
  isMini,
  isPositiveVote,
  isNegativeVote,
  theme,
}: {
  readonly isMini: boolean;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
  readonly theme: SliderTheme;
}): string => {
  if (isMini) {
    return `tw-h-5 tw-w-5 ${theme.thumb.background} tw-border-2 ${theme.thumb.border} tw-shadow-lg after:tw-absolute after:tw-inset-0 after:tw-rounded-full after:tw-transition-all after:tw-duration-200 after:tw-content-[''] ${theme.thumb.glow} ${theme.thumb.hover}`;
  }

  if (isPositiveVote) {
    return "tw-size-[11px] tw-rounded-full tw-bg-emerald-500";
  }

  if (isNegativeVote) {
    return "tw-size-[11px] tw-rounded-full tw-bg-rose-500";
  }

  return "tw-size-[11px] tw-rounded-full tw-bg-iron-300";
};

const getThumbOuterClasses = (
  isPositiveVote: boolean,
  isNegativeVote: boolean
): string => {
  if (isPositiveVote) {
    return "tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid tw-border-emerald-500 tw-bg-[#131316]";
  }

  if (isNegativeVote) {
    return "tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid tw-border-rose-500 tw-bg-[#131316]";
  }

  return "tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid tw-border-[#4C4C55] tw-bg-[#131316]";
};

const getThumbIdleShadow = ({
  isMini,
  isPositiveVote,
  isNegativeVote,
}: {
  readonly isMini: boolean;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
  if (isMini) {
    return "0 0 0 rgba(255,255,255,0)";
  }

  if (isPositiveVote) {
    return "0 0 0 1px rgba(16,185,129,0.28)";
  }

  if (isNegativeVote) {
    return "0 0 0 1px rgba(244,63,94,0.28)";
  }

  return "0 0 0 1px rgba(76,76,85,0.45)";
};

const getThumbDraggingShadow = ({
  isMini,
  isPositiveVote,
  isNegativeVote,
}: {
  readonly isMini: boolean;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
  if (isMini) {
    return "0 0 15px rgba(255,255,255,0.2)";
  }

  if (isPositiveVote) {
    return "0 0 0 3px rgba(16,185,129,0.22)";
  }

  if (isNegativeVote) {
    return "0 0 0 3px rgba(244,63,94,0.22)";
  }

  return "0 0 0 3px rgba(76,76,85,0.28)";
};

const getZeroMarkerClasses = (isNeutralVote: boolean): string => {
  if (isNeutralVote) {
    return "tw-bg-blue-500";
  }

  return "tw-bg-[#37373E]";
};

const getThumbVisualBoxClasses = (isMini: boolean): string => {
  if (isMini) {
    return "tw-relative";
  }

  return "tw-relative tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center";
};

const getMinLabelClasses = (minValue: number): string => {
  if (minValue < 0) {
    return "tw-text-rose-400";
  }

  return "tw-text-iron-500";
};

const getMaxLabelClasses = (maxValue: number): string => {
  if (maxValue > 0) {
    return "tw-text-emerald-400";
  }

  return "tw-text-iron-500";
};

const getMaxLabelPrefix = (maxValue: number): string => {
  if (maxValue > 0) {
    return "+";
  }

  return "";
};

const getTooltipOffset = (currentPercentage: number): number => {
  if (currentPercentage <= 10) {
    return 50;
  }

  if (currentPercentage >= 90) {
    return -50;
  }

  return 0;
};

export default function WaveDropVoteSlider({
  voteValue,
  setVoteValue,
  onValueAccepted,
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

  const getAcceptedVoteValue = (newValue: number) => {
    const transformedValue = transformFromLog(newValue, minValue, maxValue);
    return clampToRange(transformedValue, minValue, maxValue);
  };

  const handleSliderChange = (newValue: number) => {
    setVoteValue(getAcceptedVoteValue(newValue));
  };

  const handleSliderValueAccepted = (newValue: number) => {
    onValueAccepted?.(getAcceptedVoteValue(newValue));
  };

  const numericVoteValue =
    typeof voteValue === "number" && Number.isFinite(voteValue) ? voteValue : 0;
  const isPositiveVote = numericVoteValue > 0;
  const isNegativeVote = numericVoteValue < 0;
  const isNeutralVote = !isPositiveVote && !isNegativeVote;
  const trackClasses = getTrackClasses(isMini, theme);
  const progressClasses = getProgressClasses({
    isMini,
    isPositiveVote,
    isNegativeVote,
    theme,
  });
  const tooltipClasses = getTooltipClasses({
    isMini,
    isPositiveVote,
    isNegativeVote,
    theme,
  });
  const tooltipArrowClasses = getTooltipArrowClasses({
    isMini,
    isPositiveVote,
    isNegativeVote,
    theme,
  });
  const thumbClasses = getThumbClasses({
    isMini,
    isPositiveVote,
    isNegativeVote,
    theme,
  });
  const thumbOuterClasses = getThumbOuterClasses(
    isPositiveVote,
    isNegativeVote
  );
  const thumbIdleShadow = getThumbIdleShadow({
    isMini,
    isPositiveVote,
    isNegativeVote,
  });
  const thumbDraggingShadow = getThumbDraggingShadow({
    isMini,
    isPositiveVote,
    isNegativeVote,
  });
  const zeroMarkerClasses = getZeroMarkerClasses(isNeutralVote);
  const thumbVisualBoxClasses = getThumbVisualBoxClasses(isMini);
  const logValue = clampToRange(
    transformToLog(numericVoteValue, minValue, maxValue),
    minValue,
    maxValue
  );

  const isFixedRange = minValue === maxValue;
  const rangeSize = maxValue - minValue;

  const zeroPercentage = isFixedRange ? 50 : ((0 - minValue) / rangeSize) * 100;
  const progressOriginPercentage = clampToRange(zeroPercentage, 0, 100);
  const showZeroScaleMarker = !isMini && minValue < 0 && maxValue > 0;
  const minLabelClasses = getMinLabelClasses(minValue);
  const maxLabelClasses = getMaxLabelClasses(maxValue);
  const maxLabelPrefix = getMaxLabelPrefix(maxValue);

  const currentPercentage = isFixedRange
    ? 50
    : ((logValue - minValue) / rangeSize) * 100;
  const tooltipOffset = getTooltipOffset(currentPercentage);

  const x = useMotionValue(currentPercentage);
  const xSmooth = useSpring(x, { damping: 20, stiffness: 300 });
  const scale = useTransform(xSmooth, [0, 100], [0.95, 1.05]);

  useEffect(() => {
    x.set(currentPercentage);
  }, [currentPercentage, x]);

  const progressBarStyle = getProgressBarStyle(
    numericVoteValue,
    currentPercentage,
    progressOriginPercentage
  );

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={`tw-flex tw-items-center [touch-action:none] ${
          isMini ? "tw-h-6" : "tw-h-[72px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw-relative tw-flex-1 tw-overflow-visible">
          <div
            className={`tw-group tw-relative ${
              isMini ? "tw-mt-3 tw-h-[6px]" : "tw-mt-8 tw-h-[7px]"
            }`}
          >
            <input
              type="range"
              min={minValue}
              max={maxValue}
              value={logValue}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              onClick={(e) => {
                e.stopPropagation();
                handleSliderValueAccepted(Number(e.currentTarget.value));
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                // Force immediate focus to allow dragging without double-tap
                e.currentTarget.focus();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleSliderValueAccepted(Number(e.currentTarget.value));
              }}
              className="tw-absolute tw-left-0 tw-right-0 tw-z-10 tw-w-full tw-cursor-pointer tw-appearance-none tw-opacity-0"
              style={{
                top: -hitAreaPadding,
                bottom: -hitAreaPadding,
              }}
            />

            <m.div
              className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-z-0 tw-rounded-full ${trackClasses}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            <m.div
              className={`tw-pointer-events-none tw-absolute tw-z-10 tw-h-full tw-rounded-full ${progressClasses}`}
              style={progressBarStyle}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            {showZeroScaleMarker && (
              <div
                className={`tw-pointer-events-none tw-absolute tw-top-1/2 tw-z-20 tw-h-[13px] tw-w-0.5 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full ${zeroMarkerClasses}`}
                style={{ left: `${progressOriginPercentage}%` }}
              />
            )}

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
                onClick={(e) => {
                  e.stopPropagation();
                  handleSliderValueAccepted(Number(e.currentTarget.value));
                }}
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
                  handleSliderValueAccepted(Number(e.currentTarget.value));
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
              <div className={thumbVisualBoxClasses}>
                <div
                  className={`tw-absolute ${
                    isMini ? "tw-bottom-6" : "tw-bottom-10"
                  } tw-left-1/2 tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-border tw-text-center tw-transition-transform tw-duration-200 tw-ease-out ${tooltipClasses}`}
                  style={{
                    transform: `translateX(calc(-50% + ${tooltipOffset}%))`,
                  }}
                >
                  <span className="tw-flex tw-min-w-0 tw-items-center tw-justify-center tw-gap-1">
                    <span className="tw-min-w-0 tw-truncate tw-leading-[14px]">
                      {formatNumberWithCommas(numericVoteValue)}
                    </span>
                    <span className="tw-sr-only">{label}</span>
                  </span>
                  {isMini && (
                    <div
                      className={`tw-absolute tw-bottom-[-4px] tw-left-1/2 tw-h-2 tw-w-2 -tw-translate-x-1/2 tw-rotate-45 tw-border-b tw-border-r ${tooltipArrowClasses}`}
                    />
                  )}
                </div>

                {isMini ? (
                  <m.div
                    className={`tw-rounded-full tw-transition-shadow ${thumbClasses}`}
                    style={{
                      scale: isDragging ? 1.1 : scale,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: isDragging
                        ? thumbDraggingShadow
                        : thumbIdleShadow,
                    }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <m.div
                    className={thumbOuterClasses}
                    style={{
                      scale: isDragging ? 1.08 : scale,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{
                      boxShadow: isDragging
                        ? thumbDraggingShadow
                        : thumbIdleShadow,
                    }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={thumbClasses} />
                  </m.div>
                )}
              </div>
            </m.div>

            {!isMini && (
              <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-6 tw-flex tw-h-4 tw-items-center tw-justify-between tw-text-[10px] tw-font-medium">
                <span className={minLabelClasses}>
                  {formatNumberWithCommas(minValue)}
                </span>
                {showZeroScaleMarker && (
                  <span
                    className="tw-absolute -tw-translate-x-1/2 tw-text-iron-500"
                    style={{ left: `${progressOriginPercentage}%` }}
                  >
                    0
                  </span>
                )}
                <span className={maxLabelClasses}>
                  {maxLabelPrefix}
                  {formatNumberWithCommas(maxValue)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
