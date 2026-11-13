import {
  getTimeZoneCityName,
  getTimeZoneShortName,
  isValidTimeZone,
  LOCAL_DISPLAY_TIME_ZONE,
  normalizeDisplayTimeZonePreference,
  resolveDisplayTimeZone,
  withDisplayTimeZone,
  withDisplayTimeZoneDate,
} from "@/lib/display-time-zone/displayTimeZone";

const INSTANT = new Date("2026-11-09T17:06:00Z");
const UTC_ZONE = { timeZone: "UTC", isLocal: false } as const;

describe("normalizeDisplayTimeZonePreference", () => {
  it("keeps local, UTC and valid IANA zones", () => {
    expect(normalizeDisplayTimeZonePreference("local")).toBe("local");
    expect(normalizeDisplayTimeZonePreference("UTC")).toBe("UTC");
    expect(normalizeDisplayTimeZonePreference("Europe/Berlin")).toBe(
      "Europe/Berlin"
    );
  });

  it("falls back to local for corrupt or unknown values", () => {
    expect(normalizeDisplayTimeZonePreference("Mars/Olympus")).toBe("local");
    expect(normalizeDisplayTimeZonePreference("")).toBe("local");
    expect(normalizeDisplayTimeZonePreference(42)).toBe("local");
    expect(normalizeDisplayTimeZonePreference(null)).toBe("local");
    expect(isValidTimeZone("x".repeat(80))).toBe(false);
  });
});

describe("resolveDisplayTimeZone", () => {
  it("formats in the device zone for the local setting", () => {
    expect(resolveDisplayTimeZone("local", "America/New_York")).toBe(
      LOCAL_DISPLAY_TIME_ZONE
    );
  });

  it("labels a zone that differs from the device zone", () => {
    expect(resolveDisplayTimeZone("UTC", "America/New_York")).toEqual(UTC_ZONE);
    expect(resolveDisplayTimeZone("Europe/Berlin", "UTC")).toEqual({
      timeZone: "Europe/Berlin",
      isLocal: false,
    });
  });

  it("treats a chosen zone equal to the device zone as local", () => {
    expect(resolveDisplayTimeZone("UTC", "UTC")).toBe(LOCAL_DISPLAY_TIME_ZONE);
    expect(resolveDisplayTimeZone("America/New_York", "America/New_York")).toBe(
      LOCAL_DISPLAY_TIME_ZONE
    );
  });

  it("labels the choice when the device zone is unknown", () => {
    expect(resolveDisplayTimeZone("UTC", undefined)).toEqual(UTC_ZONE);
  });
});

describe("withDisplayTimeZone", () => {
  const clock = { hour: "2-digit", minute: "2-digit" } as const;

  it("leaves options untouched in the device zone", () => {
    expect(withDisplayTimeZone(LOCAL_DISPLAY_TIME_ZONE, clock)).toBe(clock);
    expect(withDisplayTimeZoneDate(LOCAL_DISPLAY_TIME_ZONE, clock)).toBe(clock);
  });

  it("adds the zone and its name outside the device zone", () => {
    const text = new Intl.DateTimeFormat(
      "en-US",
      withDisplayTimeZone(UTC_ZONE, clock)
    ).format(INSTANT);
    expect(text).toBe("05:06 PM UTC");
  });

  it("names other zones by offset or abbreviation", () => {
    const text = new Intl.DateTimeFormat(
      "en-US",
      withDisplayTimeZone({ timeZone: "Europe/Berlin", isLocal: false }, clock)
    ).format(INSTANT);
    expect(text).toBe("06:06 PM GMT+1");
  });

  it("expands date and time styles instead of throwing", () => {
    const options = withDisplayTimeZone(UTC_ZONE, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    expect(options.dateStyle).toBeUndefined();
    expect(new Intl.DateTimeFormat("en-US", options).format(INSTANT)).toBe(
      "Nov 9, 2026, 5:06 PM UTC"
    );
  });

  it("keeps long time styles, which already name the zone", () => {
    const options = withDisplayTimeZone(UTC_ZONE, {
      dateStyle: "full",
      timeStyle: "long",
    });
    expect(options.timeZoneName).toBeUndefined();
    expect(new Intl.DateTimeFormat("en-US", options).format(INSTANT)).toContain(
      "UTC"
    );
  });

  it("moves bare dates to the display zone without a label", () => {
    const late = new Date("2026-11-09T23:30:00Z");
    const text = new Intl.DateTimeFormat(
      "en-US",
      withDisplayTimeZoneDate(
        { timeZone: "Pacific/Auckland", isLocal: false },
        { month: "short", day: "numeric" }
      )
    ).format(late);
    expect(text).toBe("Nov 10");
  });
});

describe("zone names", () => {
  it("reads city names from IANA zones", () => {
    expect(getTimeZoneCityName("America/New_York")).toBe("New York");
    expect(getTimeZoneCityName("America/Argentina/Buenos_Aires")).toBe(
      "Buenos Aires"
    );
    expect(getTimeZoneCityName("UTC")).toBe("UTC");
  });

  it("returns short zone names", () => {
    expect(getTimeZoneShortName("en-US", "UTC", INSTANT)).toBe("UTC");
    expect(getTimeZoneShortName("en-US", "Europe/Berlin", INSTANT)).toBe(
      "GMT+1"
    );
  });
});
