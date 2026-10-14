import {
  buildNightView,
  createMapProjector,
  getOffsetColor,
  getSubsolarPoint,
  OFFSET_LEGEND_HOURS,
} from "@/components/tools/time-zones/mapGeometry";
import mapData from "@/components/tools/time-zones/data/world-time-zones.generated.json";

const SCALE = mapData.projection.scale;
const [, , WIDTH, HEIGHT] = mapData.viewBox.split(" ").map(Number);

describe("createMapProjector", () => {
  it("matches the generated map's viewBox", () => {
    const project = createMapProjector(SCALE);
    expect(project(-180, 0)[0]).toBeCloseTo(0, 6);
    expect(project(180, 0)[0]).toBeCloseTo(WIDTH ?? 0, 6);
    expect(project(0, 90)[1]).toBeCloseTo(0, 6);
    expect(project(0, -90)[1]).toBeLessThanOrEqual(HEIGHT ?? 0);
    expect(project(0, -90)[1]).toBeGreaterThan((HEIGHT ?? 0) - 1);
  });
});

describe("getSubsolarPoint", () => {
  it("puts the sun over the Tropic of Cancer at the June solstice", () => {
    const point = getSubsolarPoint(new Date(Date.UTC(2026, 5, 21, 12)));
    expect(point.latitude).toBeCloseTo(23.44, 1);
    expect(Math.abs(point.longitude)).toBeLessThan(1);
  });

  it("puts the sun over the Tropic of Capricorn at the December solstice", () => {
    const point = getSubsolarPoint(new Date(Date.UTC(2026, 11, 21, 0)));
    expect(point.latitude).toBeCloseTo(-23.44, 1);
    expect(Math.abs(Math.abs(point.longitude) - 180)).toBeLessThan(2);
  });
});

describe("buildNightView", () => {
  it("returns a closed night area and an open terminator line inside the map", () => {
    const { area: path, terminator } = buildNightView(
      new Date(Date.UTC(2026, 9, 12, 18)),
      SCALE
    );
    expect(terminator.startsWith("M")).toBe(true);
    expect(terminator.endsWith("Z")).toBe(false);
    expect(path.startsWith(terminator)).toBe(true);
    expect(path).toMatch(/^M[\d.]+ [\d.]+L/);
    expect(path.endsWith("Z")).toBe(true);
    const numbers = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...numbers)).toBeLessThanOrEqual(WIDTH ?? 0);
  });

  it("stays finite at an equinox", () => {
    const { area, terminator } = buildNightView(
      new Date(Date.UTC(2026, 2, 20, 14, 46)),
      SCALE
    );
    for (const path of [area, terminator]) {
      expect(path).not.toContain("NaN");
      expect(path).not.toContain("Infinity");
    }
  });
});

describe("getOffsetColor", () => {
  it("uses a neutral midpoint for UTC and separate hues for each side", () => {
    expect(getOffsetColor(0)).toBe("#d4d4cf");
    const [westRed, , westBlue] = hexChannels(getOffsetColor(-6 * 60));
    const [eastRed, , eastBlue] = hexChannels(getOffsetColor(6 * 60));
    expect(westBlue).toBeGreaterThan(westRed);
    expect(eastRed).toBeGreaterThan(eastBlue);
  });

  it("gets darker with distance from UTC on both arms", () => {
    const lightness = (minutes: number) =>
      hexChannels(getOffsetColor(minutes)).reduce((sum, value) => sum + value);
    expect(lightness(-12 * 60)).toBeLessThan(lightness(-6 * 60));
    expect(lightness(-6 * 60)).toBeLessThan(lightness(0));
    expect(lightness(14 * 60)).toBeLessThan(lightness(6 * 60));
    expect(lightness(6 * 60)).toBeLessThan(lightness(0));
    expect(getOffsetColor(20 * 60)).toBe(getOffsetColor(14 * 60));
  });

  it("covers every whole-hour offset in the legend", () => {
    expect(OFFSET_LEGEND_HOURS[0]).toBe(-12);
    expect(OFFSET_LEGEND_HOURS.at(-1)).toBe(14);
    expect(OFFSET_LEGEND_HOURS).toHaveLength(27);
  });
});

function hexChannels(hex: string): [number, number, number] {
  const channel = (index: number) =>
    Number.parseInt(hex.slice(index, index + 2), 16);
  return [channel(1), channel(3), channel(5)];
}
