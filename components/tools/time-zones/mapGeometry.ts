// Client-side geometry for the world time-zone map: the same Equal Earth
// projection the data generator uses (scripts/generate-world-time-zones.cjs),
// a solar day/night terminator, and the offset color scale.

// One IANA zone at its principal location (zone1970.tab), projected.
export type WorldTimeZoneMapZone = {
  readonly tzid: string;
  readonly x: number;
  readonly y: number;
};

export type WorldTimeZoneMapData = {
  readonly viewBox: string;
  readonly projection: { readonly name: string; readonly scale: number };
  readonly source: { readonly naturalEarth: string; readonly tzdata: string };
  readonly sphere: string;
  readonly graticule: string;
  readonly land: string;
  readonly zones: readonly WorldTimeZoneMapZone[];
  // IANA alias name -> mapped zone, from tzdata's `backward` file.
  readonly links: Readonly<Record<string, string>>;
};

type Point = readonly [number, number];

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

function equalEarth(longitude: number, latitude: number): Point {
  const lambda = longitude * DEGREES_TO_RADIANS;
  const theta = Math.asin(M * Math.sin(latitude * DEGREES_TO_RADIANS));
  const theta2 = theta * theta;
  const theta6 = theta2 * theta2 * theta2;
  return [
    (lambda * Math.cos(theta)) /
      (M * (A1 + 3 * A2 * theta2 + theta6 * (7 * A3 + 9 * A4 * theta2))),
    theta * (A1 + A2 * theta2 + theta6 * (A3 + A4 * theta2)),
  ];
}

const [EQUAL_EARTH_X_MAX] = equalEarth(180, 0);
const [, EQUAL_EARTH_Y_MAX] = equalEarth(0, 90);

export function createMapProjector(scale: number) {
  return (longitude: number, latitude: number): Point => {
    const [x, y] = equalEarth(longitude, latitude);
    return [(x + EQUAL_EARTH_X_MAX) * scale, (EQUAL_EARTH_Y_MAX - y) * scale];
  };
}

const MS_PER_DAY = 86_400_000;
const J2000_MS = Date.UTC(2000, 0, 1, 12);

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function normalizeLongitude(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

// Low-precision solar position (Astronomical Almanac approximation, accurate
// to about 0.01° in declination for current dates) — plenty for a world map.
export function getSubsolarPoint(date: Date): {
  readonly latitude: number;
  readonly longitude: number;
} {
  const days = (date.getTime() - J2000_MS) / MS_PER_DAY;
  const meanLongitude = 280.46 + 0.9856474 * days;
  const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * days);
  const anomaly = meanAnomaly * DEGREES_TO_RADIANS;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) *
    DEGREES_TO_RADIANS;
  const obliquity = (23.439 - 0.0000004 * days) * DEGREES_TO_RADIANS;
  const declination = Math.asin(
    Math.sin(obliquity) * Math.sin(eclipticLongitude)
  );
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude)
  );
  const greenwichSiderealTime = 280.46061837 + 360.98564736629 * days;
  return {
    latitude: declination * RADIANS_TO_DEGREES,
    longitude: normalizeLongitude(
      rightAscension * RADIANS_TO_DEGREES - greenwichSiderealTime
    ),
  };
}

const TERMINATOR_STEP_DEGREES = 2;
// Keeps the terminator formula finite at the equinoxes.
const MIN_DECLINATION_DEGREES = 0.01;

function formatPoint([x, y]: Point): string {
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

function terminatorLatitude(
  longitude: number,
  subsolarLongitude: number,
  declinationRadians: number
): number {
  return (
    Math.atan(
      -Math.cos((longitude - subsolarLongitude) * DEGREES_TO_RADIANS) /
        Math.tan(declinationRadians)
    ) * RADIANS_TO_DEGREES
  );
}

function meridianPoints(
  longitude: number,
  fromLatitude: number,
  toLatitude: number
): Array<readonly [number, number]> {
  const points: Array<readonly [number, number]> = [];
  const direction = toLatitude > fromLatitude ? 1 : -1;
  const steps = Math.ceil(
    Math.abs(toLatitude - fromLatitude) / TERMINATOR_STEP_DEGREES
  );
  for (let step = 1; step <= steps; step += 1) {
    points.push([
      longitude,
      step === steps
        ? toLatitude
        : fromLatitude + direction * step * TERMINATOR_STEP_DEGREES,
    ]);
  }
  return points;
}

function toPath(
  points: ReadonlyArray<readonly [number, number]>,
  scale: number,
  close: boolean
): string {
  const project = createMapProjector(scale);
  const [start, ...rest] = points.map(([longitude, latitude]) =>
    project(longitude, latitude)
  );
  if (!start) {
    return "";
  }
  return `M${formatPoint(start)}L${rest.map(formatPoint).join(" ")}${close ? "Z" : ""}`;
}

// SVG paths, in projected map coordinates, for the part of the globe where
// the sun is below the horizon and for the day/night line itself.
export function buildNightView(
  date: Date,
  scale: number
): { readonly area: string; readonly terminator: string } {
  const subsolar = getSubsolarPoint(date);
  const declination =
    Math.sign(subsolar.latitude || 1) *
    Math.max(Math.abs(subsolar.latitude), MIN_DECLINATION_DEGREES);
  const declinationRadians = declination * DEGREES_TO_RADIANS;
  // The night cap reaches the pole facing away from the sun.
  const nightPole = declination > 0 ? -90 : 90;

  const curve: Array<readonly [number, number]> = [];
  for (
    let longitude = -180;
    longitude <= 180;
    longitude += TERMINATOR_STEP_DEGREES
  ) {
    curve.push([
      longitude,
      terminatorLatitude(longitude, subsolar.longitude, declinationRadians),
    ]);
  }
  const eastLatitude = curve.at(-1)?.[1] ?? 0;
  const westLatitude = curve[0]?.[1] ?? 0;
  const outline = [
    ...curve,
    ...meridianPoints(180, eastLatitude, nightPole),
    [-180, nightPole] as const,
    ...meridianPoints(-180, nightPole, westLatitude),
  ];
  return {
    area: toPath(outline, scale, true),
    terminator: toPath(curve, scale, false),
  };
}

// Diverging scale for zone dots: UTC is a light neutral, zones behind UTC
// run through blue and zones ahead of UTC through red, with equal steps per
// hour on both arms. The blue ramp and the red ramp share the same OKLCH
// lightness steps, so both arms darken at the same rate. Dots carry a light
// ring, so every step stays visible on the dark map.
const NEUTRAL_MIDPOINT = "#d4d4cf";
const WEST_RAMP = [
  NEUTRAL_MIDPOINT,
  "#b7d3f6",
  "#86b6ef",
  "#5598e7",
  "#2a78d6",
  "#1c5cab",
  "#104281",
] as const;
const EAST_RAMP = [
  NEUTRAL_MIDPOINT,
  "#f4c3ba",
  "#ea9b8e",
  "#dc7262",
  "#c74a3a",
  "#9e3528",
  "#762319",
] as const;
const MAX_OFFSET_MINUTES = 14 * 60;
export const UNKNOWN_ZONE_COLOR = "#60606c";

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixHex(from: string, to: string, ratio: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const mixed = start.map((channel, index) =>
    Math.round(channel + ((end[index] ?? channel) - channel) * ratio)
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function getOffsetColor(offsetMinutes: number): string {
  const ramp = offsetMinutes < 0 ? WEST_RAMP : EAST_RAMP;
  const position =
    Math.min(Math.abs(offsetMinutes) / MAX_OFFSET_MINUTES, 1) *
    (ramp.length - 1);
  const lowerIndex = Math.floor(position);
  const lower = ramp[lowerIndex] ?? NEUTRAL_MIDPOINT;
  const upper = ramp[Math.min(lowerIndex + 1, ramp.length - 1)] ?? lower;
  return mixHex(lower, upper, position - lowerIndex);
}

export const OFFSET_LEGEND_HOURS = Array.from(
  { length: 27 },
  (_, index) => index - 12
);
