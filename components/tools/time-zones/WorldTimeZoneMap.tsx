"use client";

import {
  memo,
  useCallback,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type MapZoneView = {
  readonly tzid: string;
  readonly d: string;
  readonly fill: string;
  readonly label: string;
};

type WorldTimeZoneMapProps = {
  readonly viewBox: string;
  readonly land: string;
  // Ordered west to east by current offset; this is the arrow-key order.
  readonly zones: readonly MapZoneView[];
  // The pinned zone (click, tap or keyboard) and a transient hover preview.
  readonly selectedZoneId: string | null;
  readonly previewZoneId: string | null;
  readonly viewerZoneId: string | null;
  readonly nightPath: string | null;
  readonly labelledBy: string;
  readonly describedBy: string;
  readonly onPreview: (zoneId: string | null) => void;
  readonly onSelect: (zoneId: string) => void;
};

const ZONE_BORDER_COLOR = "#0d0d0f";

function getNextIndex(key: string, index: number, count: number) {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % count;
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

type ZonePathProps = {
  readonly zone: MapZoneView;
  readonly isActive: boolean;
  readonly isTabStop: boolean;
  readonly registerPath: (zoneId: string, element: SVGPathElement | null) => void;
  readonly onPreview: (zoneId: string | null) => void;
  readonly onSelect: (zoneId: string) => void;
};

function ZonePathView({
  zone,
  isActive,
  isTabStop,
  registerPath,
  onPreview,
  onSelect,
}: ZonePathProps) {
  const handlePointerEnter = (event: PointerEvent<SVGPathElement>) => {
    if (event.pointerType === "mouse") {
      onPreview(zone.tzid);
    }
  };

  return (
    <path
      ref={(element) => registerPath(zone.tzid, element)}
      d={zone.d}
      fill={zone.fill}
      fillRule="evenodd"
      stroke={ZONE_BORDER_COLOR}
      strokeWidth={0.75}
      vectorEffect="non-scaling-stroke"
      role="option"
      aria-selected={isActive}
      aria-label={zone.label}
      tabIndex={isTabStop ? 0 : -1}
      className="tw-cursor-pointer tw-outline-none tw-transition-[fill] tw-duration-300 motion-reduce:tw-transition-none"
      onPointerEnter={handlePointerEnter}
      onFocus={() => onSelect(zone.tzid)}
      onClick={() => onSelect(zone.tzid)}
    />
  );
}

// A zone re-renders only when its own fill, label or selection changes.
const ZonePath = memo(ZonePathView);

function findZone(zones: readonly MapZoneView[], zoneId: string | null) {
  return zoneId === null
    ? undefined
    : zones.find((zone) => zone.tzid === zoneId);
}

export default function WorldTimeZoneMap({
  viewBox,
  land,
  zones,
  selectedZoneId,
  previewZoneId,
  viewerZoneId,
  nightPath,
  labelledBy,
  describedBy,
  onPreview,
  onSelect,
}: WorldTimeZoneMapProps) {
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const registerPath = useCallback(
    (zoneId: string, element: SVGPathElement | null) => {
      if (element) {
        pathRefs.current.set(zoneId, element);
      } else {
        pathRefs.current.delete(zoneId);
      }
    },
    []
  );
  const selectedZone = findZone(zones, selectedZoneId);
  const activeZone = findZone(zones, previewZoneId) ?? selectedZone;
  const viewerZone = findZone(zones, viewerZoneId);
  // Roving tab stop: the pinned zone, or the westernmost zone.
  const tabStopId = selectedZone?.tzid ?? zones[0]?.tzid ?? null;

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const currentIndex = zones.findIndex((zone) => zone.tzid === tabStopId);
    const nextIndex = getNextIndex(event.key, currentIndex, zones.length);
    const nextZone = nextIndex === null ? undefined : zones[nextIndex];
    if (!nextZone) {
      return;
    }
    event.preventDefault();
    onSelect(nextZone.tzid);
    pathRefs.current.get(nextZone.tzid)?.focus();
  };

  return (
    <svg
      viewBox={viewBox}
      role="listbox"
      aria-orientation="horizontal"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="tw-block tw-h-auto tw-w-full tw-touch-manipulation tw-select-none"
      onKeyDown={handleKeyDown}
      onPointerLeave={() => onPreview(null)}
    >
      {zones.map((zone) => (
        <ZonePath
          key={zone.tzid}
          zone={zone}
          isActive={zone.tzid === selectedZone?.tzid}
          isTabStop={zone.tzid === tabStopId}
          registerPath={registerPath}
          onPreview={onPreview}
          onSelect={onSelect}
        />
      ))}
      <g aria-hidden="true" pointerEvents="none">
        <path
          d={land}
          fill="#ffffff"
          fillOpacity={0.14}
          stroke="#ffffff"
          strokeOpacity={0.32}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        {nightPath ? (
          <path
            d={nightPath}
            fill="#000000"
            fillOpacity={0.38}
            className="tw-transition-opacity tw-duration-500 motion-reduce:tw-transition-none"
          />
        ) : null}
        {viewerZone ? (
          <path
            d={viewerZone.d}
            fill="none"
            fillRule="evenodd"
            stroke="#ffffff"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {activeZone ? (
          <path
            d={activeZone.d}
            fill="none"
            fillRule="evenodd"
            stroke="#ffffff"
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </g>
    </svg>
  );
}
