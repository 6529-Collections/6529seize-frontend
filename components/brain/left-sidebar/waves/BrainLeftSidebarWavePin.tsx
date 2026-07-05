"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { Tooltip } from "react-tooltip";
import { useAuth } from "@/components/auth/Auth";
import {
  usePinnedWavesServer,
  MAX_PINNED_WAVES,
} from "@/hooks/usePinnedWavesServer";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { isTouchFirstEnvironment } from "@/helpers/touch-first.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

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

const WavePinIcon = ({
  className,
  filled,
}: {
  readonly className: string;
  readonly filled: boolean;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </svg>
);

const BrainLeftSidebarWavePin: React.FC<BrainLeftSidebarWavePinProps> = ({
  waveId,
  isPinned,
  compact = false,
  className,
}) => {
  const { waves } = useMyStream();
  const { pinnedIds, isOperationInProgress, canPinWave } =
    usePinnedWavesServer();
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [maxLimitTooltipRequest, setMaxLimitTooltipRequest] =
    useState<MaxLimitTooltipRequest | null>(null);

  // Check if this specific wave operation is in progress
  const isCurrentlyProcessing = isOperationInProgress(waveId);
  const pinnedIdsKey = useMemo(() => pinnedIds.join("|"), [pinnedIds]);
  const canPinCurrentWave = useMemo(
    () => canPinWave(waveId),
    [canPinWave, waveId]
  );
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

  // Detect touch-first devices on component mount (hybrid touch laptops
  // keep the desktop hover behavior).
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(isTouchFirstEnvironment());
    };

    checkTouch();
    globalThis.addEventListener("resize", checkTouch);

    return () => {
      globalThis.removeEventListener("resize", checkTouch);
    };
  }, []);

  if (!connectedProfile?.handle || activeProfileProxy) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Don't proceed if operation is already in progress
    if (isCurrentlyProcessing) {
      return;
    }

    try {
      if (isPinned) {
        waves.removePinnedWave(waveId);
        setMaxLimitTooltipRequest(null);
      } else {
        const canPin = canPinWave(waveId);

        if (canPin) {
          waves.addPinnedWave(waveId);
        } else {
          setMaxLimitTooltipRequest({ waveId, pinnedIdsKey });
          setToast({
            type: "error",
            message: `Maximum ${MAX_PINNED_WAVES} pinned waves allowed`,
          });
        }
      }
    } catch (error) {
      console.error("Error updating wave pin status:", error);

      setToast({
        type: "error",
        title: isPinned
          ? "Couldn't unpin this wave."
          : "Couldn't pin this wave.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    }
  };

  // Desktop rows reveal the pin on row hover or direct keyboard focus.
  const getOpacityClass = () => {
    if (isTouchDevice) return "tw-opacity-100";
    return "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100 focus-visible:tw-opacity-100";
  };
  const opacityClass = getOpacityClass();

  // Only show max-limit guidance for the keyed request window after a failed pin.
  const getTooltipContent = () => {
    if (isPinned) return "Unpin";
    if (canPinCurrentWave) return "Pin";
    if (showMaxLimitTooltip) {
      return `Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`;
    }
    return null;
  };
  const tooltipContent = getTooltipContent();

  const getButtonStyles = () => {
    if (isPinned) {
      return "tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-iron-100 active:tw-bg-transparent";
    }
    return "tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-iron-100 active:tw-bg-iron-700";
  };

  const getAriaLabel = () => {
    return isPinned ? "Unpin wave" : "Pin wave";
  };

  const positionClasses = compact ? "" : "-tw-mr-2 tw-mt-0.5";
  const getSizeClasses = () => {
    if (!compact) return "tw-size-7 sm:tw-size-6";
    if (isTouchDevice) return "tw-size-7";
    return "tw-h-7 tw-w-0 desktop-hover:group-hover:tw-w-7 focus-visible:tw-w-7";
  };
  const sizeClasses = getSizeClasses();
  const iconSizeClasses = compact ? "tw-size-3.5" : "tw-size-4";

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isCurrentlyProcessing}
        className={`${positionClasses} tw-flex ${sizeClasses} tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-md tw-border-0 tw-transition-all tw-duration-200 ${opacityClass} ${getButtonStyles()} ${className ?? ""} ${isCurrentlyProcessing ? "tw-cursor-not-allowed tw-opacity-50" : ""}`}
        aria-label={getAriaLabel()}
        data-tooltip-id={`wave-pin-${waveId}`}
        data-tooltip-content={tooltipContent}
      >
        <WavePinIcon
          className={`${iconSizeClasses} tw-flex-shrink-0 ${isPinned ? "tw-rotate-[-45deg]" : ""}`}
          filled={isPinned}
        />
      </button>
      <Tooltip
        id={`wave-pin-${waveId}`}
        place="top"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={TOOLTIP_STYLES}
      />
    </>
  );
};

export default BrainLeftSidebarWavePin;
