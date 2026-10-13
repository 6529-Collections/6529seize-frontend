#!/usr/bin/env node

// Builds the compact world time-zone map used by /tools/time-zones.
//
// Input: one timezone-boundary-builder release (IANA zone polygons derived
// from OpenStreetMap, ODbL 1.0). Download these release assets into their own
// directory, verify the SHA-256 digests published with the release, unzip, and
// pass the paths explicitly:
//
//   - timezones-with-oceans-now.geojson.zip: the zones drawn on the map. "now"
//     merges zones whose clocks agree from the release date on; "with-oceans"
//     covers the whole globe.
//   - timezone-names-with-oceans-Now.json: the IANA zones each merged zone
//     stands for.
//   - timezones-now.geojson.zip (optional --land): land-only zones, the mask
//     that draws land in full color and open ocean muted, since land and ocean
//     share one merged zone.
//
//   node scripts/generate-world-time-zones.cjs \
//     --geojson <dir>/combined-with-oceans-now.json \
//     --names <dir>/timezone-names-with-oceans-Now.json \
//     --land <dir>/combined-now.json \
//     --release 2026e \
//     --out components/tools/time-zones/data/world-time-zones.generated.json
//
// Pipeline (plain Node, no dependencies):
//   1. densify long edges in longitude/latitude so straight ocean-zone
//      meridians follow the projected graticule;
//   2. project with Equal Earth (Šavrič, Patterson & Jenny, 2018), a
//      pseudo-cylindrical equal-area projection with a closed-form forward
//      formula;
//   3. simplify each ring with Douglas–Peucker in projected units;
//   4. quantize to an integer grid and encode compact relative SVG paths.
//
// The output keeps every zone (tiny island zones fall back to a minimal ring)
// so each IANA zone in the release stays visible and selectable.

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_WIDTH = 2000;
const DEFAULT_TOLERANCE = 0.35;
const DEFAULT_MIN_RING_AREA = 1.5;
const DENSIFY_STEP_DEGREES = 1;

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

function signedRingArea(ring) {
  let twiceArea = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return twiceArea / 2;
}

function ringArea(ring) {
  return Math.abs(signedRingArea(ring));
}

// Encodes integer rings as one SVG path: absolute move, relative lines,
// close. Negative numbers need no separator.
function encodeRings(rings) {
  return rings
    .map((ring) => {
      const [start, ...rest] = ring;
      let previous = start;
      const steps = rest.map((point) => {
        const pair = `${point[0] - previous[0]} ${point[1] - previous[1]}`;
        previous = point;
        return pair;
      });
      const line = steps.length > 0 ? `l${steps.join(" ")}` : "";
      return `M${start[0]} ${start[1]}${line}z`.replaceAll(" -", "-");
    })
    .join("");
}

function fallbackRing(ring) {
  const xs = ring.map((point) => Math.round(point[0]));
  const ys = ring.map((point) => Math.round(point[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs, minX + 1);
  const maxY = Math.max(...ys, minY + 1);
  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];
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

function projectRing(ring, projector) {
  return densifyRing(ring).map(([longitude, latitude]) =>
    projector.project(longitude, latitude)
  );
}

function buildZoneRings(geometry, projector, options) {
  const kept = [];
  let largest = null;
  for (const polygon of getPolygons(geometry)) {
    for (const ring of polygon) {
      const projected = projectRing(ring, projector);
      const simplified = quantizeRing(
        simplifyRing(projected, options.tolerance)
      );
      const area = simplified.length >= 3 ? ringArea(simplified) : 0;
      if (!largest || area > largest.area) {
        largest = { area, projected, simplified };
      }
      if (simplified.length >= 3 && area >= options.minRingArea) {
        kept.push(simplified);
      }
    }
  }
  if (kept.length === 0 && largest) {
    kept.push(
      largest.simplified.length >= 3 && largest.area > 0
        ? largest.simplified
        : fallbackRing(largest.projected)
    );
  }
  return kept;
}

// One land path from the exterior rings of the land-only release. Exteriors
// share one winding direction so the nonzero fill paints their union once;
// enclave holes are dropped because the enclosed zone's own exterior covers
// the same land.
function buildLandPath(landCollection, projector, options) {
  const rings = [];
  for (const feature of landCollection.features) {
    for (const [exterior] of getPolygons(feature.geometry)) {
      const simplified = quantizeRing(
        simplifyRing(projectRing(exterior, projector), options.tolerance)
      );
      if (
        simplified.length >= 3 &&
        ringArea(simplified) >= options.minRingArea
      ) {
        rings.push(
          signedRingArea(simplified) < 0 ? simplified.reverse() : simplified
        );
      }
    }
  }
  return encodeRings(rings);
}

function buildWorldTimeZones(
  featureCollection,
  zoneNames,
  options,
  landCollection = null
) {
  const projector = createProjector(options.width);
  const zones = featureCollection.features.map((feature) => {
    const tzid = feature.properties?.tzid;
    if (typeof tzid !== "string" || tzid.length === 0) {
      throw new Error("Every feature needs a string tzid property");
    }
    // Zones that merged nothing (for example the open-ocean Etc/GMT+12) may
    // be absent from the release's name map; they represent only themselves.
    const members = zoneNames[tzid] ?? [];
    if (!Array.isArray(members)) {
      throw new Error(`Member zones for ${tzid} must be an array`);
    }
    return {
      tzid,
      members: [...new Set([tzid, ...members])],
      d: encodeRings(buildZoneRings(feature.geometry, projector, options)),
    };
  });
  zones.sort((left, right) => left.tzid.localeCompare(right.tzid, "en"));
  return {
    viewBox: `0 0 ${projector.width} ${projector.height}`,
    projection: { name: "equal-earth", scale: projector.scale },
    source: { release: options.release },
    land: landCollection
      ? buildLandPath(landCollection, projector, options)
      : "",
    zones,
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
  for (const required of ["geojson", "names", "release", "out"]) {
    if (!args[required]) {
      throw new Error(`Missing --${required}`);
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const output = buildWorldTimeZones(
    readJson(args.geojson),
    readJson(args.names),
    args,
    args.land ? readJson(args.land) : null
  );
  const serialized = `${JSON.stringify(output)}\n`;
  fs.writeFileSync(path.resolve(args.out), serialized);
  console.log(
    `Wrote ${output.zones.length} zones and ${output.land.length} land path characters (${serialized.length} bytes) to ${args.out}`
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
  equalEarth,
  quantizeRing,
  ringArea,
  simplifyDouglasPeucker,
  simplifyRing,
};
