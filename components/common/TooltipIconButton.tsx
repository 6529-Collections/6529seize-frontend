"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useState } from "react";

interface TooltipIconButtonProps {
  readonly icon: IconDefinition;
  readonly tooltipText: string;
  readonly iconClassName?: string;
  readonly tooltipWidth?: string;
  readonly tooltipPosition?: "top" | "bottom" | "left" | "right";
  readonly onClick?: (e: React.MouseEvent) => void;
}

export default function TooltipIconButton({
  icon,
  tooltipText,
  iconClassName = "tw-text-iron-400 tw-size-4",
  tooltipWidth = "tw-w-72",
  tooltipPosition = "top",
  onClick,
}: TooltipIconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getPositionClasses = () => {
    switch (tooltipPosition) {
      case "top":
        return "tw-bottom-6 tw-left-1/2 -tw-translate-x-1/2";
      case "bottom":
        return "tw-top-6 tw-left-1/2 -tw-translate-x-1/2";
      case "left":
        return "tw-right-6 tw-top-1/2 -tw-translate-y-1/2";
      case "right":
        return "tw-left-6 tw-top-1/2 -tw-translate-y-1/2";
    }
  };

  return (
    <div
      className="tw-relative tw-cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}>
      <FontAwesomeIcon icon={icon} className={iconClassName} />
      {showTooltip && (
        <div
          className={`tw-absolute ${getPositionClasses()} ${tooltipWidth} tw-p-3 tw-bg-iron-900 tw-text-iron-100 tw-text-xs tw-rounded-lg tw-shadow-lg tw-z-10`}>
          {tooltipText}
        </div>
      )}
    </div>
  );
}
