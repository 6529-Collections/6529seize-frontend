"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getTimeAgoShort } from "@/helpers/Helpers";
import {
  getDeviceTimeZone,
  LOCAL_DISPLAY_TIME_ZONE,
  resolveDisplayTimeZone,
  type DisplayTimeZone,
  type DisplayTimeZonePreference,
} from "@/lib/display-time-zone/displayTimeZone";
import {
  getDisplayTimeZoneServerSnapshot,
  getDisplayTimeZoneSnapshot,
  setDisplayTimeZoneOverride,
  setDisplayTimeZonePreference,
  subscribeToDisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZoneStore";

export interface DisplayTimeZoneState {
  /** The saved setting: "local", "UTC" or an IANA zone. */
  readonly preference: DisplayTimeZonePreference;
  /** The wave switch for this tab, or null when it is off. */
  readonly override: DisplayTimeZonePreference | null;
  /** The value in effect: the switch when it is on, otherwise the setting. */
  readonly effectivePreference: DisplayTimeZonePreference;
  /** The zone to format with. */
  readonly zone: DisplayTimeZone;
  /** The device's own zone, when the runtime reports one. */
  readonly deviceTimeZone: string | undefined;
  readonly setPreference: (preference: DisplayTimeZonePreference) => void;
  readonly setOverride: (override: DisplayTimeZonePreference | null) => void;
}

/**
 * The display time zone with its setting and wave switch. Server rendering
 * and the first hydration render use the device zone; the stored choice
 * applies right after, so markup always hydrates cleanly.
 */
export function useDisplayTimeZoneState(): DisplayTimeZoneState {
  const snapshot = useSyncExternalStore(
    subscribeToDisplayTimeZone,
    getDisplayTimeZoneSnapshot,
    getDisplayTimeZoneServerSnapshot
  );
  const isServerSnapshot = snapshot === getDisplayTimeZoneServerSnapshot();

  return useMemo(() => {
    const deviceTimeZone = isServerSnapshot ? undefined : getDeviceTimeZone();
    const effectivePreference = snapshot.override ?? snapshot.preference;
    return {
      preference: snapshot.preference,
      override: snapshot.override,
      effectivePreference,
      zone: isServerSnapshot
        ? LOCAL_DISPLAY_TIME_ZONE
        : resolveDisplayTimeZone(effectivePreference, deviceTimeZone),
      deviceTimeZone,
      setPreference: setDisplayTimeZonePreference,
      setOverride: setDisplayTimeZoneOverride,
    };
  }, [isServerSnapshot, snapshot]);
}

/** The zone that times render in. See `withDisplayTimeZone`. */
export function useDisplayTimeZone(): DisplayTimeZone {
  return useDisplayTimeZoneState().zone;
}

/**
 * `getTimeAgoShort` in the display time zone, so "Yesterday" and short dates
 * flip at that zone's midnight rather than the device's. In the device zone
 * it passes the caller's arguments through unchanged.
 */
export function useTimeAgoShort(): (
  ...args: Parameters<typeof getTimeAgoShort>
) => string {
  const { timeZone } = useDisplayTimeZone();
  return useCallback(
    (...args: Parameters<typeof getTimeAgoShort>) => {
      if (timeZone === undefined) {
        return getTimeAgoShort(...args);
      }
      const [milliseconds, referenceTime, alwaysRelative, options] = args;
      return getTimeAgoShort(
        milliseconds,
        referenceTime ?? Date.now(),
        alwaysRelative ?? false,
        { ...options, timeZone }
      );
    },
    [timeZone]
  );
}
