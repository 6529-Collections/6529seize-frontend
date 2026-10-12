import {
  formatOffsetSuffix,
  formatZoneDate,
  formatZoneTime,
  getDstStatus,
  getGenericZoneName,
  getOffsetMinutes,
  haveSameYearClock,
  isSupportedTimeZone,
  parseOffsetMinutes,
} from "@/components/tools/time-zones/timeZoneClock";

const JANUARY_NOON_UTC = new Date(Date.UTC(2026, 0, 15, 12, 0));
const JULY_NOON_UTC = new Date(Date.UTC(2026, 6, 15, 12, 0));

describe("parseOffsetMinutes", () => {
  it.each([
    ["GMT", 0],
    ["UTC", 0],
    ["GMT+5:30", 330],
    ["GMT+05:30", 330],
    ["GMT-03:00", -180],
    ["GMT+05:45", 345],
    ["GMT+14:00", 840],
    ["GMT-12", -720],
    ["UTC−03:00", -180],
  ])("parses %s as %d minutes", (label, minutes) => {
    expect(parseOffsetMinutes(label)).toBe(minutes);
  });

  it.each(["", "EST", "GMT+", "+05:30", "GMT+5:3"])("rejects %p", (label) => {
    expect(parseOffsetMinutes(label)).toBeNull();
  });
});

describe("zone formatting at fixed instants", () => {
  it("formats Kolkata at UTC+05:30 all year", () => {
    expect(getOffsetMinutes("Asia/Kolkata", JANUARY_NOON_UTC)).toBe(330);
    expect(getOffsetMinutes("Asia/Kolkata", JULY_NOON_UTC)).toBe(330);
    expect(formatZoneTime("en-GB", "Asia/Kolkata", JANUARY_NOON_UTC)).toBe(
      "17:30"
    );
    expect(getDstStatus("Asia/Kolkata", JANUARY_NOON_UTC)).toBe("none");
  });

  it("applies Lord Howe's 30-minute daylight saving shift", () => {
    expect(getOffsetMinutes("Australia/Lord_Howe", JANUARY_NOON_UTC)).toBe(660);
    expect(getOffsetMinutes("Australia/Lord_Howe", JULY_NOON_UTC)).toBe(630);
    expect(
      formatZoneTime("en-GB", "Australia/Lord_Howe", JANUARY_NOON_UTC)
    ).toBe("23:00");
    expect(formatZoneTime("en-GB", "Australia/Lord_Howe", JULY_NOON_UTC)).toBe(
      "22:30"
    );
    expect(getDstStatus("Australia/Lord_Howe", JANUARY_NOON_UTC)).toBe(
      "daylight"
    );
    expect(getDstStatus("Australia/Lord_Howe", JULY_NOON_UTC)).toBe("standard");
  });

  it("derives northern-hemisphere daylight time from the year's offsets", () => {
    expect(getDstStatus("America/New_York", JULY_NOON_UTC)).toBe("daylight");
    expect(getDstStatus("America/New_York", JANUARY_NOON_UTC)).toBe("standard");
  });

  it("formats dates and generic names in the requested locale", () => {
    expect(
      formatZoneDate("en-US", "Pacific/Kiritimati", JANUARY_NOON_UTC)
    ).toBe("Fri, Jan 16");
    expect(getGenericZoneName("en-US", "Asia/Kolkata", JANUARY_NOON_UTC)).toBe(
      "India Standard Time"
    );
  });
});

describe("unknown zones", () => {
  it("returns null instead of throwing", () => {
    const zone = "Mars/Olympus_Mons";
    expect(isSupportedTimeZone(zone)).toBe(false);
    expect(getOffsetMinutes(zone, JANUARY_NOON_UTC)).toBeNull();
    expect(formatZoneTime("en-US", zone, JANUARY_NOON_UTC)).toBeNull();
    expect(getGenericZoneName("en-US", zone, JANUARY_NOON_UTC)).toBeNull();
    expect(getDstStatus(zone, JANUARY_NOON_UTC)).toBeNull();
  });
});

describe("formatOffsetSuffix", () => {
  it.each([
    [0, ""],
    [330, "+05:30"],
    [345, "+05:45"],
    [-180, "-03:00"],
    [-570, "-09:30"],
    [840, "+14:00"],
  ])("formats %d minutes as %p", (minutes, label) => {
    expect(formatOffsetSuffix(minutes)).toBe(label);
  });
});

describe("haveSameYearClock", () => {
  it("matches an alias to its current IANA name", () => {
    expect(haveSameYearClock("Asia/Calcutta", "Asia/Kolkata", 2026)).toBe(true);
  });

  it("separates zones that agree only part of the year", () => {
    expect(haveSameYearClock("Europe/Paris", "Africa/Lagos", 2026)).toBe(false);
  });
});
