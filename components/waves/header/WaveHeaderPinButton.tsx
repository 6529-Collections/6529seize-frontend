"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useAuth } from "@/components/auth/Auth";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import {
  usePinnedWavesServer,
  MAX_PINNED_WAVES,
} from "@/hooks/usePinnedWavesServer";

interface WaveHeaderPinButtonProps {
  readonly waveId: string;
}

// Constants to reduce string duplication
const PIN_ACTIONS = {
  PIN: "Pin wave",
  UNPIN: "Unpin wave",
} as const;

const WaveHeaderPinButton: React.FC<WaveHeaderPinButtonProps> = ({
  waveId,
}) => {
  const { waves } = useMyStream();
  const { isAnnouncementsWave, isLoaded: isSettingsLoaded } =
    useSeizeSettings();
  const { pinnedIds, isOperationInProgress, canPinWave } =
    usePinnedWavesServer();
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const [showMaxLimitTooltip, setShowMaxLimitTooltip] = useState(false);

  const isCurrentlyProcessing = isOperationInProgress(waveId);
  const isPinned = pinnedIds.includes(waveId);
  const isOfficialWave = useMemo(
    () => waves.list.some((wave) => wave.id === waveId && wave.isOfficial),
    [waves.list, waveId]
  );
  const canPinCurrentWave = useMemo(
    () => canPinWave(waveId),
    [canPinWave, waveId]
  );

  // Helper function to hide tooltip
  const hideTooltip = useCallback(() => setShowMaxLimitTooltip(false), []);

  // Helper function to show error toast
  const showErrorToast = useCallback(
    (message: string) => {
      setToast({ type: "error", message });
    },
    [setToast]
  );

  // Memoize tooltip content to prevent unnecessary re-calculations
  const tooltipContent = useMemo(() => {
    if (isPinned) return PIN_ACTIONS.UNPIN;
    if (canPinCurrentWave) return PIN_ACTIONS.PIN;
    return `Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`;
  }, [isPinned, canPinCurrentWave]);

  const buttonStyles = useMemo(() => {
    if (isPinned) {
      return "tw-border-0 tw-bg-iron-800 tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-white/10 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white";
    }
    return "tw-border-0 tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 tw-bg-transparent active:tw-bg-iron-700";
  }, [isPinned]);

  const ariaLabel = useMemo(() => {
    return isPinned ? PIN_ACTIONS.UNPIN : PIN_ACTIONS.PIN;
  }, [isPinned]);

  // Reset tooltip state when pinned state changes
  useEffect(() => {
    hideTooltip();
  }, [isPinned, hideTooltip]);

  // Also reset tooltip state when pinnedIds array changes
  useEffect(() => {
    if (canPinCurrentWave) {
      hideTooltip();
    }
  }, [pinnedIds, canPinCurrentWave, hideTooltip]);

  // Auto-hide tooltip after 3 seconds with proper cleanup
  useEffect(() => {
    if (!showMaxLimitTooltip) return;
    const timer = setTimeout(hideTooltip, 3000);
    return () => clearTimeout(timer);
  }, [showMaxLimitTooltip, hideTooltip]);

  // Don't render if user is not authenticated or using proxy
  if (!connectedProfile?.handle || activeProfileProxy) {
    return null;
  }

  if (isOfficialWave) {
    return null;
  }

  if (!isPinned && !isSettingsLoaded) {
    return null;
  }

  if (isAnnouncementsWave(waveId) && !isPinned) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isCurrentlyProcessing) {
      return;
    }

    try {
      if (isPinned) {
        waves.removePinnedWave(waveId);
        hideTooltip();
        return;
      }

      if (!canPinWave(waveId)) {
        setShowMaxLimitTooltip(true);
        showErrorToast(`Maximum ${MAX_PINNED_WAVES} pinned waves allowed`);
        return;
      }

      waves.addPinnedWave(waveId);
    } catch (error) {
      console.error("Error updating wave pin status:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      const action = isPinned ? "unpin" : "pin";
      showErrorToast(`Failed to ${action} wave: ${errorMessage}`);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isCurrentlyProcessing}
        className={`tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-transition-all tw-duration-200 ${buttonStyles} ${isCurrentlyProcessing ? "tw-cursor-not-allowed tw-opacity-50" : ""}`}
        aria-label={ariaLabel}
        data-tooltip-id={`wave-header-pin-${waveId}`}
        data-tooltip-content={tooltipContent}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`tw-size-4 tw-flex-shrink-0 ${isPinned ? "tw-rotate-[-45deg]" : ""}`}
          aria-hidden="true"
        >
          <path d="M12 17v5" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
        </svg>
      </button>
      <MyStreamActionTooltip id={`wave-header-pin-${waveId}`} />
    </>
  );
};

export default WaveHeaderPinButton;
