import {
  buildMapZoneSnapshots,
  findMapZoneForTimeZone,
} from "@/components/tools/time-zones/mapZones";
import type { WorldTimeZoneMapZone } from "@/components/tools/time-zones/mapGeometry";

const ZONES: readonly WorldTimeZoneMapZone[] = [
  { tzid: "Asia/Kolkata", x: 1400, y: 380 },
  { tzid: "Europe/Brussels", x: 1010, y: 210 },
  { tzid: "Europe/Paris", x: 1005, y: 220 },
  { tzid: "Africa/Lagos", x: 1010, y: 450 },
  { tzid: "Mars/Olympus_Mons", x: 10, y: 10 },
  { tzid: "America/Sao_Paulo", x: 700, y: 640 },
];
const LINKS = { "Europe/Amsterdam": "Europe/Brussels" };

const JULY = new Date(Date.UTC(2026, 6, 15, 12));

describe("findMapZoneForTimeZone", () => {
  it("prefers the zone's own dot", () => {
    expect(findMapZoneForTimeZone(ZONES, LINKS, "Europe/Paris", JULY)).toBe(
      "Europe/Paris"
    );
  });

  it("follows tzdata alias links", () => {
    expect(findMapZoneForTimeZone(ZONES, LINKS, "Europe/Amsterdam", JULY)).toBe(
      "Europe/Brussels"
    );
  });

  it("matches a legacy browser name to its current IANA name", () => {
    expect(findMapZoneForTimeZone(ZONES, LINKS, "Asia/Calcutta", JULY)).toBe(
      "Asia/Kolkata"
    );
  });

  it("falls back to a dot whose clock matches all year", () => {
    // Algiers matches Lagos all year; Paris differs in summer.
    expect(findMapZoneForTimeZone(ZONES, LINKS, "Africa/Algiers", JULY)).toBe(
      "Africa/Lagos"
    );
    expect(findMapZoneForTimeZone(ZONES, LINKS, "Asia/Tokyo", JULY)).toBeNull();
    expect(findMapZoneForTimeZone(ZONES, LINKS, "Not/AZone", JULY)).toBeNull();
  });
});

describe("buildMapZoneSnapshots", () => {
  it("orders dots west to east by offset, then position, and puts unknown zones last", () => {
    const snapshots = buildMapZoneSnapshots(ZONES, "en-US", JULY);
    expect(snapshots.map((snapshot) => snapshot.zone.tzid)).toEqual([
      "America/Sao_Paulo",
      "Africa/Lagos",
      "Europe/Paris",
      "Europe/Brussels",
      "Asia/Kolkata",
      "Mars/Olympus_Mons",
    ]);
    expect(snapshots.at(-1)).toMatchObject({
      offsetMinutes: null,
      name: "Mars/Olympus_Mons",
      time: null,
      dst: null,
    });
    expect(snapshots[2]).toMatchObject({
      offsetMinutes: 120,
      name: "Central European Time",
      dst: "daylight",
    });
  });
});
