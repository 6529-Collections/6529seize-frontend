"use client";

import type { FC } from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { m, type MotionValue } from "framer-motion";

export type SliderVisualState = {
  readonly trackClasses: string;
  readonly progressClasses: string;
  readonly tooltipClasses: string;
  readonly tooltipArrowClasses: string;
  readonly thumbClasses: string;
  readonly thumbOuterClasses: string;
  readonly thumbIdleShadow: string;
  readonly thumbDraggingShadow: string;
  readonly zeroMarkerClasses: string;
  readonly thumbVisualBoxClasses: string;
  readonly minLabelClasses: string;
  readonly maxLabelClasses: string;
  readonly maxLabelPrefix: string;
};

type SliderThumbProps = {
  readonly isMini: boolean;
  readonly isDragging: boolean;
  readonly scale: MotionValue<number> | number;
  readonly numericVoteValue: number;
  readonly label: string;
  readonly visualState: SliderVisualState;
  readonly tooltipBottomClassName: string;
  readonly tooltipOffset: number;
};

type SliderScaleLabelsProps = {
  readonly isMini: boolean;
  readonly minValue: number;
  readonly maxValue: number;
  readonly showZeroScaleMarker: boolean;
  readonly progressOriginPercentage: number;
  readonly visualState: SliderVisualState;
};

type SliderZeroMarkerProps = {
  readonly showZeroScaleMarker: boolean;
  readonly progressOriginPercentage: number;
  readonly zeroMarkerClasses: string;
};

const getThumbBoxShadow = (
  isDragging: boolean,
  visualState: SliderVisualState
): string => {
  if (isDragging) {
    return visualState.thumbDraggingShadow;
  }

  return visualState.thumbIdleShadow;
};

const getMiniThumbScale = (
  isDragging: boolean,
  scale: MotionValue<number> | number
): number | MotionValue<number> => {
  if (isDragging) {
    return 1.1;
  }

  return scale;
};

const getNormalThumbScale = (
  isDragging: boolean,
  scale: MotionValue<number> | number
): number | MotionValue<number> => {
  if (isDragging) {
    return 1.08;
  }

  return scale;
};

export const SliderZeroMarker: FC<SliderZeroMarkerProps> = ({
  showZeroScaleMarker,
  progressOriginPercentage,
  zeroMarkerClasses,
}) => {
  if (showZeroScaleMarker) {
    return (
      <div
        className={`tw-pointer-events-none tw-absolute tw-top-1/2 tw-z-20 tw-h-[13px] tw-w-0.5 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full ${zeroMarkerClasses}`}
        style={{ left: `${progressOriginPercentage}%` }}
      />
    );
  }

  return null;
};

export const SliderThumb: FC<SliderThumbProps> = ({
  isMini,
  isDragging,
  scale,
  numericVoteValue,
  label,
  visualState,
  tooltipBottomClassName,
  tooltipOffset,
}) => {
  const boxShadow = getThumbBoxShadow(isDragging, visualState);
  const thumbScale = isMini
    ? getMiniThumbScale(isDragging, scale)
    : getNormalThumbScale(isDragging, scale);
  const tapScale = isMini ? 0.95 : 0.97;

  return (
    <div className={visualState.thumbVisualBoxClasses}>
      <div
        className={`tw-absolute ${tooltipBottomClassName} tw-left-1/2 tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-border tw-text-center tw-transition-transform tw-duration-200 tw-ease-out ${visualState.tooltipClasses}`}
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
            className={`tw-absolute tw-bottom-[-4px] tw-left-1/2 tw-h-2 tw-w-2 -tw-translate-x-1/2 tw-rotate-45 tw-border-b tw-border-r ${visualState.tooltipArrowClasses}`}
          />
        )}
      </div>

      <m.div
        className={visualState.thumbOuterClasses}
        style={{
          scale: thumbScale,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: tapScale }}
        animate={{
          boxShadow,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className={visualState.thumbClasses} />
      </m.div>
    </div>
  );
};

export const SliderScaleLabels: FC<SliderScaleLabelsProps> = ({
  isMini,
  minValue,
  maxValue,
  showZeroScaleMarker,
  progressOriginPercentage,
  visualState,
}) => {
  if (isMini) {
    return null;
  }

  return (
    <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-6 tw-flex tw-h-4 tw-items-center tw-justify-between tw-text-[10px] tw-font-medium">
      <span className={visualState.minLabelClasses}>
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
      <span className={visualState.maxLabelClasses}>
        {visualState.maxLabelPrefix}
        {formatNumberWithCommas(maxValue)}
      </span>
    </div>
  );
};
