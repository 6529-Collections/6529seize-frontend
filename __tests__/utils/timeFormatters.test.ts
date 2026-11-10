import { formatCountdown } from "@/utils/timeFormatters";
import { LOCAL_DISPLAY_TIME_ZONE } from "@/lib/display-time-zone/displayTimeZone";
import { mockDefaultTimeZone } from "./timeZoneHydration";

describe("formatCountdown", () => {
  const realDateNow = Date.now;
  let now: number;

  beforeEach(() => {
    now = 1600000000000; // fixed timestamp
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  it("returns empty string for null timestamp", () => {
    expect(formatCountdown(null)).toBe("");
  });

  it('returns "Now" when timestamp has passed', () => {
    expect(formatCountdown(now - 1000)).toBe("Now");
  });

  it("formats times less than a day", () => {
    const thirtyMinutes = now + 30 * 60 * 1000;
    expect(formatCountdown(thirtyMinutes)).toBe("in 30m");

    const twoHoursFifteen = now + 2 * 60 * 60 * 1000 + 15 * 60 * 1000;
    expect(formatCountdown(twoHoursFifteen)).toBe("in 2h 15m");
  });

  it("formats times less than a week", () => {
    const twoDaysThreeHours =
      now + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000;
    expect(formatCountdown(twoDaysThreeHours)).toBe("in 2d 3h");
  });

  it("formats distant future dates", () => {
    const inTenDays = now + 10 * 24 * 60 * 60 * 1000;
    const expected = new Date(inTenDays).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    expect(formatCountdown(inTenDays)).toBe(expected);
  });

  describe("display time zone for distant dates", () => {
    // 00:30 UTC on Sep 24 is still Sep 23 in Los Angeles; 10+ days ahead.
    const target = Date.UTC(2020, 8, 24, 0, 30);
    const dateIn = (timeZone: string) =>
      new Date(target).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        timeZone,
      });
    let restoreZone: () => void;

    beforeEach(() => {
      restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    });

    afterEach(() => {
      restoreZone();
    });

    it("keeps the device-zone date when local", () => {
      expect(formatCountdown(target)).toBe(dateIn("America/Los_Angeles"));
      expect(formatCountdown(target, LOCAL_DISPLAY_TIME_ZONE)).toBe(
        dateIn("America/Los_Angeles")
      );
    });

    it("flips the date at the display zone's midnight", () => {
      expect(dateIn("UTC")).not.toBe(dateIn("America/Los_Angeles"));
      expect(formatCountdown(target, { timeZone: "UTC", isLocal: false })).toBe(
        dateIn("UTC")
      );
    });

    it("leaves relative countdowns alone", () => {
      expect(
        formatCountdown(now + 30 * 60 * 1000, {
          timeZone: "UTC",
          isLocal: false,
        })
      ).toBe("in 30m");
    });
  });
});
