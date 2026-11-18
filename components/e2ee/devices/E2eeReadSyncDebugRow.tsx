"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { formatTime } from "@/i18n/format";
import { withDisplayTimeZone } from "@/lib/display-time-zone/displayTimeZone";
import type {
  E2eeEngine,
  E2eeReadSyncReason,
  E2eeReadSyncStatus,
} from "@/lib/e2ee/types";

/** Times move (budget, maintenance) without a store change: re-read. */
const REFRESH_MS = 15_000;

const shortGroup = (g: string): string =>
  g.length > 14 ? `${g.slice(0, 8)}…${g.slice(-4)}` : g;

/*
 * Debug-only copy, in English on purpose: this row is staging QA for read
 * sync (D175) and never ships in a production build, so it is not part of
 * the localized UI.
 */
function reasonText(
  reason: E2eeReadSyncReason,
  time: (at: number) => string
): string {
  switch (reason.kind) {
    case "claim-budget":
      return reason.nextAt === null
        ? "waiting for claim budget"
        : `waiting for claim budget (next at ${time(reason.nextAt)})`;
    case "older-key-packages":
      return `sibling ${reason.device} on old KeyPackages`;
    case "invited":
      return `invite sent to ${reason.device} at ${time(reason.since)}, waiting for accept`;
    case "maintenance":
      return `next maintenance at ${time(reason.nextAt)}`;
  }
}

/**
 * Staging-only debug row for read-state sync: whom this device shares its
 * self group with, the group's short id, and why missing devices are not in
 * it yet. The panel renders it only when isE2eeReadSyncDebugShown().
 */
export function E2eeReadSyncDebugRow({
  engine,
}: {
  readonly engine: E2eeEngine | null;
}) {
  const locale = useBrowserLocale();
  const zone = useDisplayTimeZone();
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!engine) {
        return () => {};
      }
      const unsubscribe = engine.subscribe(onChange);
      const timer = setInterval(onChange, REFRESH_MS);
      return () => {
        unsubscribe();
        clearInterval(timer);
      };
    },
    [engine]
  );
  // A string snapshot: equal statuses compare equal between reads.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(engine?.getReadSyncStatus?.() ?? null),
    () => "null"
  );
  const status = useMemo(
    () => JSON.parse(snapshot) as E2eeReadSyncStatus | null,
    [snapshot]
  );
  if (!status) {
    return null;
  }
  const time = (at: number) =>
    formatTime(
      locale,
      at,
      withDisplayTimeZone(zone, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
    );
  const shared =
    status.sharedWith === 0
      ? "Only this device"
      : `Shared with ${status.sharedWith} other ${status.sharedWith === 1 ? "device" : "devices"}`;
  return (
    <section
      aria-label="Read sync debug (staging only)"
      data-testid="e2ee-read-sync-debug"
      className="tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-950 tw-px-4 tw-py-3 tw-text-xs tw-leading-5 tw-text-iron-300"
    >
      <p className="tw-m-0 tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        Read sync debug (staging only)
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-iron-200">
        {shared}
        {" · group "}
        <span className="tw-font-mono">
          {status.group === null ? "none" : shortGroup(status.group)}
        </span>
        {status.olderGroups > 0
          ? ` · also in ${status.olderGroups} older self ${status.olderGroups === 1 ? "group" : "groups"}`
          : null}
      </p>
      {status.reasons.length > 0 && (
        <ul className="tw-m-0 tw-mt-1 tw-list-disc tw-pl-5">
          {status.reasons.map((reason) => {
            const text = reasonText(reason, time);
            return <li key={text}>{text}</li>;
          })}
        </ul>
      )}
    </section>
  );
}
