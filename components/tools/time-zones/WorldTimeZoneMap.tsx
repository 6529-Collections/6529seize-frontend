"use client";

import {
  memo,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";

export type MapSelectionSource = "keyboard" | "pointer";

export type MapZoneView = {
  readonly tzid: string;
  readonly d: string;
  // Full offset color, drawn on land.
  readonly fill: string;
  // Muted offset color for open ocean (nautical Etc/GMT time).
  readonly oceanFill: string;
  readonly label: string;
};

type MapNightView = {
  readonly area: string;
  readonly terminator: string;
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
  readonly night: MapNightView | null;
  readonly labelledBy: string;
  readonly describedBy: string;
  readonly onPreview: (zoneId: string | null) => void;
  readonly onSelect: (zoneId: string, source: MapSelectionSource) => void;
};

// Merged boundary zones mix land and open ocean, so each zone is drawn
// twice: a muted ocean fill that carries the listbox option and pointer
// input, then the full offset color clipped to land, where real IANA borders
// matter.
const LAND_CLIP_ID = "world-time-zones-land-clip";
const OCEAN_BORDER_COLOR = "#0d0d0f";
const LAND_BORDER_COLOR = "#050506";
// Outlines pair a dark halo with a white line, so one of the two contrasts at
// least 3:1 with any zone color, light or dark, land or ocean.
const OUTLINE_HALO_COLOR = "#000000";
const OUTLINE_COLOR = "#ffffff";

const OPTION_ID_PREFIX = "world-time-zone-option-";

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

function getZoneIdFromEvent(event: SyntheticEvent): string | null {
  const target = event.target;
  return target instanceof Element
    ? (target.closest<SVGElement>("[data-zone-id]")?.dataset["zoneId"] ?? null)
    : null;
}

// Options never take DOM focus: the listbox keeps focus and points at the
// selected option with aria-activedescendant.
function ZonePathView({
  zone,
  isSelected,
}: {
  readonly zone: MapZoneView;
  readonly isSelected: boolean;
}) {
  return (
    <path
      id={getOptionId(zone.tzid)}
      data-zone-id={zone.tzid}
      d={zone.d}
      fill={zone.oceanFill}
      fillRule="evenodd"
      stroke={OCEAN_BORDER_COLOR}
      strokeOpacity={0.6}
      strokeWidth={0.5}
      vectorEffect="non-scaling-stroke"
      role="option"
      aria-selected={isSelected}
      aria-label={zone.label}
      className="tw-cursor-pointer tw-transition-[fill] tw-duration-300 motion-reduce:tw-transition-none"
    />
  );
}

// A zone re-renders only when its own fill, label or selection changes.
const ZonePath = memo(ZonePathView);

// Full-color land fills with darker zone borders, clipped to the land mask.
function LandLayerView({
  land,
  zones,
}: {
  readonly land: string;
  readonly zones: readonly MapZoneView[];
}) {
  return (
    <>
      <defs>
        <clipPath id={LAND_CLIP_ID}>
          <path d={land} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${LAND_CLIP_ID})`}>
        {zones.map((zone) => (
          <path
            key={zone.tzid}
            d={zone.d}
            fill={zone.fill}
            fillRule="evenodd"
            stroke={LAND_BORDER_COLOR}
            strokeWidth={0.75}
            vectorEffect="non-scaling-stroke"
            className="tw-transition-[fill] tw-duration-300 motion-reduce:tw-transition-none"
          />
        ))}
      </g>
      <path
        d={land}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.28}
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

const LandLayer = memo(LandLayerView);

type OutlineVariant = "viewer" | "preview" | "selected" | "focused";

// White line widths per state; the dark halo is always wider, so the pair
// keeps at least 3:1 against any zone color, ocean or night shading. The
// keyboard-focused option gets the heaviest outline.
const OUTLINE_WIDTHS: Record<OutlineVariant, number> = {
  viewer: 1.5,
  preview: 1.5,
  selected: 2.5,
  focused: 3.5,
};

function ZoneOutline({
  zone,
  variant,
}: {
  readonly zone: MapZoneView;
  readonly variant: OutlineVariant;
}) {
  const width = OUTLINE_WIDTHS[variant];
  return (
    <>
      <path
        d={zone.d}
        fill="none"
        fillRule="evenodd"
        stroke={OUTLINE_HALO_COLOR}
        strokeOpacity={0.9}
        strokeWidth={width + (variant === "focused" ? 3 : 2)}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={zone.d}
        fill="none"
        fillRule="evenodd"
        stroke={OUTLINE_COLOR}
        strokeWidth={width}
        strokeDasharray={variant === "viewer" ? "5 3" : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function matchesFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return false;
  }
}

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
  night,
  labelledBy,
  describedBy,
  onPreview,
  onSelect,
}: WorldTimeZoneMapProps) {
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
  const selectedZone = findZone(zones, selectedZoneId);
  const previewZone = findZone(zones, previewZoneId);
  const viewerZone = findZone(zones, viewerZoneId);

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

  const handleClick = (event: SyntheticEvent) => {
    const zoneId = getZoneIdFromEvent(event);
    if (zoneId !== null) {
      setHasKeyboardFocus(false);
      onSelect(zoneId, "pointer");
    }
  };

  const handlePointerOver = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse") {
      onPreview(getZoneIdFromEvent(event));
    }
  };

  return (
    <svg
      viewBox={viewBox}
      role="listbox"
      tabIndex={0}
      aria-orientation="horizontal"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-activedescendant={
        selectedZone ? getOptionId(selectedZone.tzid) : undefined
      }
      className="tw-block tw-h-auto tw-w-full tw-touch-manipulation tw-select-none tw-outline-none"
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={() => setHasKeyboardFocus(false)}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerLeave={() => onPreview(null)}
    >
      {zones.map((zone) => (
        <ZonePath
          key={zone.tzid}
          zone={zone}
          isSelected={zone.tzid === selectedZone?.tzid}
        />
      ))}
      <g aria-hidden="true" pointerEvents="none">
        <LandLayer land={land} zones={zones} />
        {night ? (
          <g className="tw-transition-opacity tw-duration-500 motion-reduce:tw-transition-none">
            <path d={night.area} fill="#000000" fillOpacity={0.4} />
            <path
              d={night.terminator}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.55}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ) : null}
        {viewerZone ? <ZoneOutline zone={viewerZone} variant="viewer" /> : null}
        {previewZone && previewZone !== selectedZone ? (
          <ZoneOutline zone={previewZone} variant="preview" />
        ) : null}
        {selectedZone ? (
          <ZoneOutline
            zone={selectedZone}
            variant={hasKeyboardFocus ? "focused" : "selected"}
          />
        ) : null}
      </g>
    </svg>
  );
}
