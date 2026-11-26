"use client";

import "@/i18n/namespaces/wave-sidebar";
import React, { useEffect, useState } from "react";
import { PinIcon } from "@/components/common/icons/PinIcon";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import IconButton from "@/components/utils/button/IconButton";
import type { IconButtonLayout } from "@/components/utils/button/iconButtonLayouts";
import { useSidebarWavePin } from "@/hooks/useSidebarWavePin";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface BrainLeftSidebarWavePinProps {
  readonly waveId: string;
  readonly isPinned: boolean;
  readonly compact?: boolean | undefined;
  readonly className?: string | undefined;
}

interface MaxLimitTooltipRequest {
  readonly waveId: string;
  readonly pinnedIdsKey: string;
}

const BrainLeftSidebarWavePin: React.FC<BrainLeftSidebarWavePinProps> = ({
  waveId,
  isPinned,
  compact = false,
  className,
}) => {
  const {
    canManage,
    isProcessing: isCurrentlyProcessing,
    canPinCurrentWave,
    pinnedIdsKey,
    pinLimit,
    togglePin,
  } = useSidebarWavePin(waveId, isPinned);
  const isTouchDevice = useIsTouchDevice();
  const locale = useBrowserLocale();
  const [maxLimitTooltipRequest, setMaxLimitTooltipRequest] =
    useState<MaxLimitTooltipRequest | null>(null);

  const showMaxLimitTooltip =
    maxLimitTooltipRequest?.waveId === waveId &&
    maxLimitTooltipRequest.pinnedIdsKey === pinnedIdsKey &&
    !isPinned &&
    !canPinCurrentWave;

  // Auto-hide tooltip after 3 seconds with proper cleanup
  useEffect(() => {
    if (!showMaxLimitTooltip) return;
    const timer = setTimeout(() => setMaxLimitTooltipRequest(null), 3000);
    return () => clearTimeout(timer);
  }, [showMaxLimitTooltip]);

  if (!canManage) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const result = await togglePin();
    if (result === "limit") setMaxLimitTooltipRequest({ waveId, pinnedIdsKey });
    if (result === "updated") setMaxLimitTooltipRequest(null);
  };

  // Desktop rows reveal the pin on row hover or direct keyboard focus.
  const getOpacityClass = () => {
    if (isTouchDevice) return "tw-opacity-100";
    return "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 focus-visible:tw-opacity-100 touch-only:tw-opacity-100";
  };
  const opacityClass = getOpacityClass();

  // Only show max-limit guidance for the keyed request window after a failed pin.
  const getTooltipContent = () => {
    if (isPinned) return t(locale, "waves.sidebar.pinControl.unpinTooltip");
    if (canPinCurrentWave)
      return t(locale, "waves.sidebar.pinControl.pinTooltip");
    if (showMaxLimitTooltip) {
      return t(locale, "waves.sidebar.pinControl.limitTooltip", {
        count: pinLimit,
      });
    }
    return null;
  };
  const tooltipContent = getTooltipContent();

  const getAriaLabel = () => {
    return t(
      locale,
      isPinned
        ? "waves.sidebar.pinControl.unpinAriaLabel"
        : "waves.sidebar.pinControl.pinAriaLabel"
    );
  };

  const positionClasses = compact || isTouchDevice ? "" : "-tw-mr-2 tw-mt-0.5";
  const getPinLayout = (): IconButtonLayout | undefined => {
    if (isTouchDevice) return undefined;
    return compact ? "pin-reveal" : "pin";
  };
  const iconSizeClasses = compact ? "tw-size-3.5" : "tw-size-4";

  return (
    <>
      <IconButton
        type="button"
        onClick={handleClick}
        disabled={isCurrentlyProcessing}
        layout={getPinLayout()}
        size={44}
        variant={isTouchDevice && !isPinned ? "muted" : "ghost"}
        className={`${positionClasses} ${opacityClass} ${className ?? ""}`}
        aria-label={getAriaLabel()}
        aria-pressed={isPinned}
        data-tooltip-id={`wave-pin-${waveId}`}
        data-tooltip-content={tooltipContent}
      >
        <PinIcon
          className={`${iconSizeClasses} tw-flex-shrink-0 ${isPinned ? "tw-rotate-[-45deg]" : ""}`}
          filled={isPinned}
        />
      </IconButton>
      {/* Portalled so the sticky list filter and row stacking contexts cannot
          cover it. Touch devices have no hover, so they skip the tooltip. */}
      {!isTouchDevice && tooltipContent !== null && (
        <BodyPortalTooltip
          id={`wave-pin-${waveId}`}
          place="top"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
        />
      )}
    </>
  );
};

export default BrainLeftSidebarWavePin;
