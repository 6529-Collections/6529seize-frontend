"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import { useMinuteNow } from "./liveClock";
import {
  buildNightPath,
  getOffsetColor,
  UNKNOWN_ZONE_COLOR,
  type WorldTimeZoneMapData,
} from "./mapGeometry";
import {
  buildMapZoneSnapshots,
  findMapZoneForTimeZone,
  type MapZoneSnapshot,
} from "./mapZones";
import { getViewerTimeZone } from "./timeZoneClock";
import {
  formatOffsetLabel,
  getDstLabel,
  getRegionLabel,
} from "./timeZoneLabels";
import {
  buildRowBasesFromIds,
  buildRowBasesFromMapZones,
  buildTimeZoneRow,
  getBrowserTimeZoneIds,
  type TimeZoneRow,
  type TimeZoneRowBase,
} from "./timeZoneRows";
import WorldTimeZoneClocks from "./WorldTimeZoneClocks";
import WorldTimeZoneDetails, {
  type ZoneDetailsView,
} from "./WorldTimeZoneDetails";
import WorldTimeZoneLegend from "./WorldTimeZoneLegend";
import WorldTimeZoneMap, { type MapZoneView } from "./WorldTimeZoneMap";
import WorldTimeZoneTable from "./WorldTimeZoneTable";

type MapDataState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly data: WorldTimeZoneMapData }
  | { readonly status: "error" };

const MAP_HEADING_ID = "world-time-zones-map-heading";
const MAP_INSTRUCTIONS_ID = "world-time-zones-map-instructions";
// Matches the generated viewBox so the skeleton reserves the map's space.
const MAP_ASPECT_CLASS_NAME = "tw-aspect-[2000/974]";

function subscribeToNothing() {
  return () => {};
}

function getServerTimeZone(): null {
  return null;
}

// Loads the boundary data only on this page, as its own lazily loaded chunk.
function useWorldTimeZoneMapData() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<MapDataState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    import("./data/world-time-zones.generated.json")
      .then((module) => {
        const data: WorldTimeZoneMapData = module.default;
        if (active) {
          setState({ status: "ready", data });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: "error" });
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((current) => current + 1);
  }, []);

  return { state, retry };
}

function toMapZoneView(
  snapshot: MapZoneSnapshot,
  locale: SupportedLocale
): MapZoneView {
  const { zone, offsetMinutes } = snapshot;
  if (offsetMinutes === null) {
    return {
      tzid: zone.tzid,
      d: zone.d,
      fill: UNKNOWN_ZONE_COLOR,
      label: t(locale, "tools.timeZones.map.unknownZoneLabel", {
        zone: zone.tzid,
      }),
    };
  }
  return {
    tzid: zone.tzid,
    d: zone.d,
    fill: getOffsetColor(offsetMinutes),
    label: t(locale, "tools.timeZones.map.zoneLabel", {
      name: snapshot.name,
      offset: formatOffsetLabel(locale, offsetMinutes),
    }),
  };
}

function toDetailsView(
  snapshot: MapZoneSnapshot,
  locale: SupportedLocale,
  viewerZoneId: string | null
): ZoneDetailsView {
  const { zone, offsetMinutes, dst } = snapshot;
  return {
    tzid: zone.tzid,
    supported: offsetMinutes !== null,
    name: snapshot.name,
    offsetLabel:
      offsetMinutes === null ? "" : formatOffsetLabel(locale, offsetMinutes),
    time: snapshot.time ?? "",
    date: snapshot.date ?? "",
    dstLabel: dst === null ? "" : getDstLabel(locale, dst),
    sharedCount: Math.max(zone.members.length - 1, 0),
    isViewerZone: zone.tzid === viewerZoneId,
  };
}

function getRowBases(state: MapDataState): TimeZoneRowBase[] | null {
  if (state.status === "ready") {
    return buildRowBasesFromMapZones(state.data.zones);
  }
  if (state.status === "error") {
    return buildRowBasesFromIds(getBrowserTimeZoneIds());
  }
  return null;
}

function buildRows(
  bases: readonly TimeZoneRowBase[],
  locale: SupportedLocale,
  now: Date
) {
  const rows: TimeZoneRow[] = [];
  let unsupportedCount = 0;
  for (const base of bases) {
    const row = buildTimeZoneRow(
      base,
      locale,
      now,
      getRegionLabel(locale, base.regionKey)
    );
    if (row === null) {
      unsupportedCount += 1;
    } else {
      rows.push(row);
    }
  }
  return { rows, unsupportedCount };
}

function MapPlaceholder({
  locale,
  status,
  onRetry,
}: {
  readonly locale: SupportedLocale;
  readonly status: "loading" | "error";
  readonly onRetry: () => void;
}) {
  if (status === "error") {
    return (
      <div
        className={`${MAP_ASPECT_CLASS_NAME} tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-p-4 tw-text-center`}
      >
        <p className="tw-m-0 tw-max-w-sm tw-text-sm tw-text-iron-300">
          {t(locale, "tools.timeZones.map.error")}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-800 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition-colors hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(locale, "tools.timeZones.map.retry")}
        </button>
      </div>
    );
  }
  return (
    <div
      className={`${MAP_ASPECT_CLASS_NAME} tw-flex tw-items-center tw-justify-center tw-rounded-[50%] tw-bg-iron-900 motion-safe:tw-animate-pulse`}
    >
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "tools.timeZones.map.loading")}
      </p>
    </div>
  );
}

export default function WorldTimeZonesExplorer() {
  const locale = useBrowserLocale();
  const nowMs = useMinuteNow();
  const viewerTimeZone = useSyncExternalStore(
    subscribeToNothing,
    getViewerTimeZone,
    getServerTimeZone
  );
  const { state: mapState, retry } = useWorldTimeZoneMapData();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [previewZoneId, setPreviewZoneId] = useState<string | null>(null);
  const [showNight, setShowNight] = useState(true);

  const now = useMemo(() => (nowMs === null ? null : new Date(nowMs)), [nowMs]);
  const mapData = mapState.status === "ready" ? mapState.data : null;

  const zoneSnapshots = useMemo(
    () =>
      mapData === null || now === null
        ? null
        : buildMapZoneSnapshots(mapData.zones, locale, now),
    [mapData, locale, now]
  );
  const mapZones = useMemo(
    () => zoneSnapshots?.map((snapshot) => toMapZoneView(snapshot, locale)),
    [zoneSnapshots, locale]
  );
  const viewerZoneId = useMemo(
    () =>
      mapData === null || now === null || viewerTimeZone === null
        ? null
        : findMapZoneForTimeZone(mapData.zones, viewerTimeZone, now),
    [mapData, now, viewerTimeZone]
  );
  const nightPath = useMemo(
    () =>
      mapData === null || now === null || !showNight
        ? null
        : buildNightPath(now, mapData.projection.scale),
    [mapData, now, showNight]
  );
  const rowBases = useMemo(() => getRowBases(mapState), [mapState]);
  const rowsState = useMemo(
    () =>
      rowBases === null || now === null
        ? null
        : buildRows(rowBases, locale, now),
    [rowBases, locale, now]
  );

  const effectiveSelectedId = selectedZoneId ?? viewerZoneId;
  const activeZoneId = previewZoneId ?? effectiveSelectedId;
  const activeSnapshot =
    zoneSnapshots?.find((snapshot) => snapshot.zone.tzid === activeZoneId) ??
    null;
  const details =
    activeSnapshot === null
      ? null
      : toDetailsView(activeSnapshot, locale, viewerZoneId);

  return (
    <>
      <WorldTimeZoneClocks
        locale={locale}
        now={now}
        viewerTimeZone={viewerTimeZone}
      />
      <section aria-labelledby={MAP_HEADING_ID} className="tw-mt-10">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2">
          <h2
            id={MAP_HEADING_ID}
            className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-50"
          >
            {t(locale, "tools.timeZones.map.heading")}
          </h2>
          <label className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200">
            <input
              type="checkbox"
              checked={showNight}
              onChange={(event) => setShowNight(event.target.checked)}
              className="tw-size-4 tw-accent-primary-500"
            />
            {t(locale, "tools.timeZones.map.nightToggle")}
          </label>
        </div>
        <p
          id={MAP_INSTRUCTIONS_ID}
          className="tw-m-0 tw-mt-1 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400"
        >
          {t(locale, "tools.timeZones.map.instructions")}
        </p>
        <div className="tw-mt-4 tw-grid tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_17rem]">
          <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-[#0D0D0F] tw-p-2 has-[:focus-visible]:tw-ring-2 has-[:focus-visible]:tw-ring-primary-400 sm:tw-p-3">
            {mapData !== null && mapZones !== undefined ? (
              <WorldTimeZoneMap
                viewBox={mapData.viewBox}
                land={mapData.land}
                zones={mapZones}
                selectedZoneId={effectiveSelectedId}
                previewZoneId={previewZoneId}
                viewerZoneId={viewerZoneId}
                nightPath={nightPath}
                labelledBy={MAP_HEADING_ID}
                describedBy={MAP_INSTRUCTIONS_ID}
                onPreview={setPreviewZoneId}
                onSelect={setSelectedZoneId}
              />
            ) : (
              <MapPlaceholder
                locale={locale}
                status={mapState.status === "error" ? "error" : "loading"}
                onRetry={retry}
              />
            )}
          </div>
          <div className="tw-flex tw-flex-col tw-gap-4">
            <WorldTimeZoneDetails locale={locale} zone={details} />
            <WorldTimeZoneLegend locale={locale} />
          </div>
        </div>
      </section>
      <WorldTimeZoneTable
        locale={locale}
        rows={rowsState?.rows ?? null}
        unsupportedCount={rowsState?.unsupportedCount ?? 0}
        viewerTimeZone={viewerTimeZone}
      />
    </>
  );
}
