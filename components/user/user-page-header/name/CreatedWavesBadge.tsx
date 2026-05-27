"use client";

import React, { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import {
  TOOLTIP_STYLES,
  closeAllCustomTooltips,
} from "@/helpers/tooltip.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { useWaveCreatorPreviewModal } from "@/hooks/useWaveCreatorPreviewModal";
import { WaveCreatorPreviewModal } from "@/components/waves/drops/WaveCreatorPreviewModal";
import type { WaveCreatorPreviewUser } from "@/components/waves/drops/waveCreatorPreview.types";

interface CreatedWavesBadgeProps {
  readonly user: WaveCreatorPreviewUser;
  readonly tooltipId?: string | undefined;
}

export default function CreatedWavesBadge({
  user,
  tooltipId = "profile-created-waves-badge",
}: CreatedWavesBadgeProps) {
  const isMobile = useIsMobileDevice();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const showTooltip = isMobile === false;
  const dataTooltipId = showTooltip ? uniqueTooltipId : undefined;
  const { isModalOpen, handleBadgeClick, handleModalClose } =
    useWaveCreatorPreviewModal();

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTooltipOpen(false);
          closeAllCustomTooltips();
          handleBadgeClick();
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
          aria-hidden="true"
        />
      </button>
      {showTooltip && (
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
      <WaveCreatorPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={user}
      />
    </>
  );
}
