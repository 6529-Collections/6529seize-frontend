/** @jest-environment node */

type Point = [number, number];

type GeneratorModule = {
  buildWorldTimeZones: (
    featureCollection: unknown,
    zoneNames: Record<string, string[]>,
    options: {
      width: number;
      tolerance: number;
      minRingArea: number;
      release: string;
    },
    landCollection?: unknown
  ) => {
    viewBox: string;
    projection: { name: string; scale: number };
    source: { release: string };
    land: string;
    zones: { tzid: string; members: string[]; d: string }[];
  };
  densifyRing: (ring: Point[], stepDegrees?: number) => Point[];
  encodeRings: (rings: Point[][]) => string;
  quantizeRing: (ring: Point[]) => Point[];
  ringArea: (ring: Point[]) => number;
  simplifyDouglasPeucker: (points: Point[], tolerance: number) => Point[];
  simplifyRing: (ring: Point[], tolerance: number) => Point[];
};

const generator =
  require("../../scripts/generate-world-time-zones.cjs") as GeneratorModule;

function denseSquare(size: number, step: number): Point[] {
  const points: Point[] = [];
  for (let x = 0; x < size; x += step) points.push([x, 0]);
  for (let y = 0; y < size; y += step) points.push([size, y]);
  for (let x = size; x > 0; x -= step) points.push([x, size]);
  for (let y = size; y > 0; y -= step) points.push([0, y]);
  points.push([0, 0]);
  return points;
}

describe("simplifyDouglasPeucker", () => {
  it("drops points within tolerance and keeps the endpoints", () => {
    const line: Point[] = [
      [0, 0],
      [1, 0.1],
      [2, -0.1],
      [3, 0.05],
      [4, 0],
    ];
    expect(generator.simplifyDouglasPeucker(line, 0.5)).toEqual([
      [0, 0],
      [4, 0],
    ]);
  });

  it("keeps a corner that is farther than the tolerance", () => {
    const line: Point[] = [
      [0, 0],
      [5, 2.4],
      [10, 5],
      [15, 2.6],
      [20, 0],
    ];
    expect(generator.simplifyDouglasPeucker(line, 1)).toEqual([
      [0, 0],
      [10, 5],
      [20, 0],
    ]);
  });
});

describe("simplifyRing", () => {
  it("reduces a densely sampled square to its corners", () => {
    const simplified = generator.simplifyRing(denseSquare(10, 0.5), 0.1);
    expect(simplified).toHaveLength(4);
    expect(simplified).toEqual(
      expect.arrayContaining([
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ])
    );
    expect(generator.ringArea(simplified)).toBe(100);
  });
});

describe("quantizeRing", () => {
  it("rounds to the integer grid and removes repeated and closing points", () => {
    expect(
      generator.quantizeRing([
        [0.2, 0.4],
        [0.4, 0.1],
        [5.6, 0.2],
        [5.5, 4.6],
        [0.1, 0.3],
      ])
    ).toEqual([
      [0, 0],
      [6, 0],
      [6, 5],
    ]);
  });
});

describe("densifyRing", () => {
  it("adds points along long edges", () => {
    const ring = generator.densifyRing(
      [
        [0, 0],
        [0, 3],
      ],
      1
    );
    expect(ring).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]);
  });
});

describe("encodeRings", () => {
  it("writes an absolute move, relative lines and a close per ring", () => {
    expect(
      generator.encodeRings([
        [
          [10, 20],
          [15, 20],
          [12, 25],
        ],
        [
          [1, 1],
          [2, 1],
          [2, 2],
        ],
      ])
    ).toBe("M10 20l5 0-3 5zM1 1l1 0 0 1z");
  });
});

describe("buildWorldTimeZones", () => {
  const square = (west: number, south: number, size: number) => [
    [
      [west, south],
      [west + size, south],
      [west + size, south + size],
      [west, south + size],
      [west, south],
    ],
  ];

  it("projects, encodes and keeps tiny zones visible", () => {
    const output = generator.buildWorldTimeZones(
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { tzid: "Europe/Paris" },
            geometry: { type: "Polygon", coordinates: square(-5, 40, 20) },
          },
          {
            type: "Feature",
            properties: { tzid: "Etc/GMT+12" },
            geometry: {
              type: "MultiPolygon",
              coordinates: [square(-179, -1, 0.001)],
            },
          },
        ],
      },
      { "Europe/Paris": ["Europe/Paris", "Europe/Berlin"] },
      { width: 2000, tolerance: 0.35, minRingArea: 1.5, release: "test" },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { tzid: "Europe/Paris" },
            geometry: { type: "Polygon", coordinates: square(0, 45, 5) },
          },
        ],
      }
    );

    expect(output.viewBox).toBe("0 0 2000 974");
    expect(output.projection.name).toBe("equal-earth");
    expect(output.source).toEqual({ release: "test" });
    expect(output.zones.map((zone) => zone.tzid)).toEqual([
      "Etc/GMT+12",
      "Europe/Paris",
    ]);
    expect(output.zones[1]?.members).toEqual(["Europe/Paris", "Europe/Berlin"]);
    expect(output.zones[0]?.members).toEqual(["Etc/GMT+12"]);
    for (const zone of output.zones) {
      expect(zone.d).toMatch(/^M\d+ \d+l[-\d ]+z$/);
    }
    expect(output.land).toMatch(/^M\d+ \d+l[-\d ]+z$/);
  });
});
