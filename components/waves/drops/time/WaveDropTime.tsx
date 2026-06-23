"use client";

import React, { useEffect, useState } from "react";
import { Time } from "@/helpers/time";
import { useCompactMode } from "@/contexts/CompactModeContext";

type WaveDropTimeSize = "xs" | "sm";

interface WaveDropTimeProps {
  readonly timestamp: number;
  readonly size?: WaveDropTimeSize | undefined;
  readonly variant?: "default" | "compactReveal" | undefined;
}

/**
 * A reusable component for displaying timestamps in wave drops
 * Uses the exact same logic as the original WaveDropHeader implementation
 */
const SIZE_CLASSES: Record<WaveDropTimeSize, string> = {
  xs: "tw-text-xs",
  sm: "tw-text-sm",
};

const getTimeLabel = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const getCompactRevealTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return getTimeLabel(timestamp);
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const timeLabel = getTimeLabel(timestamp);

  if (isYesterday) {
    return `Yesterday, ${timeLabel}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "2-digit" }),
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const WaveDropTime: React.FC<WaveDropTimeProps> = ({
  timestamp,
  size = "xs",
  variant = "default",
}) => {
  // Hooks must be called at the top level
  const [isMobile, setIsMobile] = useState(false);
  const compact = useCompactMode();

  // Check mobile on mount and window resize
  useEffect(() => {
    function checkMobile() {
      const screenSize = window.innerWidth;
      if (screenSize <= 640) {
        // Tailwind's sm breakpoint
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't render if no timestamp
  if (!timestamp) return null;

  // Updated time formatting logic to just show time for today
  const formatTime = () => {
    if (variant === "compactReveal") {
      return getCompactRevealTimestamp(timestamp);
    }

    const timeObj = Time.millis(timestamp);
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // For today, just show time on both mobile and desktop
    if (isToday) {
      return getTimeLabel(timestamp);
    }

    // Otherwise follow the original behavior
    if (isMobile) {
      // On mobile: show only date for non-today timestamps
      return timeObj.toLocaleDropDateString();
    } else {
      // On desktop: show date and time for non-today timestamps
      // Get the parts separately to handle formatting
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      const timeStr = getTimeLabel(timestamp);

      if (isYesterday) {
        return `Yesterday - ${timeStr}`;
      }

      const sameYear = date.getFullYear() === now.getFullYear();
      const dateStr = date.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        ...(sameYear ? {} : { year: "numeric" }),
      });

      return `${dateStr} - ${timeStr}`;
    }
  };

  const textSizeClass = compact ? "tw-text-[11px] tw-leading-4" : SIZE_CLASSES[size];

  return (
    <p className={`${textSizeClass} tw-mb-0 tw-whitespace-nowrap tw-leading-none tw-text-white/40`}>
      {formatTime()}
    </p>
  );
};

export default WaveDropTime;
