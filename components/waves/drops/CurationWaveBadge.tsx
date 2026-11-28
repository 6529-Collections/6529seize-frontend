"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import type { CurationPreviewHoverLayout } from "./curation-preview/types";
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
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const isClientHydrated = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const [hoverLayout, setHoverLayout] = useState<CurationPreviewHoverLayout>();
  const updateExpansionLayout = useCallback(() => {
    const rect = badgeRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewport = globalThis.visualViewport;
    const viewportRight =
      (viewport?.offsetLeft ?? 0) + (viewport?.width ?? globalThis.innerWidth);
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportBottom =
      viewportTop + (viewport?.height ?? globalThis.innerHeight);
    const spaceAbove = rect.top - viewportTop;
    const spaceBelow = viewportBottom - rect.bottom;
    setHoverLayout({
      canExpandSideways: viewportRight - rect.left - 10 >= 720,
      placement: spaceAbove >= spaceBelow ? "top" : "bottom",
      // Reserve the 10px anchor gap, 8px viewport gutter and 2px card border.
      maxHeight: Math.max(0, Math.floor(Math.max(spaceAbove, spaceBelow) - 20)),
    });
  }, []);
  useEffect(() => {
    globalThis.addEventListener("resize", updateExpansionLayout);
    globalThis.visualViewport?.addEventListener(
      "resize",
      updateExpansionLayout
    );
    return () => {
      globalThis.removeEventListener("resize", updateExpansionLayout);
      globalThis.visualViewport?.removeEventListener(
        "resize",
        updateExpansionLayout
      );
    };
  }, [updateExpansionLayout]);
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
  const usesSheetPreview =
    isClientHydrated && (hasTouchScreen || isMobileLayoutViewport);

  const previewCard = (
    <CurationWavePreviewCard
      waveId={waveId}
      profileIdentity={profileIdentity}
      fallbackName={normalizedWaveName}
      fallbackPfp={normalizedWavePfp}
      variant={usesSheetPreview ? "sheet" : "hovercard"}
      hoverLayout={hoverLayout}
    />
  );

  const button = (
    <AuthorBadgeButton
      ref={badgeRef}
      onMouseEnter={updateExpansionLayout}
      onFocus={updateExpansionLayout}
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
          ariaLabel={`Wave details for ${waveLabel}`}
          isOpen={isMobilePreviewOpen}
          onClose={() => setIsMobilePreviewOpen(false)}
          noPadding
          showScrollbar
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
      placement={hoverLayout?.placement ?? "bottom"}
      alignment="start"
      delayShow={500}
      delayHide={0}
      offset={10}
    >
      {button}
    </HoverCard>
  );
};
