"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { CurationWavePreviewCard } from "./CurationWavePreviewCard";

type CurationWaveBadgeSize = "default" | "compact";

interface CurationWaveBadgeProps {
  readonly waveId: string;
  readonly tooltipId?: string | undefined;
  readonly onBadgeClick?: (() => void) | undefined;
  readonly size?: CurationWaveBadgeSize | undefined;
  readonly profileIdentity?: string | null | undefined;
  readonly waveName?: string | null | undefined;
  readonly wavePfp?: string | null | undefined;
}

const BADGE_SIZE_STYLES: Record<
  CurationWaveBadgeSize,
  {
    readonly buttonClassName: string;
    readonly fallbackIconClassName: string;
    readonly imageSize: number;
  }
> = {
  default: {
    buttonClassName: "tw-h-5 tw-w-5",
    fallbackIconClassName: "tw-h-2.5 tw-w-2.5",
    imageSize: 20,
  },
  compact: {
    buttonClassName: "tw-h-[18px] tw-w-[18px]",
    fallbackIconClassName: "tw-h-2 tw-w-2",
    imageSize: 18,
  },
};

const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
};

const subscribeToClientRender = () => () => {};
const getClientRenderSnapshot = () => true;
const getServerRenderSnapshot = () => false;

export const CurationWaveBadge: React.FC<CurationWaveBadgeProps> = ({
  waveId,
  tooltipId = "wave-creator-badge",
  onBadgeClick,
  size = "default",
  profileIdentity,
  waveName,
  wavePfp,
}) => {
  const { hasTouchScreen } = useDeviceInfo();
  const isClientHydrated = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const normalizedWaveName = getTrimmedText(waveName);
  const normalizedWavePfp = getTrimmedText(wavePfp);
  const waveImageSrc = normalizedWavePfp
    ? getScaledImageUri(normalizedWavePfp, ImageScale.W_AUTO_H_50)
    : null;
  const waveLabel = normalizedWaveName ?? "Featured wave";
  const ariaLabel = normalizedWaveName
    ? `Open ${normalizedWaveName}`
    : "Open featured wave";
  const sizeStyles = BADGE_SIZE_STYLES[size];
  const buttonClassName = `tw-inline-flex ${sizeStyles.buttonClassName} tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/15 tw-bg-white/5 tw-text-iron-200 tw-outline-none tw-ring-0 tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-100`;
  const showImage = waveImageSrc !== null && failedImageSrc !== waveImageSrc;
  const imageSrc = showImage ? waveImageSrc : null;
  const usesSheetPreview = isClientHydrated && hasTouchScreen;

  const previewCard = (
    <CurationWavePreviewCard
      waveId={waveId}
      profileIdentity={profileIdentity}
      fallbackName={normalizedWaveName}
      fallbackPfp={normalizedWavePfp}
      variant={usesSheetPreview ? "sheet" : "hovercard"}
    />
  );

  const button = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (usesSheetPreview) {
          setIsMobilePreviewOpen(true);
          return;
        }

        onBadgeClick?.();
      }}
      className={buttonClassName}
      aria-label={ariaLabel}
      aria-haspopup={usesSheetPreview ? "dialog" : undefined}
      aria-expanded={usesSheetPreview ? isMobilePreviewOpen : undefined}
      data-wave-id={waveId}
      data-tooltip-id={tooltipId}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          width={sizeStyles.imageSize}
          height={sizeStyles.imageSize}
          unoptimized
          className="tw-block tw-object-cover"
          style={{
            width: `${sizeStyles.imageSize}px`,
            height: `${sizeStyles.imageSize}px`,
            objectFit: "cover",
          }}
          onError={() => setFailedImageSrc(imageSrc)}
        />
      ) : (
        <FontAwesomeIcon
          icon={faWater}
          className={`${sizeStyles.fallbackIconClassName} tw-flex-shrink-0 tw-text-current`}
          aria-hidden="true"
        />
      )}
    </button>
  );

  if (usesSheetPreview) {
    return (
      <>
        {button}
        <MobileWrapperDialog
          isOpen={isMobilePreviewOpen}
          onClose={() => setIsMobilePreviewOpen(false)}
          noPadding
          showScrollbar
          tall
          zIndexClassName="tw-z-[1200]"
        >
          {previewCard}
        </MobileWrapperDialog>
      </>
    );
  }

  return (
    <HoverCard
      content={previewCard}
      ariaLabel={`Wave details for ${waveLabel}`}
      placement="auto"
      delayShow={500}
      delayHide={0}
      offset={10}
    >
      {button}
    </HoverCard>
  );
};
