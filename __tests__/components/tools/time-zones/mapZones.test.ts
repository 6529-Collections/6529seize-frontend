import {
  buildMapZoneSnapshots,
  findMapZoneForTimeZone,
} from "@/components/tools/time-zones/mapZones";
import type { WorldTimeZoneMapZone } from "@/components/tools/time-zones/mapGeometry";

const ZONES: readonly WorldTimeZoneMapZone[] = [
  { tzid: "Asia/Kolkata", members: ["Asia/Kolkata", "Asia/Colombo"], d: "" },
  { tzid: "Europe/Paris", members: ["Europe/Paris", "Europe/Berlin"], d: "" },
  { tzid: "Africa/Lagos", members: ["Africa/Lagos"], d: "" },
  { tzid: "Mars/Olympus_Mons", members: ["Mars/Olympus_Mons"], d: "" },
  { tzid: "America/Sao_Paulo", members: ["America/Sao_Paulo"], d: "" },
];

const JULY = new Date(Date.UTC(2026, 6, 15, 12));

describe("findMapZoneForTimeZone", () => {
  it("prefers exact membership", () => {
    expect(findMapZoneForTimeZone(ZONES, "Europe/Berlin", JULY)).toBe(
      "Europe/Paris"
    );
  });

  it("matches a browser alias by its clock across the year", () => {
    expect(findMapZoneForTimeZone(ZONES, "Asia/Calcutta", JULY)).toBe(
      "Asia/Kolkata"
    );
  });

  it("does not match a zone that agrees only today", () => {
    // Lagos and Paris differ in summer; Algiers matches Lagos all year.
    expect(findMapZoneForTimeZone(ZONES, "Africa/Algiers", JULY)).toBe(
      "Africa/Lagos"
    );
    expect(findMapZoneForTimeZone(ZONES, "Asia/Tokyo", JULY)).toBeNull();
    expect(findMapZoneForTimeZone(ZONES, "Not/AZone", JULY)).toBeNull();
  });
});

describe("buildMapZoneSnapshots", () => {
  it("orders zones west to east and puts unknown zones last", () => {
    const snapshots = buildMapZoneSnapshots(ZONES, "en-US", JULY);
    expect(snapshots.map((snapshot) => snapshot.zone.tzid)).toEqual([
      "America/Sao_Paulo",
      "Africa/Lagos",
      "Europe/Paris",
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
