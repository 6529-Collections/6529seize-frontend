"use client";

import React, { useSyncExternalStore } from "react";
import { useCompactMode } from "@/contexts/CompactModeContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import {
  formatWaveDropRevealTimestamp,
  formatWaveDropTimestamp,
} from "@/lib/display-time-zone/waveDropTimeFormat";

type WaveDropTimeSize = "xs" | "meta" | "sm";
type WaveDropTimeColor = "default" | "iron-400";
type WaveDropTimestamp = Date | number | string | null | undefined;

interface WaveDropTimeProps {
  readonly timestamp: WaveDropTimestamp;
  readonly size?: WaveDropTimeSize | undefined;
  readonly color?: WaveDropTimeColor | undefined;
  readonly variant?: "default" | "compactReveal" | undefined;
}

/**
 * The timestamp shown with a drop. It renders in the display time zone (see
 * Preferences > Time Zone and the wave header switch); outside the device's
 * own zone the clock time names its zone, such as "05:06 PM UTC".
 */
const SIZE_CLASSES: Record<WaveDropTimeSize, string> = {
  xs: "tw-text-xs",
  meta: "tw-text-meta",
  sm: "tw-text-sm",
};

const getValidTimestampDate = (timestamp: WaveDropTimestamp): Date | null => {
  if (timestamp === null || timestamp === undefined || timestamp === "") {
    return null;
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date : null;
};

const subscribeToViewportResize = (onStoreChange: () => void): (() => void) => {
  globalThis.window.addEventListener("resize", onStoreChange);
  return () => globalThis.window.removeEventListener("resize", onStoreChange);
};

const getIsMobileSnapshot = (): boolean => globalThis.window.innerWidth <= 640;

const getIsMobileServerSnapshot = (): boolean => false;

const WaveDropTime: React.FC<WaveDropTimeProps> = ({
  timestamp,
  size = "xs",
  color = "default",
  variant = "default",
}) => {
  const isMobile = useSyncExternalStore(
    subscribeToViewportResize,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  );
  const compact = useCompactMode();
  const locale = useBrowserLocale();
  const zone = useDisplayTimeZone();

  const date = getValidTimestampDate(timestamp);
  if (!date) return null;

  const label =
    variant === "compactReveal"
      ? formatWaveDropRevealTimestamp(date, { zone, locale })
      : formatWaveDropTimestamp(date, {
          zone,
          locale,
          dateOnlyAfterToday: isMobile,
        });

  const textSizeClass =
    compact && size === "xs"
      ? "tw-text-[11px] tw-leading-4"
      : SIZE_CLASSES[size];
  const textColorClass =
    color === "iron-400" ? "tw-text-iron-400" : "tw-text-white/40";
  const textWeightClass = color === "iron-400" ? "tw-font-normal" : "";

  return (
    <p
      className={`${textSizeClass} ${textColorClass} ${textWeightClass} tw-m-0 tw-whitespace-nowrap tw-leading-none`}
    >
      <time dateTime={date.toISOString()}>{label}</time>
    </p>
  );
};

export default WaveDropTime;
