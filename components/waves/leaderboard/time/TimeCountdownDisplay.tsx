import React from "react";
import { TimeLeft } from "../../../../helpers/waves/time.utils";

interface TimeCountdownDisplayProps {
  readonly timeLeft: TimeLeft;
  readonly size?: "small" | "regular";
  readonly showLabels?: boolean;
  readonly compact?: boolean;
}

/**
 * Reusable component for displaying time countdown
 */
export const TimeCountdownDisplay: React.FC<TimeCountdownDisplayProps> = ({
  timeLeft,
  size = "regular",
  showLabels = true,
  compact = false,
}) => {
  // Size classes based on the size prop
  const numberSize =
    size === "small"
      ? "tw-text-sm md:tw-text-base [@container]:tw-text-base [@container_(max-width:80px)]:tw-text-sm"
      : "tw-text-base md:tw-text-xl [@container]:tw-text-xl [@container_(max-width:80px)]:tw-text-base";

  // If compact is true, show a simplified version
  if (compact) {
    return (
      <span className="tw-text-xs tw-font-semibold tw-text-white/80">
        {timeLeft.days}
        <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
          DAYS
        </span>{" "}
        {timeLeft.hours}
        <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
          HOURS
        </span>{" "}
        {timeLeft.minutes}
        <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
          MIN
        </span>
      </span>
    );
  }

  return (
    <div className="tw-flex tw-items-center tw-gap-1.5">
      {/* Days */}
      <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
        <div className="tw-flex tw-justify-center tw-items-baseline">
          <span className={`${numberSize} tw-font-medium tw-text-white/90 tw-tracking-tight`}>
            {timeLeft.days}
          </span>
          {showLabels && (
            <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
              {timeLeft.days === 1 ? "day" : "days"}
            </span>
          )}
        </div>
      </div>
      
      {/* Hours */}
      <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
        <div className="tw-flex tw-justify-center tw-items-baseline">
          <span className={`${numberSize} tw-font-medium tw-text-white/90 tw-tracking-tight`}>
            {timeLeft.hours}
          </span>
          {showLabels && (
            <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
              {timeLeft.hours === 1 ? "hr" : "hrs"}
            </span>
          )}
        </div>
      </div>
      
      {/* Minutes */}
      <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
        <div className="tw-flex tw-justify-center tw-items-baseline">
          <span className={`${numberSize} tw-font-medium tw-text-white/90 tw-tracking-tight`}>
            {timeLeft.minutes}
          </span>
          {showLabels && (
            <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
              min
            </span>
          )}
        </div>
      </div>
      
      {/* Seconds */}
      <div className="tw-flex-1 tw-@container tw-group tw-bg-gradient-to-br tw-from-primary-300/5 tw-to-primary-400/5 tw-backdrop-blur-sm tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary-300/10 tw-whitespace-nowrap">
        <div className="tw-flex tw-justify-center tw-items-baseline">
          <span className={`${numberSize} tw-font-medium tw-text-white/90 tw-tracking-tight`}>
            {timeLeft.seconds}
          </span>
          {showLabels && (
            <span className="tw-ml-1 tw-text-[10px] md:tw-text-xs tw-uppercase tw-tracking-wide tw-text-white/40 tw-font-medium">
              sec
            </span>
          )}
        </div>
      </div>
    </div>
  );
};