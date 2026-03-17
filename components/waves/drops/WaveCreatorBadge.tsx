"use client";

import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";

interface WaveCreatorBadgeProps {
  readonly tooltipId?: string | undefined;
  readonly onBadgeClick?: (() => void) | undefined;
}

export const WaveCreatorBadge: React.FC<WaveCreatorBadgeProps> = ({
  tooltipId = "wave-creator-badge",
  onBadgeClick,
}) => {
  const isMobile = useIsMobileDevice();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

  const dataTooltipId = !isMobile ? uniqueTooltipId : undefined;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTooltipOpen(false);
          onBadgeClick?.();
        }}
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className="tw-inline-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-white/15 tw-bg-white/5 tw-text-white/60 tw-outline-none tw-ring-0 tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white/70"
        aria-label="View created waves"
        {...(dataTooltipId && { "data-tooltip-id": dataTooltipId })}
      >
        <FontAwesomeIcon
          icon={faWater}
          className="tw-h-2.5 tw-w-2.5 tw-flex-shrink-0 tw-text-current"
        />
      </button>
      {!isMobile && (
        <Tooltip
          id={uniqueTooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
          isOpen={isTooltipOpen}
        >
          <span className="tw-text-xs">View created waves</span>
        </Tooltip>
      )}
    </>
  );
};
