"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote.types";
import {
  SliderScaleLabels,
  SliderThumb,
  type SliderVisualState,
  SliderZeroMarker,
} from "./SingleWaveDropVoteSliderVisuals";

interface WaveDropVoteSliderProps {
  readonly voteValue: number | string;
  readonly minValue: number;
  readonly maxValue: number;
  readonly setVoteValue: Dispatch<SetStateAction<string | number>>;
  readonly onValueAccepted?: ((value: number) => void) | undefined;
  readonly label: string;
  readonly size?: SingleWaveDropVoteSize | undefined;
}

type ProgressBarStyle = {
  left: string;
  width: string;
};

type SliderVoteState = {
  readonly numericVoteValue: number;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
  readonly isNeutralVote: boolean;
};

type SliderGeometry = {
  readonly hitAreaPadding: number;
  readonly thumbHitWidth: number;
  readonly thumbHitHeight: number;
  readonly rootClassName: string;
  readonly trackContainerClassName: string;
  readonly tooltipBottomClassName: string;
};

type SliderRangeState = {
  readonly logValue: number;
  readonly currentPercentage: number;
  readonly progressOriginPercentage: number;
  readonly progressBarStyle: ProgressBarStyle;
  readonly showZeroScaleMarker: boolean;
  readonly tooltipOffset: number;
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

const getSliderVoteState = (voteValue: number | string): SliderVoteState => {
  let numericVoteValue = 0;
  if (typeof voteValue === "number" && Number.isFinite(voteValue)) {
    numericVoteValue = voteValue;
  }

  return {
    numericVoteValue,
    isPositiveVote: numericVoteValue > 0,
    isNegativeVote: numericVoteValue < 0,
    isNeutralVote: numericVoteValue === 0,
  };
};

const getSliderGeometry = (isMini: boolean): SliderGeometry => {
  if (isMini) {
    return {
      hitAreaPadding: 16,
      thumbHitWidth: 72,
      thumbHitHeight: 48,
      rootClassName: "tw-flex tw-h-6 tw-items-center [touch-action:none]",
      trackContainerClassName: "tw-group tw-relative tw-mt-3 tw-h-[6px]",
      tooltipBottomClassName: "tw-bottom-6",
    };
  }

  return {
    hitAreaPadding: 24,
    thumbHitWidth: 96,
    thumbHitHeight: 64,
    rootClassName: "tw-flex tw-h-[72px] tw-items-center [touch-action:none]",
    trackContainerClassName: "tw-group tw-relative tw-mt-8 tw-h-[7px]",
    tooltipBottomClassName: "tw-bottom-10",
  };
};

const getSliderRangeState = ({
  numericVoteValue,
  minValue,
  maxValue,
  isMini,
}: {
  readonly numericVoteValue: number;
  readonly minValue: number;
  readonly maxValue: number;
  readonly isMini: boolean;
}): SliderRangeState => {
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

  const progressOriginPercentage = clampToRange(zeroPercentage, 0, 100);
  const showZeroScaleMarker = getShowZeroScaleMarker({
    isMini,
    minValue,
    maxValue,
  });

  return {
    logValue,
    currentPercentage,
    progressOriginPercentage,
    progressBarStyle: getProgressBarStyle(
      numericVoteValue,
      currentPercentage,
      progressOriginPercentage
    ),
    showZeroScaleMarker,
    tooltipOffset: getTooltipOffset(currentPercentage),
  };
};

const getTrackClasses = (isMini: boolean): string => {
  if (isMini) {
    return "tw-bg-[#26272B] tw-shadow-inner group-hover:tw-bg-[#37373E]";
  }

  return "tw-bg-[#26272B]";
};

const getProgressClasses = ({
  isPositiveVote,
  isNegativeVote,
}: {
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
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
}: {
  readonly isMini: boolean;
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
  const sizeClasses = isMini
    ? "tw-min-h-[22px] tw-min-w-[48px] tw-max-w-[88px] tw-rounded tw-px-2 tw-py-1 tw-text-[11px] tw-font-bold tw-leading-[14px]"
    : "tw-min-h-[22px] tw-min-w-[56px] tw-max-w-[108px] tw-rounded tw-px-2 tw-py-1 tw-text-[11px] tw-font-bold tw-leading-[14px]";

  if (isPositiveVote) {
    return `${sizeClasses} tw-border-dashed tw-border-emerald-500/40 tw-bg-[#0d0d10] tw-text-emerald-500`;
  }

  if (isNegativeVote) {
    return `${sizeClasses} tw-border-dashed tw-border-rose-500/40 tw-bg-[#0d0d10] tw-text-rose-500`;
  }

  return `${sizeClasses} tw-border-dashed tw-border-[#37373E] tw-bg-[#0d0d10] tw-text-[#848490]`;
};

const getTooltipArrowClasses = ({
  isPositiveVote,
  isNegativeVote,
}: {
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
  if (isPositiveVote) {
    return "tw-border-emerald-500/40 tw-bg-[#0d0d10]";
  }

  if (isNegativeVote) {
    return "tw-border-rose-500/40 tw-bg-[#0d0d10]";
  }

  return "tw-border-[#26272B] tw-bg-[#0d0d10]";
};

const getThumbClasses = ({
  isPositiveVote,
  isNegativeVote,
}: {
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
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
    return "tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid tw-border-emerald-500 tw-bg-[#131316] tw-transition-shadow";
  }

  if (isNegativeVote) {
    return "tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid tw-border-rose-500 tw-bg-[#131316] tw-transition-shadow";
  }

  return "tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid tw-border-[#4C4C55] tw-bg-[#131316] tw-transition-shadow";
};

const getThumbIdleShadow = ({
  isPositiveVote,
  isNegativeVote,
}: {
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
  if (isPositiveVote) {
    return "0 0 0 1px rgba(16,185,129,0.28)";
  }

  if (isNegativeVote) {
    return "0 0 0 1px rgba(244,63,94,0.28)";
  }

  return "0 0 0 1px rgba(76,76,85,0.45)";
};

const getThumbDraggingShadow = ({
  isPositiveVote,
  isNegativeVote,
}: {
  readonly isPositiveVote: boolean;
  readonly isNegativeVote: boolean;
}): string => {
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

const getShowZeroScaleMarker = ({
  isMini,
  minValue,
  maxValue,
}: {
  readonly isMini: boolean;
  readonly minValue: number;
  readonly maxValue: number;
}): boolean => {
  if (isMini) {
    return false;
  }

  return minValue < 0 && maxValue > 0;
};

const getSliderVisualState = ({
  isMini,
  voteState,
  minValue,
  maxValue,
}: {
  readonly isMini: boolean;
  readonly voteState: SliderVoteState;
  readonly minValue: number;
  readonly maxValue: number;
}): SliderVisualState => ({
  trackClasses: getTrackClasses(isMini),
  progressClasses: getProgressClasses({
    isPositiveVote: voteState.isPositiveVote,
    isNegativeVote: voteState.isNegativeVote,
  }),
  tooltipClasses: getTooltipClasses({
    isMini,
    isPositiveVote: voteState.isPositiveVote,
    isNegativeVote: voteState.isNegativeVote,
  }),
  tooltipArrowClasses: getTooltipArrowClasses({
    isPositiveVote: voteState.isPositiveVote,
    isNegativeVote: voteState.isNegativeVote,
  }),
  thumbClasses: getThumbClasses({
    isPositiveVote: voteState.isPositiveVote,
    isNegativeVote: voteState.isNegativeVote,
  }),
  thumbOuterClasses: getThumbOuterClasses(
    voteState.isPositiveVote,
    voteState.isNegativeVote
  ),
  thumbIdleShadow: getThumbIdleShadow({
    isPositiveVote: voteState.isPositiveVote,
    isNegativeVote: voteState.isNegativeVote,
  }),
  thumbDraggingShadow: getThumbDraggingShadow({
    isPositiveVote: voteState.isPositiveVote,
    isNegativeVote: voteState.isNegativeVote,
  }),
  zeroMarkerClasses: getZeroMarkerClasses(voteState.isNeutralVote),
  thumbVisualBoxClasses: getThumbVisualBoxClasses(isMini),
  minLabelClasses: getMinLabelClasses(minValue),
  maxLabelClasses: getMaxLabelClasses(maxValue),
  maxLabelPrefix: getMaxLabelPrefix(maxValue),
});

const getThumbContainerScale = (isDragging: boolean): number => {
  if (isDragging) {
    return 1.1;
  }

  return 1;
};

const getThumbScale = (currentPercentage: number): number => {
  return 0.95 + (currentPercentage / 100) * 0.1;
};

export default function WaveDropVoteSlider({
  voteValue,
  setVoteValue,
  onValueAccepted,
  minValue,
  maxValue,
  label,
  size = SingleWaveDropVoteSize.NORMAL,
}: WaveDropVoteSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isMini = size === SingleWaveDropVoteSize.MINI;
  const geometry = getSliderGeometry(isMini);

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

  const voteState = getSliderVoteState(voteValue);
  const visualState = getSliderVisualState({
    isMini,
    voteState,
    minValue,
    maxValue,
  });
  const rangeState = getSliderRangeState({
    numericVoteValue: voteState.numericVoteValue,
    minValue,
    maxValue,
    isMini,
  });

  const thumbScale = getThumbScale(rangeState.currentPercentage);

  return (
    <LazyMotion features={domAnimation}>
      <div className={geometry.rootClassName}>
        <div className="tw-relative tw-flex-1 tw-overflow-visible">
          <div className={geometry.trackContainerClassName}>
            <input
              type="range"
              min={minValue}
              max={maxValue}
              value={rangeState.logValue}
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
                top: -geometry.hitAreaPadding,
                bottom: -geometry.hitAreaPadding,
              }}
            />

            <m.div
              className={`tw-pointer-events-none tw-absolute tw-inset-0 tw-z-0 tw-rounded-full ${visualState.trackClasses}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            <m.div
              className={`tw-pointer-events-none tw-absolute tw-z-10 tw-h-full tw-rounded-full ${visualState.progressClasses}`}
              style={rangeState.progressBarStyle}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            <SliderZeroMarker
              showZeroScaleMarker={rangeState.showZeroScaleMarker}
              progressOriginPercentage={rangeState.progressOriginPercentage}
              zeroMarkerClasses={visualState.zeroMarkerClasses}
            />

            <div
              className="tw-absolute tw-left-0 tw-right-0 tw-z-30"
              style={{
                top: -geometry.hitAreaPadding,
                bottom: -geometry.hitAreaPadding,
                clipPath: `ellipse(${geometry.thumbHitWidth / 2}px ${geometry.thumbHitHeight / 2}px at ${rangeState.currentPercentage}% 50%)`,
              }}
            >
              <input
                type="range"
                min={minValue}
                max={maxValue}
                value={rangeState.logValue}
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
              style={{
                left: `${rangeState.currentPercentage}%`,
                top: "50%",
                x: "-50%",
                y: "-50%",
                scale: getThumbContainerScale(isDragging),
              }}
              className="tw-pointer-events-none tw-absolute tw-z-40"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <SliderThumb
                isMini={isMini}
                isDragging={isDragging}
                scale={thumbScale}
                numericVoteValue={voteState.numericVoteValue}
                label={label}
                visualState={visualState}
                tooltipBottomClassName={geometry.tooltipBottomClassName}
                tooltipOffset={rangeState.tooltipOffset}
              />
            </m.div>

            <SliderScaleLabels
              isMini={isMini}
              minValue={minValue}
              maxValue={maxValue}
              showZeroScaleMarker={rangeState.showZeroScaleMarker}
              progressOriginPercentage={rangeState.progressOriginPercentage}
              visualState={visualState}
            />
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
