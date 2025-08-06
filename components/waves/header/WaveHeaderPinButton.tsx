"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { useMyStream } from "../../../contexts/wave/MyStreamContext";
import { Tooltip } from "react-tooltip";
import { useAuth } from "../../../components/auth/Auth";
import { usePinnedWavesServer, MAX_PINNED_WAVES } from "../../../hooks/usePinnedWavesServer";

interface WaveHeaderPinButtonProps {
  readonly waveId: string;
}

const WaveHeaderPinButton: React.FC<WaveHeaderPinButtonProps> = ({
  waveId,
}) => {
  const { waves } = useMyStream();
  const { pinnedIds, isOperationInProgress } = usePinnedWavesServer();
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const [showMaxLimitTooltip, setShowMaxLimitTooltip] = useState(false);

  // Don't render if user is not authenticated or using proxy
  if (!connectedProfile?.handle || activeProfileProxy) {
    return null;
  }
  
  const isCurrentlyProcessing = isOperationInProgress(waveId);
  const isPinned = pinnedIds.includes(waveId);

  // Check if we can pin this wave using server data
  const canPinWave = useCallback(() => {
    // If this wave is already pinned, we can always unpin it
    if (isPinned) return true;
    
    // Check if we have room for another pinned wave using the hook's data
    return pinnedIds.length < MAX_PINNED_WAVES;
  }, [isPinned, pinnedIds.length]);

  // Reset tooltip state when pinned state changes
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


  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isCurrentlyProcessing) {
      return;
    }

    try {
      if (isPinned) {
        waves.removePinnedWave(waveId);
        setShowMaxLimitTooltip(false);
      } else {
        if (!canPinWave()) {
          setShowMaxLimitTooltip(true);
          setToast({
            type: "error",
            message: `Maximum ${MAX_PINNED_WAVES} pinned waves allowed`,
          });
        } else {
          waves.addPinnedWave(waveId);
        }
      }
    } catch (error) {
      console.error('Error updating wave pin status:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setToast({
        type: "error",
        message: `Failed to ${isPinned ? 'unpin' : 'pin'} wave: ${errorMessage}`,
      });
    }
  };

  // Memoize tooltip content to prevent unnecessary re-calculations
  const tooltipContent = useMemo(() => {
    if (isPinned) return "Unpin wave";
    if (canPinWave()) return "Pin wave";
    return `Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`;
  }, [isPinned, canPinWave]);

  const getButtonStyles = () => {
    if (isPinned) {
      return "tw-text-iron-200 tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-650 desktop-hover:hover:tw-text-iron-100";
    }
    return "tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 tw-bg-transparent active:tw-bg-iron-700";
  };

  const getAriaLabel = () => {
    return isPinned ? "Unpin wave" : "Pin wave";
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isCurrentlyProcessing}
        className={`tw-border-0 tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-lg tw-transition-all tw-duration-200 ${getButtonStyles()} ${isCurrentlyProcessing ? 'tw-opacity-50 tw-cursor-not-allowed' : ''}`}
        aria-label={getAriaLabel()}
        data-tooltip-id={`wave-header-pin-${waveId}`}
      >
        <FontAwesomeIcon
          icon={faThumbtack}
          className={`tw-size-3.5 tw-flex-shrink-0 ${isPinned ? "tw-rotate-[-45deg]" : ""}`}
        />
      </button>
      <Tooltip
        id={`wave-header-pin-${waveId}`}
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

export default WaveHeaderPinButton;