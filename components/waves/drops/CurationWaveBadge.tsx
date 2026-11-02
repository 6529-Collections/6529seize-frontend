"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import AuthorBadgeButton, {
  type AuthorBadgeSize,
} from "@/components/common/profile/AuthorBadgeButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { CurationWavePreviewCard } from "./CurationWavePreviewCard";

interface CurationWaveBadgeProps {
  readonly waveId: string;
  readonly tooltipId?: string | undefined;
  readonly onBadgeClick?: (() => void) | undefined;
  readonly size?: AuthorBadgeSize | undefined;
  readonly profileIdentity?: string | null | undefined;
  readonly waveName?: string | null | undefined;
  readonly wavePfp?: string | null | undefined;
}

const IMAGE_SIZE: Record<AuthorBadgeSize, number> = {
  default: 20,
  compact: 18,
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
  const imageSize = IMAGE_SIZE[size];
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
    <AuthorBadgeButton
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (usesSheetPreview) {
          setIsMobilePreviewOpen(true);
          return;
        }

        onBadgeClick?.();
      }}
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
          width={imageSize}
          height={imageSize}
          unoptimized
          className="tw-block tw-rounded-full tw-object-cover"
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
          className="tw-flex-shrink-0 tw-text-current"
          aria-hidden="true"
        />
      )}
    </AuthorBadgeButton>
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
          showHeaderCloseButton={false}
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
