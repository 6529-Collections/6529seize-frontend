import { printMintDate } from "@/helpers/Helpers";
import { formatMintDate } from "@/helpers/mint-date.helpers";
import { mockDefaultTimeZone } from "@/__tests__/utils/timeZoneHydration";

// Close to both ends of the UTC day, so a local-zone formatter would move it.
const EARLY_UTC = "2026-10-12T00:30:00.000Z";
const LATE_UTC = "2026-10-12T23:30:00.000Z";

describe.each(["UTC", "America/Los_Angeles", "Pacific/Auckland"])(
  "mint dates for a viewer in %s",
  (timeZone) => {
    let restoreTimeZone: () => void = () => undefined;

    beforeEach(() => {
      restoreTimeZone = mockDefaultTimeZone(timeZone);
    });

    afterEach(() => {
      restoreTimeZone();
    });

    it.each([EARLY_UTC, LATE_UTC])(
      "formats %s as the UTC mint day",
      (value) => {
        expect(formatMintDate("en-US", value)).toBe("Oct 12, 2026");
        expect(formatMintDate("de-DE", new Date(value))).toBe("12. Okt. 2026");
        expect(printMintDate(new Date(value))).toBe("Oct 12, 2026");
        expect(printMintDate(new Date(value), "en-GB")).toBe("12 Oct 2026");
      }
    );

    it("keeps the dash for a missing or invalid mint date", () => {
      expect(formatMintDate("en-US", undefined)).toBe("-");
      expect(formatMintDate("en-US", "not a date")).toBe("-");
      expect(printMintDate()).toBe("-");
    });
  }
);
