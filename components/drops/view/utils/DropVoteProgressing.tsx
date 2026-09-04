import { formatNumberWithCommas } from "@/helpers/Helpers";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactElement } from "react";
import { Tooltip } from "react-tooltip";

interface DropVoteProgressingProps {
  readonly current: number | null | undefined;
  readonly projected: number | null | undefined;
  readonly projectedLabel?: string | undefined;
  readonly subtle?: boolean | undefined;
  readonly compact?: boolean | undefined;
  readonly tooltipLabel?: string | undefined;
  readonly numberFont?: "mono" | "sans" | undefined;
  readonly numberSize?: "mobile-xs" | "sm" | "body" | undefined;
  readonly numberWeight?: "bold" | "semibold" | undefined;
  readonly visualVariant?: "default" | "memes" | undefined;
}

interface DropVoteProgressingVisualClasses {
  readonly color: string;
  readonly arrowColor: string;
  readonly wrapperClasses: string;
  readonly valueClasses: string;
}

const MUTED_TEXT_CLASS_NAME = "tw-text-iron-600";

const getBaseVisualClasses = (
  subtle: boolean,
  compact: boolean,
  isPositiveProgressing: boolean
): DropVoteProgressingVisualClasses => {
  if (subtle) {
    return {
      color: isPositiveProgressing ? "tw-text-iron-400" : MUTED_TEXT_CLASS_NAME,
      arrowColor: MUTED_TEXT_CLASS_NAME,
      wrapperClasses: "tw-flex tw-items-center tw-gap-2",
      valueClasses: "tw-tracking-tight",
    };
  }

  if (compact) {
    return {
      color: isPositiveProgressing
        ? "tw-text-emerald-400 tw-bg-emerald-500/10 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-border tw-border-solid tw-border-emerald-500/15"
        : "tw-text-rose-400 tw-bg-rose-500/10 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-border tw-border-solid tw-border-rose-500/15",
      arrowColor: "tw-text-iron-500",
      wrapperClasses: "tw-ml-0.5 tw-flex tw-items-center tw-gap-1.5",
      valueClasses: "tw-leading-5",
    };
  }

  return {
    color: isPositiveProgressing
      ? "tw-text-emerald-500 tw-bg-emerald-500/10 tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-solid tw-border-emerald-500/20"
      : "tw-text-rose-500 tw-bg-rose-500/10 tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-solid tw-border-rose-500/20",
    arrowColor: MUTED_TEXT_CLASS_NAME,
    wrapperClasses: "tw-ml-0.5 tw-flex tw-items-center tw-gap-2",
    valueClasses: "tw-tracking-tight",
  };
};

const getVisualClasses = (
  subtle: boolean,
  compact: boolean,
  isPositiveProgressing: boolean,
  visualVariant: NonNullable<DropVoteProgressingProps["visualVariant"]>
): DropVoteProgressingVisualClasses => {
  const baseClasses = getBaseVisualClasses(
    subtle,
    compact,
    isPositiveProgressing
  );

  if (visualVariant !== "memes") {
    return baseClasses;
  }

  return {
    ...baseClasses,
    color: isPositiveProgressing ? "tw-text-emerald-300" : "tw-text-rose-400",
    arrowColor: MUTED_TEXT_CLASS_NAME,
    valueClasses: "tw-leading-5 tw-tracking-identity",
  };
};

export default function DropVoteProgressing({
  current,
  projected,
  projectedLabel,
  subtle = false,
  compact = false,
  tooltipLabel = "Projected vote count at decision time",
  numberFont = "mono",
  numberSize = "sm",
  numberWeight = "bold",
  visualVariant = "default",
}: DropVoteProgressingProps): ReactElement | null {
  if (typeof current !== "number" || typeof projected !== "number") {
    return null;
  }

  const isProgressing = current !== projected;

  if (!isProgressing) {
    return null;
  }

  const isPositiveProgressing = current < projected;
  const { color, arrowColor, wrapperClasses, valueClasses } = getVisualClasses(
    subtle,
    compact,
    isPositiveProgressing,
    visualVariant
  );

  let numberSizeClass = "tw-text-sm";
  if (numberSize === "body") {
    numberSizeClass = "tw-text-body tw-leading-5";
  } else if (numberSize === "mobile-xs") {
    numberSizeClass = "tw-text-xs sm:tw-text-sm";
  }
  const numberTypographyClass =
    compact || numberFont === "sans" ? "tw-tabular-nums" : "tw-font-mono";
  const numberWeightClass =
    numberWeight === "semibold" ? "tw-font-semibold" : "tw-font-bold";

  return (
    <>
      <span
        className={wrapperClasses}
        style={{
          animationDuration: "2s",
        }}
        data-tooltip-id={`drop-vote-progress-${current}-${projected}`}
      >
        <FontAwesomeIcon
          icon={faArrowRight}
          className={`tw-flex-shrink-0 ${compact ? "tw-size-2" : "tw-size-2.5"} ${arrowColor}`}
        />
        <span
          className={`${valueClasses} ${color} ${numberSizeClass} ${numberTypographyClass} ${numberWeightClass}`}
        >
          {projectedLabel ?? formatNumberWithCommas(projected)}
        </span>
      </span>
      <Tooltip
        id={`drop-vote-progress-${current}-${projected}`}
        place="top"
        offset={8}
        opacity={1}
        style={{
          padding: "4px 8px",
          background: "#37373E",
          color: "white",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        {tooltipLabel}: {formatNumberWithCommas(projected)}
      </Tooltip>
    </>
  );
}
