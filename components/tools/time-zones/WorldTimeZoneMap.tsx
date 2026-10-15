"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

export type MapSelectionSource = "keyboard" | "pointer";

export type MapZoneView = {
  readonly tzid: string;
  readonly x: number;
  readonly y: number;
  readonly fill: string;
  readonly label: string;
};

type MapNightView = {
  readonly area: string;
  readonly terminator: string;
};

type WorldTimeZoneMapProps = {
  readonly viewBox: string;
  readonly sphere: string;
  readonly graticule: string;
  readonly land: string;
  // Ordered west to east by current offset; this is the arrow-key order.
  readonly zones: readonly MapZoneView[];
  // The pinned zone (click, tap or keyboard) and a transient hover preview.
  readonly selectedZoneId: string | null;
  readonly previewZoneId: string | null;
  readonly viewerZoneId: string | null;
  readonly night: MapNightView | null;
  readonly labelledBy: string;
  readonly describedBy: string;
  readonly onPreview: (zoneId: string | null) => void;
  readonly onSelect: (zoneId: string, source: MapSelectionSource) => void;
};

const OPTION_ID_PREFIX = "world-time-zone-option-";
// Dot sizes in CSS pixels, kept constant as the map scales.
const DOT_RADIUS_PX = 4.5;
const COMPACT_DOT_RADIUS_PX = 3.25;
const COMPACT_MAP_WIDTH_PX = 600;
// A pointer or tap selects the nearest dot within this distance, so each dot
// owns the area around it rather than only its few drawn pixels.
const HIT_RADIUS_PX = 22;
const DEFAULT_PIXELS_PER_UNIT = 0.43;
const DOT_RING_COLOR = "#f5f5f5";
// Outlines pair a dark halo with a white ring, so one of the two contrasts at
// least 3:1 with the dot, the land, the ocean and the night shading.
const OUTLINE_HALO_COLOR = "#000000";
const OUTLINE_COLOR = "#ffffff";

type OutlineVariant = "viewer" | "preview" | "selected" | "focused";

const OUTLINE_GAPS_PX: Record<OutlineVariant, number> = {
  viewer: 4,
  preview: 3,
  selected: 4,
  focused: 5,
};
const OUTLINE_WIDTHS_PX: Record<OutlineVariant, number> = {
  viewer: 1.5,
  preview: 1.5,
  selected: 2.5,
  focused: 3.5,
};

// Stable, unique element ids for aria-activedescendant ("Etc/GMT+12" and
// "Etc/GMT-12" must not collide).
function getOptionId(zoneId: string): string {
  return `${OPTION_ID_PREFIX}${zoneId.replaceAll("/", "--").replaceAll("+", "-plus-")}`;
}

// APG listbox keys: arrows move one option (west to east), Home and End jump
// to the ends; movement stops at the first and last option.
function getNextIndex(key: string, index: number, count: number) {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return Math.min(index + 1, count - 1);
    case "ArrowLeft":
    case "ArrowUp":
      return Math.max(index - 1, 0);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

function parseViewBox(viewBox: string): { width: number; height: number } {
  const [, , width = 1, height = 1] = viewBox.split(" ").map(Number);
  return { width, height };
}

function findNearestZone(
  zones: readonly MapZoneView[],
  x: number,
  y: number,
  maxDistance: number
): MapZoneView | null {
  let nearest: MapZoneView | null = null;
  let nearestDistance = maxDistance * maxDistance;
  for (const zone of zones) {
    const distance = (zone.x - x) ** 2 + (zone.y - y) ** 2;
    if (distance <= nearestDistance) {
      nearest = zone;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function getDirectZoneId(target: EventTarget): string | null {
  return target instanceof SVGElement
    ? (target.closest<SVGElement>("[data-zone-id]")?.dataset["zoneId"] ?? null)
    : null;
}

// Tracks how many CSS pixels one map unit spans, so dots, rings and hit
// areas keep their on-screen size at every width.
function usePixelsPerUnit(viewBoxWidth: number) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pixelsPerUnit, setPixelsPerUnit] = useState(DEFAULT_PIXELS_PER_UNIT);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width > 0) {
        setPixelsPerUnit(width / viewBoxWidth);
      }
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [viewBoxWidth]);

  return { svgRef, pixelsPerUnit };
}

function matchesFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return false;
  }
}

// Options never take DOM focus: the listbox keeps focus and points at the
// selected option with aria-activedescendant.
function ZoneDotView({
  zone,
  radius,
  ringWidth,
  isSelected,
}: {
  readonly zone: MapZoneView;
  readonly radius: number;
  readonly ringWidth: number;
  readonly isSelected: boolean;
}) {
  return (
    <circle
      id={getOptionId(zone.tzid)}
      data-zone-id={zone.tzid}
      cx={zone.x}
      cy={zone.y}
      r={radius}
      fill={zone.fill}
      stroke={DOT_RING_COLOR}
      strokeOpacity={0.9}
      strokeWidth={ringWidth}
      role="option"
      aria-selected={isSelected}
      aria-label={zone.label}
      className="tw-transition-[fill] tw-duration-300 motion-reduce:tw-transition-none"
    />
  );
}

// A dot re-renders only when its own color, label, size or selection changes.
const ZoneDot = memo(ZoneDotView);

function ZoneOutline({
  zone,
  variant,
  dotRadius,
  pixelsPerUnit,
}: {
  readonly zone: MapZoneView;
  readonly variant: OutlineVariant;
  readonly dotRadius: number;
  readonly pixelsPerUnit: number;
}) {
  const radius = dotRadius + OUTLINE_GAPS_PX[variant] / pixelsPerUnit;
  const width = OUTLINE_WIDTHS_PX[variant];
  const haloWidth = width + (variant === "focused" ? 3 : 2);
  return (
    <>
      <circle
        cx={zone.x}
        cy={zone.y}
        r={radius}
        fill="none"
        stroke={OUTLINE_HALO_COLOR}
        strokeOpacity={0.9}
        strokeWidth={haloWidth / pixelsPerUnit}
      />
      <circle
        cx={zone.x}
        cy={zone.y}
        r={radius}
        fill="none"
        stroke={OUTLINE_COLOR}
        strokeWidth={width / pixelsPerUnit}
        strokeDasharray={
          variant === "viewer"
            ? `${3 / pixelsPerUnit} ${2 / pixelsPerUnit}`
            : undefined
        }
      />
    </>
  );
}

// Static land, ocean and band lines; memoized so live updates skip them.
function BaseMapView({
  sphere,
  graticule,
  land,
}: {
  readonly sphere: string;
  readonly graticule: string;
  readonly land: string;
}) {
  return (
    <>
      <path d={sphere} fill="#141418" />
      <path
        d={graticule}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.07}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={land}
        fill="#2b2b33"
        fillRule="evenodd"
        stroke="#4c4c55"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

const BaseMap = memo(BaseMapView);

function findZone(zones: readonly MapZoneView[], zoneId: string | null) {
  return zoneId === null
    ? undefined
    : zones.find((zone) => zone.tzid === zoneId);
}

export default function WorldTimeZoneMap({
  viewBox,
  sphere,
  graticule,
  land,
  zones,
  selectedZoneId,
  previewZoneId,
  viewerZoneId,
  night,
  labelledBy,
  describedBy,
  onPreview,
  onSelect,
}: WorldTimeZoneMapProps) {
  const viewBoxSize = parseViewBox(viewBox);
  const { svgRef, pixelsPerUnit } = usePixelsPerUnit(viewBoxSize.width);
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
  const selectedZone = findZone(zones, selectedZoneId);
  const previewZone = findZone(zones, previewZoneId);
  const viewerZone = findZone(zones, viewerZoneId);
  const isCompact = pixelsPerUnit * viewBoxSize.width < COMPACT_MAP_WIDTH_PX;
  const dotRadius =
    (isCompact ? COMPACT_DOT_RADIUS_PX : DOT_RADIUS_PX) / pixelsPerUnit;
  const ringWidth = 1 / pixelsPerUnit;

  // The zone under a pointer: the dot itself, or the nearest dot in reach.
  const getZoneAtPointer = (event: MouseEvent<SVGSVGElement>) => {
    const directZoneId = getDirectZoneId(event.target);
    if (directZoneId !== null) {
      return directZoneId;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    const x = ((event.clientX - rect.left) / rect.width) * viewBoxSize.width;
    const y = ((event.clientY - rect.top) / rect.height) * viewBoxSize.height;
    return (
      findNearestZone(zones, x, y, HIT_RADIUS_PX / pixelsPerUnit)?.tzid ?? null
    );
  };

  // The focused option is always the aria-activedescendant, which is the
  // selected zone: hover previews never move it, and a click moves both.
  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const currentIndex = zones.findIndex(
      (zone) => zone.tzid === selectedZone?.tzid
    );
    const nextIndex = getNextIndex(event.key, currentIndex, zones.length);
    const nextZone = nextIndex === null ? undefined : zones[nextIndex];
    if (!nextZone) {
      return;
    }
    event.preventDefault();
    setHasKeyboardFocus(true);
    onSelect(nextZone.tzid, "keyboard");
  };

  // APG single-select listbox: with nothing selected, focus selects the
  // first option so aria-activedescendant always names one.
  const handleFocus = (event: FocusEvent<SVGSVGElement>) => {
    setHasKeyboardFocus(matchesFocusVisible(event.currentTarget));
    const firstZone = zones[0];
    if (!selectedZone && firstZone) {
      onSelect(firstZone.tzid, "keyboard");
    }
  };

  const handleClick = (event: MouseEvent<SVGSVGElement>) => {
    const zoneId = getZoneAtPointer(event);
    if (zoneId !== null) {
      setHasKeyboardFocus(false);
      onSelect(zoneId, "pointer");
    }
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse") {
      onPreview(getZoneAtPointer(event));
    }
  };

  const outlineProps = { dotRadius, pixelsPerUnit };

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      role="listbox"
      tabIndex={0}
      aria-orientation="horizontal"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-activedescendant={
        selectedZone ? getOptionId(selectedZone.tzid) : undefined
      }
      className={`tw-block tw-h-auto tw-w-full tw-touch-manipulation tw-select-none tw-outline-none ${previewZone ? "tw-cursor-pointer" : "tw-cursor-default"}`}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={() => setHasKeyboardFocus(false)}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => onPreview(null)}
    >
      <g aria-hidden="true" pointerEvents="none">
        <BaseMap sphere={sphere} graticule={graticule} land={land} />
        {night ? (
          <g className="tw-transition-opacity tw-duration-500 motion-reduce:tw-transition-none">
            <path d={night.area} fill="#000000" fillOpacity={0.42} />
            <path
              d={night.terminator}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.5}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ) : null}
      </g>
      {zones.map((zone) => (
        <ZoneDot
          key={zone.tzid}
          zone={zone}
          radius={dotRadius}
          ringWidth={ringWidth}
          isSelected={zone.tzid === selectedZone?.tzid}
        />
      ))}
      <g aria-hidden="true" pointerEvents="none">
        {viewerZone ? (
          <ZoneOutline zone={viewerZone} variant="viewer" {...outlineProps} />
        ) : null}
        {previewZone && previewZone !== selectedZone ? (
          <ZoneOutline zone={previewZone} variant="preview" {...outlineProps} />
        ) : null}
        {selectedZone ? (
          <ZoneOutline
            zone={selectedZone}
            variant={hasKeyboardFocus ? "focused" : "selected"}
            {...outlineProps}
          />
        ) : null}
      </g>
    </svg>
  );
}
