import {
  EXTREME_TIME_ZONES,
  runInTimeZone,
  TEST_TIME_ZONES,
} from "../../utils/timeZoneHarness";

jest.setTimeout(60_000);

const MODULE = "components/reviewbot-admin/reviewbot-admin.format.ts";

describe("reviewbot admin formatDateTime", () => {
  it.each([...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES])(
    "prints the UTC time with its zone for an operator in %s",
    (zone) => {
      const results = runInTimeZone<string>(zone, MODULE, "formatDateTime", [
        ["2026-10-12T11:27:11.000Z"],
        // Already the next day in Auckland and Kiritimati.
        ["2026-10-12T23:30:00.000Z"],
      ]);

      expect(results).toEqual([
        "Oct 12, 2026, 11:27 AM UTC",
        "Oct 12, 2026, 11:30 PM UTC",
      ]);
    }
  );

  it.each(["", "not a date"])("reports %j as unknown", (value) => {
    const [result] = runInTimeZone<string>("UTC", MODULE, "formatDateTime", [
      [value],
    ]);

    expect(result).toBe("unknown");
  });
});
