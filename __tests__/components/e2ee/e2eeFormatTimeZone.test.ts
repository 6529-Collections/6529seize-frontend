import {
  formatE2eeDate,
  formatE2eeDateTime,
  formatE2eeLastActive,
  formatE2eeTimestamp,
  getE2eeDayKey,
  getE2eeDayLabel,
} from "@/components/e2ee/e2eeFormat";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";
import { runInTimeZone } from "../../utils/timeZoneHarness";

jest.setTimeout(60_000);

const FORMAT_MODULE = "components/e2ee/e2eeFormat.ts";
const UTC_ZONE: DisplayTimeZone = { timeZone: "UTC", isLocal: false };
const AUCKLAND_ZONE: DisplayTimeZone = {
  timeZone: "Pacific/Auckland",
  isLocal: false,
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// 2026-11-09 11:30 UTC: 03:30 that day in Los Angeles, and already
// 00:30 on Nov 10 in Auckland (UTC+13).
const NOW = Date.UTC(2026, 10, 9, 11, 30);
const SAMPLES = [0, -3 * HOUR, -11 * HOUR, -25 * HOUR, -6 * DAY, -8 * DAY]
  .map((offset) => NOW + offset)
  .concat(Date.UTC(2025, 9, 5, 11, 30));

describe("e2ee times in the device zone (no display zone chosen)", () => {
  // Literal strings the code produced before the display zone existed.
  it("keeps today's UTC output", () => {
    expect(
      SAMPLES.map((ms) => formatE2eeTimestamp("en-US", ms, { now: NOW }))
    ).toEqual([
      "11:30 AM",
      "08:30 AM",
      "12:30 AM",
      "Nov 8",
      "Nov 3",
      "Nov 1",
      "Oct 5, 2025",
    ]);
    expect(
      SAMPLES.map((ms) => getE2eeDayLabel("en-US", ms, { now: NOW }))
    ).toEqual([
      "Today",
      "Today",
      "Today",
      "Yesterday",
      "Tuesday",
      "Nov 1, 2026",
      "Oct 5, 2025",
    ]);
    expect(formatE2eeDateTime("en-US", NOW - 5 * MINUTE)).toBe(
      "Nov 9, 2026, 11:25 AM"
    );
  });

  it("treats the local zone object like no zone", () => {
    for (const ms of SAMPLES) {
      const options = { zone: LOCAL_DISPLAY_TIME_ZONE, now: NOW };
      expect(formatE2eeTimestamp("en-US", ms, options)).toBe(
        formatE2eeTimestamp("en-US", ms, { now: NOW })
      );
      expect(getE2eeDayLabel("en-US", ms, options)).toBe(
        getE2eeDayLabel("en-US", ms, { now: NOW })
      );
      expect(formatE2eeDateTime("en-US", ms, LOCAL_DISPLAY_TIME_ZONE)).toBe(
        formatE2eeDateTime("en-US", ms)
      );
      expect(getE2eeDayKey(ms, LOCAL_DISPLAY_TIME_ZONE)).toBe(
        getE2eeDayKey(ms)
      );
    }
  });

  it.each([
    [
      "America/Los_Angeles",
      [
        "03:30 AM",
        "12:30 AM",
        "Nov 8",
        "Nov 8",
        "Nov 3",
        "Nov 1",
        "Oct 5, 2025",
      ],
      [
        "Today",
        "Today",
        "Yesterday",
        "Yesterday",
        "Tuesday",
        "Nov 1, 2026",
        "Oct 5, 2025",
      ],
    ],
    [
      "Pacific/Auckland",
      ["12:30 AM", "Nov 9", "Nov 9", "Nov 8", "Nov 4", "Nov 2", "Oct 6, 2025"],
      [
        "Today",
        "Yesterday",
        "Yesterday",
        "Sunday",
        "Wednesday",
        "Nov 2, 2026",
        "Oct 6, 2025",
      ],
    ],
  ])("keeps the viewer's own days and times in %s", (zone, times, labels) => {
    const args = SAMPLES.map((ms) => ["en-US", ms, { now: NOW }]);
    expect(
      runInTimeZone<string>(zone, FORMAT_MODULE, "formatE2eeTimestamp", args)
    ).toEqual(times);
    expect(
      runInTimeZone<string>(zone, FORMAT_MODULE, "getE2eeDayLabel", args)
    ).toEqual(labels);
  });
});

describe("e2ee times in a chosen display zone", () => {
  it("names UTC on clock times but not on bare dates", () => {
    const options = { zone: UTC_ZONE, now: NOW };
    expect(formatE2eeTimestamp("en-US", NOW - 5 * MINUTE, options)).toBe(
      "11:25 AM UTC"
    );
    expect(formatE2eeTimestamp("en-US", NOW - 25 * HOUR, options)).toBe(
      "Nov 8"
    );
    expect(formatE2eeDateTime("en-US", NOW - 5 * MINUTE, UTC_ZONE)).toBe(
      "Nov 9, 2026, 11:25 AM UTC"
    );
    expect(formatE2eeDateTime("de-DE", NOW - 5 * MINUTE, UTC_ZONE)).toBe(
      "9. Nov. 2026, 11:25 UTC"
    );
  });

  it("flips Today and Yesterday at UTC midnight, even on a Los Angeles device", () => {
    const midnight = Date.UTC(2026, 10, 9);
    const options = { zone: UTC_ZONE, now: midnight + 30 * MINUTE };
    const instants = [midnight, midnight - MINUTE];
    expect(
      runInTimeZone<string>(
        "America/Los_Angeles",
        FORMAT_MODULE,
        "getE2eeDayLabel",
        instants.map((ms) => ["en-US", ms, options])
      )
    ).toEqual(["Today", "Yesterday"]);
    // The device's own zone puts both instants on the afternoon of Nov 8.
    expect(
      runInTimeZone<string>(
        "America/Los_Angeles",
        FORMAT_MODULE,
        "getE2eeDayLabel",
        instants.map((ms) => ["en-US", ms, { now: options.now }])
      )
    ).toEqual(["Today", "Today"]);
    expect(getE2eeDayKey(midnight, UTC_ZONE)).not.toBe(
      getE2eeDayKey(midnight - MINUTE, UTC_ZONE)
    );
    expect(getE2eeDayKey(midnight, UTC_ZONE)).toBe(
      getE2eeDayKey(midnight + 23 * HOUR, UTC_ZONE)
    );
  });

  it("lets Auckland's day differ from UTC's", () => {
    // 10:00 UTC on Nov 9 is 23:00 on Nov 9 in Auckland, where it is now Nov 10.
    const sameUtcDay = Date.UTC(2026, 10, 9, 10, 0);
    expect(
      getE2eeDayLabel("en-US", sameUtcDay, { zone: UTC_ZONE, now: NOW })
    ).toBe("Today");
    expect(
      getE2eeDayLabel("en-US", sameUtcDay, { zone: AUCKLAND_ZONE, now: NOW })
    ).toBe("Yesterday");
    expect(
      formatE2eeTimestamp("en-US", sameUtcDay, { zone: UTC_ZONE, now: NOW })
    ).toBe("10:00 AM UTC");
    expect(
      formatE2eeTimestamp("en-US", sameUtcDay, {
        zone: AUCKLAND_ZONE,
        now: NOW,
      })
    ).toBe("Nov 9");
    expect(
      formatE2eeTimestamp("en-US", NOW - 5 * MINUTE, {
        zone: AUCKLAND_ZONE,
        now: NOW,
      })
    ).toBe("12:25 AM GMT+13");
    expect(formatE2eeDateTime("en-US", NOW, AUCKLAND_ZONE)).toBe(
      "Nov 10, 2026, 12:30 AM GMT+13"
    );
    expect(getE2eeDayKey(sameUtcDay, UTC_ZONE)).toBe(
      getE2eeDayKey(NOW, UTC_ZONE)
    );
    expect(getE2eeDayKey(sameUtcDay, AUCKLAND_ZONE)).not.toBe(
      getE2eeDayKey(NOW, AUCKLAND_ZONE)
    );
  });

  it("uses the display zone's weekday and year", () => {
    expect(
      getE2eeDayLabel("en-US", Date.UTC(2026, 10, 6, 12, 0), {
        zone: AUCKLAND_ZONE,
        now: NOW,
      })
    ).toBe("Saturday");
    expect(
      getE2eeDayLabel("en-US", Date.UTC(2026, 10, 6, 12, 0), {
        zone: UTC_ZONE,
        now: NOW,
      })
    ).toBe("Friday");
    // Noon UTC on Dec 31 is already Jan 1 in Auckland: this year there.
    const newYear = { now: Date.UTC(2026, 0, 5) };
    expect(
      formatE2eeTimestamp("en-US", Date.UTC(2025, 11, 31, 12, 0), {
        ...newYear,
        zone: AUCKLAND_ZONE,
      })
    ).toBe("Jan 1");
    expect(
      formatE2eeTimestamp("en-US", Date.UTC(2025, 11, 31, 12, 0), {
        ...newYear,
        zone: UTC_ZONE,
      })
    ).toBe("Dec 31, 2025");
  });
});

describe("device dates in the display zone", () => {
  it("takes a date-only ending's day in the display zone", () => {
    // 11:30 UTC on Nov 9 is already Nov 10 in Auckland.
    expect(formatE2eeDate("en-US", NOW, UTC_ZONE)).toBe("Nov 9, 2026");
    expect(formatE2eeDate("en-US", NOW, AUCKLAND_ZONE)).toBe("Nov 10, 2026");
  });

  it("names the zone on a last-active time outside the device zone", () => {
    expect(formatE2eeLastActive("en-US", true, NOW, UTC_ZONE)).toBe(
      "Active now"
    );
    expect(formatE2eeLastActive("en-US", false, null, UTC_ZONE)).toBe(
      "Not active yet"
    );
    expect(formatE2eeLastActive("en-US", false, NOW, UTC_ZONE)).toBe(
      `Last active ${formatE2eeDateTime("en-US", NOW, UTC_ZONE)}`
    );
    expect(formatE2eeDateTime("en-US", NOW, UTC_ZONE)).toContain("UTC");
  });
});
