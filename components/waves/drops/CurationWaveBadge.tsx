"use client";

import React, { useId, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

interface CurationWaveBadgeProps {
  readonly waveId: string;
  readonly tooltipId?: string | undefined;
  readonly onBadgeClick?: (() => void) | undefined;
  readonly size?: "default" | "compact" | undefined;
  readonly waveName?: string | null | undefined;
  readonly wavePfp?: string | null | undefined;
}

const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

export const CurationWaveBadge: React.FC<CurationWaveBadgeProps> = ({
  waveId,
  tooltipId = "wave-creator-badge",
  onBadgeClick,
  size = "default",
  waveName,
  wavePfp,
}) => {
  const isMobile = useIsMobileDevice();
  const id = useId();
  const uniqueTooltipId = `${tooltipId}-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const showTooltip = isMobile === false;
  const dataTooltipId = showTooltip ? uniqueTooltipId : undefined;
  const normalizedWaveName = getTrimmedText(waveName);
  const normalizedWavePfp = getTrimmedText(wavePfp);
  const waveImageSrc = normalizedWavePfp
    ? getScaledImageUri(normalizedWavePfp, ImageScale.W_AUTO_H_50)
    : null;
  const tooltipContent = normalizedWaveName ?? "Featured wave";
  const ariaLabel = normalizedWaveName
    ? `Open ${normalizedWaveName}`
    : "Open featured wave";
  const buttonSizeClassName =
    size === "compact" ? "tw-h-[18px] tw-w-[18px]" : "tw-h-5 tw-w-5";
  const fallbackIconClassName =
    size === "compact" ? "tw-h-2 tw-w-2" : "tw-h-2.5 tw-w-2.5";
  const buttonClassName = `tw-inline-flex ${buttonSizeClassName} tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/15 tw-bg-white/5 tw-text-iron-200 tw-outline-none tw-ring-0 tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-100`;
  const showImage = waveImageSrc !== null && failedImageSrc !== waveImageSrc;
  const imageSrc = showImage ? waveImageSrc : null;
  const imageSize = size === "compact" ? 18 : 20;

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
        data-wave-id={waveId}
        {...(dataTooltipId && { "data-tooltip-id": dataTooltipId })}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            width={imageSize}
            height={imageSize}
            unoptimized
            className="tw-block tw-object-cover"
            style={{
              width: `${imageSize}px`,
              height: `${imageSize}px`,
              objectFit: "cover",
            }}
            onError={() => setFailedImageSrc(imageSrc)}
          />
        ) : (
          <FontAwesomeIcon
            icon={faWater}
            className={`${fallbackIconClassName} tw-flex-shrink-0 tw-text-current`}
            aria-hidden="true"
          />
        )}
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
