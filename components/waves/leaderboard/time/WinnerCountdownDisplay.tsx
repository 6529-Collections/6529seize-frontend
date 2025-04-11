import React from "react";
import { TimeLeft } from "../../../../helpers/waves/time.utils";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CompactTimeCountdown } from "./CompactTimeCountdown";

interface WinnerCountdownDisplayProps {
  readonly timeLeft: TimeLeft;
  readonly label?: string;
  readonly showLabelAtWidth?: number;
  readonly className?: string;
}

/**
 * Display component for winner countdown that includes icon, label, and time
 * Used in tab headers and other UI elements to show time until next winner announcement
 */
export const WinnerCountdownDisplay: React.FC<WinnerCountdownDisplayProps> = ({
  timeLeft,
  label = "Next winner:",
  showLabelAtWidth = 700,
  className = ""
}) => {
  return (
    <div
      className={`tw-@container tw-hidden md:tw-flex tw-items-center tw-gap-1.5 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-border-emerald-600/20 tw-flex-shrink-0 ${className}`}
    >
      <div className="tw-flex-shrink-0 tw-text-emerald-500">
        <FontAwesomeIcon
          icon={faClock}
          className="tw-size-3.5 -tw-mt-0.5"
        />
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <span className={`tw-text-xs tw-text-emerald-500 tw-font-medium tw-hidden @[${showLabelAtWidth}px]:tw-flex`}>
          {label}
        </span>
        <CompactTimeCountdown timeLeft={timeLeft} />
      </div>
    </div>
  );
};