/** @jest-environment node */

type Point = [number, number];

type GeneratorOutput = {
  viewBox: string;
  projection: { name: string; scale: number };
  source: { naturalEarth: string; tzdata: string };
  sphere: string;
  graticule: string;
  land: string;
  zones: { tzid: string; x: number; y: number }[];
  links: Record<string, string>;
};

type GeneratorModule = {
  buildWorldTimeZones: (
    sources: { land: unknown; zone1970: string; backward: string },
    options: {
      width: number;
      tolerance: number;
      minRingArea: number;
      naturalEarth: string;
      tzdata: string;
    }
  ) => GeneratorOutput;
  createProjector: (width: number) => {
    project: (longitude: number, latitude: number) => Point;
  };
  densifyRing: (ring: Point[], stepDegrees?: number) => Point[];
  encodeRings: (rings: Point[][]) => string;
  parseIso6709: (text: string) => { latitude: number; longitude: number };
  parseLinks: (text: string, zoneIds: Set<string>) => Record<string, string>;
  parseZone1970: (
    text: string
  ) => { tzid: string; latitude: number; longitude: number }[];
  quantizeRing: (ring: Point[]) => Point[];
  ringArea: (ring: Point[]) => number;
  simplifyDouglasPeucker: (points: Point[], tolerance: number) => Point[];
  simplifyRing: (ring: Point[], tolerance: number) => Point[];
};

const generator =
  require("../../scripts/generate-world-time-zones.cjs") as GeneratorModule;

const ZONE1970 = [
  "# tzdb timezone descriptions",
  "#codes\tcoordinates\tTZ\tcomments",
  "IN\t+2232+08822\tAsia/Kolkata",
  "AU\t-3133+15905\tAustralia/Lord_Howe\tLord Howe Island",
  "BE,LU,NL\t+5050+00420\tEurope/Brussels",
  "US\t+404251-0740023\tAmerica/New_York\tEastern (most areas)",
  "",
].join("\n");

const BACKWARD = [
  "# Links for backward compatibility",
  "Link\tEurope/Brussels\t\tEurope/Amsterdam",
  "Link\tAsia/Kolkata\t\tAsia/Calcutta",
  "Link\tEurope/Kyiv\t\tEurope/Kiev",
].join("\n");

function denseSquare(size: number, step: number): Point[] {
  const points: Point[] = [];
  for (let x = 0; x < size; x += step) points.push([x, 0]);
  for (let y = 0; y < size; y += step) points.push([size, y]);
  for (let x = size; x > 0; x -= step) points.push([x, size]);
  for (let y = size; y > 0; y -= step) points.push([0, y]);
  points.push([0, 0]);
  return points;
}

describe("parseIso6709", () => {
  it("reads degree-minute and degree-minute-second coordinates", () => {
    expect(generator.parseIso6709("+2232+08822")).toEqual({
      latitude: 22 + 32 / 60,
      longitude: 88 + 22 / 60,
    });
    const newYork = generator.parseIso6709("+404251-0740023");
    expect(newYork.latitude).toBeCloseTo(40.7142, 4);
    expect(newYork.longitude).toBeCloseTo(-74.0064, 4);
    expect(generator.parseIso6709("-3133+15905").latitude).toBeCloseTo(
      -31.55,
      2
    );
  });

  it("rejects malformed coordinates", () => {
    expect(() => generator.parseIso6709("2232+08822")).toThrow(
      "Invalid ISO 6709"
    );
  });
});

describe("parseZone1970 and parseLinks", () => {
  it("skips comments and keeps one entry per zone", () => {
    expect(generator.parseZone1970(ZONE1970).map((zone) => zone.tzid)).toEqual([
      "Asia/Kolkata",
      "Australia/Lord_Howe",
      "Europe/Brussels",
      "America/New_York",
    ]);
  });

  it("keeps only aliases of mapped zones, sorted by name", () => {
    expect(
      generator.parseLinks(
        BACKWARD,
        new Set(["Europe/Brussels", "Asia/Kolkata"])
      )
    ).toEqual({
      "Asia/Calcutta": "Asia/Kolkata",
      "Europe/Amsterdam": "Europe/Brussels",
    });
  });
});

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

describe("simplifyRing and quantizeRing", () => {
  it("reduces a densely sampled square to its corners", () => {
    const simplified = generator.simplifyRing(denseSquare(10, 0.5), 0.1);
    expect(simplified).toHaveLength(4);
    expect(generator.ringArea(simplified)).toBe(100);
  });

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

  it("densifies long edges", () => {
    expect(
      generator.densifyRing(
        [
          [0, 0],
          [0, 3],
        ],
        1
      )
    ).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]);
  });

  it("encodes absolute moves, relative lines and closes", () => {
    expect(
      generator.encodeRings([
        [
          [10, 20],
          [15, 20],
          [12, 25],
        ],
      ])
    ).toBe("M10 20l5 0-3 5z");
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

  it("projects zone locations, land, the globe outline and band lines", () => {
    const output = generator.buildWorldTimeZones(
      {
        land: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: square(70, 10, 20) },
            },
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "MultiPolygon",
                coordinates: [square(-10, 40, 0.0001)],
              },
            },
          ],
        },
        zone1970: ZONE1970,
        backward: BACKWARD,
      },
      {
        width: 2000,
        tolerance: 0.45,
        minRingArea: 2,
        naturalEarth: "v-test",
        tzdata: "test",
      }
    );

    expect(output.viewBox).toBe("0 0 2000 974");
    expect(output.source).toEqual({ naturalEarth: "v-test", tzdata: "test" });
    expect(output.zones.map((zone) => zone.tzid)).toEqual([
      "America/New_York",
      "Asia/Kolkata",
      "Australia/Lord_Howe",
      "Europe/Brussels",
    ]);
    const kolkata = output.zones[1];
    const [x, y] = generator
      .createProjector(2000)
      .project(88 + 22 / 60, 22 + 32 / 60);
    expect(kolkata).toEqual({
      tzid: "Asia/Kolkata",
      x: Math.round(x),
      y: Math.round(y),
    });
    for (const zone of output.zones) {
      expect(Number.isInteger(zone.x) && Number.isInteger(zone.y)).toBe(true);
    }
    expect(output.links).toEqual({
      "Asia/Calcutta": "Asia/Kolkata",
      "Europe/Amsterdam": "Europe/Brussels",
    });
    // The tiny island is below the minimum ring area and is dropped.
    expect(output.land.match(/M/g)).toHaveLength(1);
    expect(output.sphere).toMatch(/^M\d+ \d+l[-\d ]+z$/);
    expect(output.graticule.match(/M/g)).toHaveLength(24);
  });
});
