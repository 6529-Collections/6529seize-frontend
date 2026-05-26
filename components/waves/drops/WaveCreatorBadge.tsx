"use client";

import React, { useId, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

interface WaveCreatorBadgeProps {
  readonly tooltipId?: string | undefined;
  readonly onBadgeClick?: (() => void) | undefined;
  readonly size?: "default" | "compact" | undefined;
  readonly waveName?: string | null | undefined;
  readonly wavePfp?: string | null | undefined;
  readonly showWaveDetails?: boolean | undefined;
}

const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

export const WaveCreatorBadge: React.FC<WaveCreatorBadgeProps> = ({
  tooltipId = "wave-creator-badge",
  onBadgeClick,
  size = "default",
  waveName,
  wavePfp,
  showWaveDetails = false,
}) => {
  const isMobile = useIsMobileDevice();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const showTooltip = isMobile === false;
  const dataTooltipId = showTooltip ? uniqueTooltipId : undefined;
  const normalizedWaveName = getTrimmedText(waveName);
  const normalizedWavePfp = getTrimmedText(wavePfp);
  const waveImageSrc = normalizedWavePfp
    ? resolveIpfsUrlSync(normalizedWavePfp)
    : null;
  const shouldShowWaveDetails = showWaveDetails && size !== "compact";
  const displayWaveName = normalizedWaveName ?? "profile wave";
  const tooltipContent = shouldShowWaveDetails
    ? displayWaveName
    : "View created waves";
  const ariaLabel = shouldShowWaveDetails
    ? `Open ${displayWaveName}`
    : "View created waves";
  const buttonSizeClassName =
    size === "compact" ? "tw-h-[18px] tw-w-[18px]" : "tw-h-5 tw-w-5";
  const iconSizeClassName =
    size === "compact" ? "tw-h-[9px] tw-w-[9px]" : "tw-h-2.5 tw-w-2.5";
  const buttonClassName = shouldShowWaveDetails
    ? `tw-inline-flex ${buttonSizeClassName} tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/15 tw-bg-white/5 tw-text-iron-200 tw-outline-none tw-ring-0 tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-100`
    : `tw-inline-flex ${buttonSizeClassName} tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-white/15 tw-bg-white/5 tw-text-white/60 tw-outline-none tw-ring-0 tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white/70`;
  const badgeContent = (() => {
    if (!shouldShowWaveDetails) {
      return (
        <FontAwesomeIcon
          icon={faWater}
          className={`${iconSizeClassName} tw-flex-shrink-0 tw-text-current`}
        />
      );
    }

    const imageSrc = waveImageSrc;

    if (!imageSrc || failedImageSrc === imageSrc) {
      return (
        <FontAwesomeIcon
          icon={faWater}
          className={`${iconSizeClassName} tw-flex-shrink-0 tw-text-current`}
          aria-hidden="true"
        />
      );
    }

    return (
      <Image
        src={imageSrc}
        alt=""
        width={20}
        height={20}
        unoptimized
        className="tw-block tw-object-cover"
        onError={() => setFailedImageSrc(imageSrc)}
      />
    );
  })();

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
        className={buttonClassName}
        aria-label={ariaLabel}
        {...(dataTooltipId && { "data-tooltip-id": dataTooltipId })}
      >
        {badgeContent}
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
          <span className="tw-text-xs">{tooltipContent}</span>
        </Tooltip>
      )}
    </>
  );
};
