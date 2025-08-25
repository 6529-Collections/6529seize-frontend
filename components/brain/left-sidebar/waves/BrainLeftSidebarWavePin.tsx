"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";
import { Tooltip } from "react-tooltip";
import { useAuth } from "../../../../components/auth/Auth";
import {
  usePinnedWavesServer,
  MAX_PINNED_WAVES,
} from "../../../../hooks/usePinnedWavesServer";

interface BrainLeftSidebarWavePinProps {
  readonly waveId: string;
  readonly isPinned: boolean;
}

const BrainLeftSidebarWavePin: React.FC<BrainLeftSidebarWavePinProps> = ({
  waveId,
  isPinned,
}) => {
  const { waves } = useMyStream();
  const { pinnedIds, isOperationInProgress } = usePinnedWavesServer();
  const { setToast } = useAuth();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showMaxLimitTooltip, setShowMaxLimitTooltip] = useState(false);

  // Check if this specific wave operation is in progress
  const isCurrentlyProcessing = isOperationInProgress(waveId);

  // Check if we can pin this wave using server data
  const canPinWave = useCallback(() => {
    // If this wave is already pinned, we can always unpin it
    if (isPinned) return true;

    // Check if we have room for another pinned wave using the hook's data
    return pinnedIds.length < MAX_PINNED_WAVES;
  }, [isPinned, pinnedIds.length]);

  // // Reset tooltip state when pinned state changes
  useEffect(() => {
    setShowMaxLimitTooltip(false);
  }, [isPinned]);

  // Also reset tooltip state when pinnedIds array changes
  useEffect(() => {
    if (canPinWave()) {
      setShowMaxLimitTooltip(false);
    }
  }, [pinnedIds, canPinWave]);

  // Auto-hide tooltip after 3 seconds with proper cleanup
  useEffect(() => {
    if (showMaxLimitTooltip) {
      const timer = setTimeout(() => setShowMaxLimitTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showMaxLimitTooltip]);

  // Detect touch device on component mount
  useEffect(() => {
    const checkTouch = () => {
      // Check if device supports touch events
      setIsTouchDevice(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore: matchMedia may not be available in all environments
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
      );
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);

    return () => {
      window.removeEventListener("resize", checkTouch);
    };
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Don't proceed if operation is already in progress
    if (isCurrentlyProcessing) {
      return;
    }

    try {
      if (isPinned) {
        await waves.removePinnedWave(waveId);
        setShowMaxLimitTooltip(false);
      } else {
        if (!canPinWave()) {
          setShowMaxLimitTooltip(true);
          setToast({
            type: "error",
            message: `Maximum ${MAX_PINNED_WAVES} pinned waves allowed`,
          });
        } else {
          await waves.addPinnedWave(waveId);
        }
      }
    } catch (error) {
      console.error('Error updating wave pin status:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setToast({
        type: "error",
        message: `Failed to ${isPinned ? 'unpin' : 'pin'} wave: ${errorMessage}`,
      });
    }
  };

  // Apply visibility logic: always show pinned waves on desktop, hide unpinned until hover
  const getOpacityClass = () => {
    if (isTouchDevice) return "tw-opacity-100";
    if (isPinned) return "tw-opacity-100";
    return "tw-opacity-0 group-hover:tw-opacity-100";
  };
  const opacityClass = getOpacityClass();

  // Ensure tooltip is updated immediately by always checking the current state
  const getTooltipContent = () => {
    if (isPinned) return "Unpin";
    if (canPinWave()) return "Pin";
    return `Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`;
  };
  const tooltipContent = getTooltipContent();

  const getButtonStyles = () => {
    if (isPinned) {
      return "tw-text-iron-200 tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-650 desktop-hover:hover:tw-text-iron-100 tw-opacity-100";
    }
    return "tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 tw-bg-transparent active:tw-bg-iron-700 tw-opacity-70";
  };

  const getAriaLabel = () => {
    return isPinned ? "Unpin wave" : "Pin wave";
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isCurrentlyProcessing}
        className={`tw-mt-0.5 -tw-mr-2 tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-7 sm:tw-size-6 tw-rounded-md tw-transition-all tw-duration-200 ${opacityClass} ${getButtonStyles()} ${isCurrentlyProcessing ? 'tw-opacity-50 tw-cursor-not-allowed' : ''}`}
        aria-label={getAriaLabel()}
        data-tooltip-id={`wave-pin-${waveId}`}
      >
        <FontAwesomeIcon
          icon={faThumbtack}
          className={`tw-size-2.5 tw-flex-shrink-0 ${isPinned ? "tw-rotate-[-45deg]" : ""}`}
        />
      </button>
      <Tooltip
        id={`wave-pin-${waveId}`}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <span className="tw-text-xs">{tooltipContent}</span>
      </Tooltip>
    </>
  );
};

export default BrainLeftSidebarWavePin;
