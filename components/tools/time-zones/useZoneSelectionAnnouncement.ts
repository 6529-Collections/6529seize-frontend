"use client";

import { useEffect, useState } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import type { MapZoneSnapshot } from "./mapZones";
import { getCityName } from "./timeZoneRows";

// Wait for the arrow keys to pause before speaking.
const ANNOUNCEMENT_DELAY_MS = 600;

// Politely announces a keyboard-selected zone's name and local time once,
// after keyboard movement pauses. Pointer selection and minute updates never
// announce: the pending zone is cleared as soon as it has been spoken.
export function useZoneSelectionAnnouncement(
  snapshots: readonly MapZoneSnapshot[] | null,
  locale: SupportedLocale
) {
  const [pendingZoneId, setPendingZoneId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (pendingZoneId === null) {
      return;
    }
    const timeout = setTimeout(() => {
      const snapshot = snapshots?.find(
        (candidate) => candidate.zone.tzid === pendingZoneId
      );
      if (snapshot?.time) {
        setAnnouncement(
          t(locale, "tools.timeZones.map.selectionAnnouncement", {
            city: getCityName(snapshot.zone.tzid),
            name: snapshot.name,
            time: snapshot.time,
          })
        );
      }
      setPendingZoneId(null);
    }, ANNOUNCEMENT_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [pendingZoneId, snapshots, locale]);

  return { announcement, announceZone: setPendingZoneId };
}
