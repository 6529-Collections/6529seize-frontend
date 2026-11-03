import { describeLastXtdhGrantRun } from "@/components/user/xtdh/utils/xtdhGrantLastRun";

import {
  EXTREME_TIME_ZONES,
  runInTimeZone,
  TEST_TIME_ZONES,
} from "../../../../utils/timeZoneHarness";

jest.setTimeout(60_000);

const MODULE = "components/user/xtdh/utils/xtdhGrantLastRun.ts";

// The backend credits a grant's full UTC days up to the earlier of the daily
// 00:00 UTC cutoff and valid_to, so the last run that adds xTDH is the one at
// 00:00 UTC on valid_to's UTC date.
const CASES: ReadonlyArray<readonly [label: string, validTo: number]> = [
  ["midday", Date.UTC(2025, 11, 4, 12)],
  // 18:00 on 4 Dec in Los Angeles: the 5 Dec 00:00 UTC run still credits it.
  ["evening in the Americas", Date.UTC(2025, 11, 5, 2)],
  // 12:30 on 5 Dec in Auckland: only the 4 Dec 00:00 UTC run is before it.
  ["morning in New Zealand", Date.UTC(2025, 11, 4, 23, 30)],
  ["exactly 00:00 UTC", Date.UTC(2025, 11, 5)],
];

describe("describeLastXtdhGrantRun", () => {
  it.each(CASES)(
    "uses the 00:00 UTC run on the UTC date (%s)",
    (_, validTo) => {
      const run = describeLastXtdhGrantRun("en-US", validTo);
      const utcDate = new Date(validTo).toISOString().slice(0, 10);

      expect(run?.iso).toBe(`${utcDate}T00:00:00.000Z`);
    }
  );

  it("labels the run with its UTC date, time and zone", () => {
    expect(describeLastXtdhGrantRun("en-US", Date.UTC(2025, 11, 5, 2))).toEqual(
      {
        iso: "2025-12-05T00:00:00.000Z",
        label: "Dec 5, 2025, 00:00 UTC",
      }
    );
    expect(
      describeLastXtdhGrantRun("de-DE", Date.UTC(2025, 11, 5, 2))?.label
    ).toBe("5. Dez. 2025, 00:00 UTC");
  });

  it("accepts ISO strings and rejects values that are not instants", () => {
    expect(describeLastXtdhGrantRun("en-US", "2025-12-04T23:59:59Z")?.iso).toBe(
      "2025-12-04T00:00:00.000Z"
    );
    expect(describeLastXtdhGrantRun("en-US", "not a date")).toBeNull();
    expect(describeLastXtdhGrantRun("en-US", Number.NaN)).toBeNull();
  });

  it.each([...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES])(
    "shows the same run to a viewer in %s",
    (zone) => {
      const labels = runInTimeZone<{ iso: string; label: string } | null>(
        zone,
        MODULE,
        "describeLastXtdhGrantRun",
        CASES.map(([, validTo]) => ["en-US", validTo])
      );

      expect(labels).toEqual([
        { iso: "2025-12-04T00:00:00.000Z", label: "Dec 4, 2025, 00:00 UTC" },
        { iso: "2025-12-05T00:00:00.000Z", label: "Dec 5, 2025, 00:00 UTC" },
        { iso: "2025-12-04T00:00:00.000Z", label: "Dec 4, 2025, 00:00 UTC" },
        { iso: "2025-12-05T00:00:00.000Z", label: "Dec 5, 2025, 00:00 UTC" },
      ]);
    }
  );
});
