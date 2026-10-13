#!/usr/bin/env node

// Builds the compact world map used by /tools/time-zones from public-domain
// sources only:
//
//   - Natural Earth land polygons (naturalearthdata.com, public domain), from
//     the tagged GeoJSON in the official nvkelso/natural-earth-vector
//     repository, for example geojson/ne_50m_land.geojson at v5.1.2.
//   - The IANA Time Zone Database (public domain): zone1970.tab gives each
//     zone's principal location as ISO 6709 coordinates, and the `backward`
//     file maps alias names to those zones.
//
// Download each source into its own directory, verify it (see the data
// README), unpack tzdata, and pass the paths explicitly:
//
//   node scripts/generate-world-time-zones.cjs \
//     --land <dir>/ne_50m_land.geojson \
//     --zone1970 <dir>/zone1970.tab \
//     --backward <dir>/backward \
//     --natural-earth v5.1.2 \
//     --tzdata 2026e \
//     --out components/tools/time-zones/data/world-time-zones.generated.json
//
// Pipeline (plain Node, no dependencies): densify long edges, project with
// Equal Earth (Šavrič, Patterson & Jenny, 2018), simplify rings with
// Douglas–Peucker in projected units, quantize to an integer grid, and encode
// compact relative SVG paths. Zone locations are projected to integer points.

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_WIDTH = 2000;
const DEFAULT_TOLERANCE = 0.45;
const DEFAULT_MIN_RING_AREA = 2;
const DENSIFY_STEP_DEGREES = 1;
const GRATICULE_STEP_DEGREES = 15;
// Nautical time-zone bands are centred on multiples of 15°, so their edges
// sit at ±7.5° from those meridians.
const GRATICULE_OFFSET_DEGREES = 7.5;

// Equal Earth coefficients.
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const DEGREES_TO_RADIANS = Math.PI / 180;

function equalEarth(longitude, latitude) {
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

function createProjector(width) {
  const scale = width / (2 * EQUAL_EARTH_X_MAX);
  const height = Math.ceil(2 * EQUAL_EARTH_Y_MAX * scale);
  return {
    scale,
    width,
    height,
    project(longitude, latitude) {
      const [x, y] = equalEarth(longitude, latitude);
      return [(x + EQUAL_EARTH_X_MAX) * scale, (EQUAL_EARTH_Y_MAX - y) * scale];
    },
  };
}

function densifyRing(ring, stepDegrees = DENSIFY_STEP_DEGREES) {
  const output = [];
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    output.push(current);
    const next = ring[index + 1];
    if (!next) {
      continue;
    }
    const span = Math.max(
      Math.abs(next[0] - current[0]),
      Math.abs(next[1] - current[1])
    );
    const segments = Math.ceil(span / stepDegrees);
    for (let step = 1; step < segments; step += 1) {
      const ratio = step / segments;
      output.push([
        current[0] + (next[0] - current[0]) * ratio,
        current[1] + (next[1] - current[1]) * ratio,
      ]);
    }
  }
  return output;
}

function squaredSegmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx !== 0 || dy !== 0) {
    const ratio =
      ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (ratio > 1) {
      x = end[0];
      y = end[1];
    } else if (ratio > 0) {
      x += dx * ratio;
      y += dy * ratio;
    }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

// Iterative Douglas–Peucker for an open polyline. Keeps both endpoints and
// every point farther than `tolerance` from the simplified chord.
function simplifyDouglasPeucker(points, tolerance) {
  if (points.length <= 2) {
    return points.slice();
  }
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const squaredTolerance = tolerance * tolerance;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let farthestIndex = -1;
    let farthestDistance = squaredTolerance;
    for (let index = first + 1; index < last; index += 1) {
      const distance = squaredSegmentDistance(
        points[index],
        points[first],
        points[last]
      );
      if (distance > farthestDistance) {
        farthestIndex = index;
        farthestDistance = distance;
      }
    }
    if (farthestIndex !== -1) {
      keep[farthestIndex] = 1;
      stack.push([first, farthestIndex], [farthestIndex, last]);
    }
  }
  return points.filter((_, index) => keep[index] === 1);
}

function isClosedRing(ring) {
  const first = ring[0];
  const last = ring.at(-1);
  return (
    ring.length > 1 &&
    first !== undefined &&
    last !== undefined &&
    first[0] === last[0] &&
    first[1] === last[1]
  );
}

function squaredDistance(left, right) {
  const dx = left[0] - right[0];
  const dy = left[1] - right[1];
  return dx * dx + dy * dy;
}

// Simplifies a closed ring (first point repeated last, as in GeoJSON). The
// ring is split at the point farthest from its start so both halves keep a
// stable anchor. Returns the open ring without the closing duplicate.
function simplifyRing(ring, tolerance) {
  const open = isClosedRing(ring) ? ring.slice(0, -1) : ring.slice();
  if (open.length <= 3) {
    return open;
  }
  let splitIndex = 0;
  let splitDistance = -1;
  for (let index = 1; index < open.length; index += 1) {
    const distance = squaredDistance(open[0], open[index]);
    if (distance > splitDistance) {
      splitIndex = index;
      splitDistance = distance;
    }
  }
  const firstHalf = simplifyDouglasPeucker(
    open.slice(0, splitIndex + 1),
    tolerance
  );
  const secondHalf = simplifyDouglasPeucker(
    [...open.slice(splitIndex), open[0]],
    tolerance
  );
  return [...firstHalf, ...secondHalf.slice(1, -1)];
}

// Rounds to an integer grid and removes consecutive duplicates (including a
// duplicate closing point).
function quantizeRing(ring) {
  const output = [];
  for (const point of ring) {
    const x = Math.round(point[0]);
    const y = Math.round(point[1]);
    const previous = output.at(-1);
    if (!previous || previous[0] !== x || previous[1] !== y) {
      output.push([x, y]);
    }
  }
  while (output.length > 1) {
    const first = output[0];
    const last = output.at(-1);
    if (first[0] !== last[0] || first[1] !== last[1]) {
      break;
    }
    output.pop();
  }
  return output;
}

function ringArea(ring) {
  let twiceArea = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(twiceArea) / 2;
}

function encodePolyline(points, close) {
  const [start, ...rest] = points;
  let previous = start;
  const steps = rest.map((point) => {
    const pair = `${point[0] - previous[0]} ${point[1] - previous[1]}`;
    previous = point;
    return pair;
  });
  const line = steps.length > 0 ? `l${steps.join(" ")}` : "";
  return `M${start[0]} ${start[1]}${line}${close ? "z" : ""}`.replaceAll(
    " -",
    "-"
  );
}

// Encodes integer rings as one SVG path: absolute move, relative lines,
// close. Negative numbers need no separator.
function encodeRings(rings) {
  return rings.map((ring) => encodePolyline(ring, true)).join("");
}

function projectRing(ring, projector) {
  return densifyRing(ring).map(([longitude, latitude]) =>
    projector.project(longitude, latitude)
  );
}

function getPolygons(geometry) {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

// One land path, drawn with the evenodd fill rule so lake holes stay open.
function buildLandPath(landCollection, projector, options) {
  const rings = [];
  for (const feature of landCollection.features) {
    for (const polygon of getPolygons(feature.geometry)) {
      for (const ring of polygon) {
        const simplified = quantizeRing(
          simplifyRing(projectRing(ring, projector), options.tolerance)
        );
        if (
          simplified.length >= 3 &&
          ringArea(simplified) >= options.minRingArea
        ) {
          rings.push(simplified);
        }
      }
    }
  }
  return encodeRings(rings);
}

function meridian(longitude) {
  return densifyRing([
    [longitude, 90],
    [longitude, -90],
  ]);
}

// The outline of the whole globe in this projection.
function buildSpherePath(projector, options) {
  const outline = [...meridian(-180), ...meridian(180).reverse(), [-180, 90]];
  const simplified = quantizeRing(
    simplifyRing(
      outline.map(([longitude, latitude]) =>
        projector.project(longitude, latitude)
      ),
      options.tolerance
    )
  );
  return encodeRings([simplified]);
}

// Faint meridians at the edges of the 24 nautical time-zone bands.
function buildGraticulePath(projector, options) {
  const lines = [];
  for (
    let longitude = -180 + GRATICULE_OFFSET_DEGREES;
    longitude < 180;
    longitude += GRATICULE_STEP_DEGREES
  ) {
    const projected = meridian(longitude).map(([lon, lat]) =>
      projector.project(lon, lat)
    );
    lines.push(
      encodePolyline(
        quantizeRing(simplifyDouglasPeucker(projected, options.tolerance)),
        false
      )
    );
  }
  return lines.join("");
}

const ISO_6709_PATTERN =
  /^([+-])(\d{2})(\d{2})(\d{2})?([+-])(\d{3})(\d{2})(\d{2})?$/;

function toDegrees(sign, degrees, minutes, seconds) {
  const value =
    Number(degrees) + Number(minutes) / 60 + Number(seconds ?? 0) / 3600;
  return sign === "-" ? -value : value;
}

// ISO 6709 as used by zone1970.tab: ±DDMM±DDDMM or ±DDMMSS±DDDMMSS.
function parseIso6709(text) {
  const match = ISO_6709_PATTERN.exec(text);
  if (!match) {
    throw new Error(`Invalid ISO 6709 coordinates: ${text}`);
  }
  const [, latSign, latDeg, latMin, latSec, lonSign, lonDeg, lonMin, lonSec] =
    match;
  return {
    latitude: toDegrees(latSign, latDeg, latMin, latSec),
    longitude: toDegrees(lonSign, lonDeg, lonMin, lonSec),
  };
}

function parseZone1970(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.startsWith("#"))
    .map((line) => {
      const [countries, coordinates, tzid] = line.split("\t");
      if (!countries || !coordinates || !tzid) {
        throw new Error(`Malformed zone1970.tab line: ${line}`);
      }
      return { tzid, ...parseIso6709(coordinates) };
    });
}

// "Link TARGET LINK-NAME" lines; only links to mapped zones are kept.
function parseLinks(text, zoneIds) {
  const links = {};
  for (const line of text.split(/\r?\n/)) {
    const [keyword, target, name] = line.trim().split(/\s+/);
    if (keyword === "Link" && target && name && zoneIds.has(target)) {
      links[name] = target;
    }
  }
  return Object.fromEntries(
    Object.entries(links).sort(([left], [right]) =>
      left.localeCompare(right, "en")
    )
  );
}

function buildWorldTimeZones(sources, options) {
  const projector = createProjector(options.width);
  const zones = parseZone1970(sources.zone1970)
    .map(({ tzid, latitude, longitude }) => {
      const [x, y] = projector.project(longitude, latitude);
      return { tzid, x: Math.round(x), y: Math.round(y) };
    })
    .sort((left, right) => left.tzid.localeCompare(right.tzid, "en"));
  const zoneIds = new Set(zones.map((zone) => zone.tzid));
  return {
    viewBox: `0 0 ${projector.width} ${projector.height}`,
    projection: { name: "equal-earth", scale: projector.scale },
    source: { naturalEarth: options.naturalEarth, tzdata: options.tzdata },
    sphere: buildSpherePath(projector, options),
    graticule: buildGraticulePath(projector, options),
    land: buildLandPath(sources.land, projector, options),
    zones,
    links: parseLinks(sources.backward, zoneIds),
  };
}

function parseArgs(argv) {
  const args = {
    width: DEFAULT_WIDTH,
    tolerance: DEFAULT_TOLERANCE,
    minRingArea: DEFAULT_MIN_RING_AREA,
  };
  const numeric = new Set(["width", "tolerance", "minRingArea"]);
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new Error(`Expected --flag value pairs, received ${flag}`);
    }
    const key = flag
      .slice(2)
      .replaceAll(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    args[key] = numeric.has(key) ? Number(value) : value;
  }
  for (const required of [
    "land",
    "zone1970",
    "backward",
    "naturalEarth",
    "tzdata",
    "out",
  ]) {
    if (!args[required]) {
      throw new Error(`Missing --${required}`);
    }
  }
  return args;
}

function readText(filePath) {
  return fs.readFileSync(path.resolve(filePath), "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const output = buildWorldTimeZones(
    {
      land: JSON.parse(readText(args.land)),
      zone1970: readText(args.zone1970),
      backward: readText(args.backward),
    },
    args
  );
  const serialized = `${JSON.stringify(output)}\n`;
  fs.writeFileSync(path.resolve(args.out), serialized);
  console.log(
    `Wrote ${output.zones.length} zone points, ${Object.keys(output.links).length} links and ${output.land.length} land path characters (${serialized.length} bytes) to ${args.out}`
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  buildWorldTimeZones,
  createProjector,
  densifyRing,
  encodeRings,
  parseIso6709,
  parseLinks,
  parseZone1970,
  quantizeRing,
  ringArea,
  simplifyDouglasPeucker,
  simplifyRing,
};
