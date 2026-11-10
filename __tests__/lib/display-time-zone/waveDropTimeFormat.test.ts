import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";
import {
  formatWaveDropRevealTimestamp,
  formatWaveDropTimestamp,
  formatZonedClockTime,
  getZonedDaysAgo,
} from "@/lib/display-time-zone/waveDropTimeFormat";
import { searchTimeZones } from "@/lib/display-time-zone/timeZoneSearch";

// Jest runs with TZ=UTC, so the "device" zone in these tests is UTC.
const UTC: DisplayTimeZone = { timeZone: "UTC", isLocal: false };
const NEW_YORK: DisplayTimeZone = {
  timeZone: "America/New_York",
  isLocal: false,
};
const AUCKLAND: DisplayTimeZone = {
  timeZone: "Pacific/Auckland",
  isLocal: false,
};
const NOW = Date.parse("2026-11-09T17:30:00Z");
const base = { locale: "en-US" as const, formatLocale: "en-US", now: NOW };

describe("formatZonedClockTime", () => {
  it("keeps today's local output for the device zone", () => {
    const value = new Date("2026-11-09T17:06:00Z");
    expect(
      formatZonedClockTime(value, {
        zone: LOCAL_DISPLAY_TIME_ZONE,
        formatLocale: "en-US",
      })
    ).toBe(
      value.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
  });

  it("names the zone outside the device zone", () => {
    const value = new Date("2026-11-09T17:06:00Z");
    expect(
      formatZonedClockTime(value, { zone: UTC, formatLocale: "en-US" })
    ).toBe("05:06 PM UTC");
    expect(
      formatZonedClockTime(value, { zone: NEW_YORK, formatLocale: "en-US" })
    ).toBe("12:06 PM EST");
  });
});

describe("formatWaveDropTimestamp", () => {
  it("shows only the clock time today", () => {
    expect(
      formatWaveDropTimestamp(new Date("2026-11-09T17:06:00Z"), {
        ...base,
        zone: UTC,
      })
    ).toBe("05:06 PM UTC");
  });

  it("shows Yesterday and dates by the display zone's calendar", () => {
    const lateEvening = new Date("2026-11-09T03:00:00Z");
    // 03:00 UTC is still the same day in UTC...
    expect(formatWaveDropTimestamp(lateEvening, { ...base, zone: UTC })).toBe(
      "03:00 AM UTC"
    );
    // ...but the previous evening in New York.
    expect(
      formatWaveDropTimestamp(lateEvening, { ...base, zone: NEW_YORK })
    ).toBe("Yesterday - 10:00 PM EST");
  });

  it("shows dates for older posts and the day only on narrow screens", () => {
    const older = new Date("2026-11-07T08:12:00Z");
    expect(formatWaveDropTimestamp(older, { ...base, zone: UTC })).toBe(
      "Nov 07 - 08:12 AM UTC"
    );
    expect(
      formatWaveDropTimestamp(older, {
        ...base,
        zone: UTC,
        dateOnlyAfterToday: true,
      })
    ).toBe("Nov 07");
    expect(
      formatWaveDropTimestamp(new Date("2026-11-08T12:00:00Z"), {
        ...base,
        zone: UTC,
        dateOnlyAfterToday: true,
      })
    ).toBe("Yesterday");
  });

  it("adds the year for posts from another year in the display zone", () => {
    expect(
      formatWaveDropTimestamp(new Date("2025-12-31T12:00:00Z"), {
        ...base,
        zone: UTC,
      })
    ).toBe("Dec 31, 2025 - 12:00 PM UTC");
  });
});

describe("formatWaveDropRevealTimestamp", () => {
  it("uses the compact reveal formats", () => {
    expect(
      formatWaveDropRevealTimestamp(new Date("2026-11-08T12:00:00Z"), {
        ...base,
        zone: UTC,
      })
    ).toBe("Yesterday, 12:00 PM UTC");
    expect(
      formatWaveDropRevealTimestamp(new Date("2026-11-01T12:00:00Z"), {
        ...base,
        zone: UTC,
      })
    ).toBe("Nov 1, 12:00 PM UTC");
  });
});

describe("getZonedDaysAgo", () => {
  it("counts calendar days in the display zone", () => {
    const value = new Date("2026-11-09T10:00:00Z");
    const now = Date.parse("2026-11-09T12:00:00Z");
    expect(getZonedDaysAgo(value, UTC, now)).toBe(0);
    // Auckland is already on Nov 10 at 12:00 UTC but on Nov 9 at 10:00 UTC.
    expect(getZonedDaysAgo(value, AUCKLAND, now)).toBe(1);
  });
});

describe("searchTimeZones", () => {
  const zones = [
    "America/Argentina/Cordoba",
    "Atlantic/Bermuda",
    "Europe/Berlin",
    "Europe/Lisbon",
    "Europe/London",
    "America/Sao_Paulo",
  ];

  it("ranks city prefixes first and matches zone names", () => {
    expect(searchTimeZones("ber", zones)).toEqual([
      "Atlantic/Bermuda",
      "Europe/Berlin",
    ]);
    expect(searchTimeZones("europe/l", zones)).toEqual([
      "Europe/Lisbon",
      "Europe/London",
    ]);
  });

  it("ignores spaces, underscores and accents", () => {
    expect(searchTimeZones("São Paulo", zones)).toEqual(["America/Sao_Paulo"]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchTimeZones("  ", zones)).toEqual([]);
  });

  it("caps the number of results", () => {
    expect(searchTimeZones("e", zones, 2)).toHaveLength(2);
  });
});
