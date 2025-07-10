"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";
import Tippy from "@tippyjs/react";
import {
  usePinnedWaves,
  MAX_PINNED_WAVES,
} from "../../../../hooks/usePinnedWaves";

interface BrainLeftSidebarWavePinProps {
  readonly waveId: string;
  readonly isPinned: boolean;
}

const BrainLeftSidebarWavePin: React.FC<BrainLeftSidebarWavePinProps> = ({
  waveId,
  isPinned,
}) => {
  const { waves } = useMyStream();
  const { pinnedIds } = usePinnedWaves();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showMaxLimitTooltip, setShowMaxLimitTooltip] = useState(false);

  // Check if we can pin this wave by directly checking the localStorage
  const canPinWave = useCallback(() => {
    // If this wave is already pinned, we can always unpin it
    if (isPinned) return true;

    // Check if we have room for another pinned wave
    try {
      // Get the most up-to-date pinned waves from localStorage
      const storedPinnedWaves = localStorage.getItem("pinnedWave");
      const currentPinnedIds = storedPinnedWaves
        ? JSON.parse(storedPinnedWaves)
        : [];

      // Return true if we have less than MAX_PINNED_WAVES waves pinned
      return currentPinnedIds.length < MAX_PINNED_WAVES;
    } catch (error) {
      console.error("Error checking pinned waves count:", error);
      // If there's an error, assume we can pin it
      return true;
    }
  }, [isPinned]);

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isPinned) {
      waves.removePinnedWave(waveId);
      setShowMaxLimitTooltip(false);
    } else {
      // Always perform a fresh check directly from localStorage
      if (!canPinWave()) {
        setShowMaxLimitTooltip(true);
        // Auto-hide the tooltip after 3 seconds
        setTimeout(() => setShowMaxLimitTooltip(false), 3000);
      } else {
        waves.addPinnedWave(waveId);
      }
    }
  };

  // Apply same hover behavior to both pin and unpin states
  const opacityClass = isTouchDevice
    ? "tw-opacity-100" // Always visible on touch devices
    : "tw-opacity-0 group-hover:tw-opacity-100"; // Hidden by default, visible on hover

  // Ensure tooltip is updated immediately by always checking the current state
  const tooltipContent = isPinned
    ? "Unpin"
    : canPinWave()
    ? "Pin"
    : `Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`;

  return (
    <Tippy
      content={tooltipContent}
      hideOnClick={false}
      animation="fade"
      duration={[100, 0]} // Fast fade in, instant fade out
    >
      <button
        onClick={handleClick}
        className={`tw-mt-0.5 -tw-mr-2 tw-border-0 tw-flex tw-items-center tw-justify-center tw-size-7 sm:tw-size-6 tw-rounded-md tw-transition-all tw-duration-200 ${opacityClass} ${
          isPinned
            ? "tw-text-iron-300 tw-bg-iron-700/40 desktop-hover:hover:tw-bg-iron-700/60"
            : "tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 tw-bg-iron-800"
        }`}
        aria-label={isPinned ? "Unpin wave" : "Pin wave"}>
        <FontAwesomeIcon
          icon={faThumbtack}
          className={`tw-size-3 tw-flex-shrink-0 ${
            isPinned ? "tw-rotate-[-45deg]" : ""
          }`}
        />
      </button>
    </Tippy>
  );
};

export default BrainLeftSidebarWavePin;
