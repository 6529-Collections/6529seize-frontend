import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface WaveDropsTypingIndicatorProps {
  readonly typingMessage: string | null;
}

export const WaveDropsTypingIndicator: React.FC<
  WaveDropsTypingIndicatorProps
> = ({ typingMessage }) => {
  const visibilityClass = typingMessage
    ? "tw-opacity-100 tw-visible"
    : "tw-opacity-0 tw-invisible";

  return (
    <div
      className={`tw-absolute tw-bottom-0 tw-left-0 tw-z-10 tw-inset-x-0 tw-mr-2 tw-px-4 tw-pb-1.5 tw-pt-1.5 tw-flex tw-items-center tw-gap-x-2 tw-transition-opacity tw-duration-300 tw-ease-in-out tw-bg-gradient-to-t tw-from-iron-950 tw-via-iron-950/90 tw-to-transparent ${visibilityClass}`}
    >
      <div className="tw-flex tw-items-center tw-gap-x-0.5">
        <FontAwesomeIcon
          icon={faCircle}
          className="tw-text-iron-300 tw-h-1 tw-w-1 tw-animate-pulse"
        />
        <FontAwesomeIcon
          icon={faCircle}
          className="tw-text-iron-400 tw-h-1 tw-w-1 tw-animate-pulse"
          style={{ animationDelay: "150ms" }}
        />
        <FontAwesomeIcon
          icon={faCircle}
          className="tw-text-iron-500 tw-h-1 tw-w-1 tw-animate-pulse"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="tw-text-xs tw-text-iron-400">{typingMessage}</span>
    </div>
  );
};
