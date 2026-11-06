import {
  computeFingerprint,
  isFingerprintAllowed,
  type FingerprintTraits,
} from "@/services/analytics/telemetry/fingerprint";

const traits: FingerprintTraits = {
  timeZone: "America/New_York",
  language: "en-US",
  screenWidth: 1512,
  screenHeight: 982,
  device: "desktop",
  browser: "chrome",
  browserMajor: "142",
};

describe("isFingerprintAllowed", () => {
  it.each([
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
    "IS",
    "LI",
    "NO",
    "GB",
    "UK",
    "GI",
    "JE",
    "GG",
    "IM",
    "AX",
    "GF",
    "GP",
    "MQ",
    "RE",
    "YT",
    "MF",
    "de",
    " gb ",
  ])("refuses EU/EEA/UK country %p", (country) => {
    expect(isFingerprintAllowed(country)).toBe(false);
  });

  it.each(["", "  ", null, undefined, "unknown", "X", "U5", "USA"])(
    "refuses an unknown country %p",
    (country) => {
      expect(isFingerprintAllowed(country)).toBe(false);
    }
  );

  it.each(["US", "CA", "JP", "BR", "CH", "us"])("allows %p", (country) => {
    expect(isFingerprintAllowed(country)).toBe(true);
  });
});

describe("computeFingerprint", () => {
  const morning = new Date("2026-11-06T00:00:01Z");
  const evening = new Date("2026-11-06T23:59:59Z");
  const nextDay = new Date("2026-11-07T00:00:01Z");

  it("is a short token in the wire shape", () => {
    expect(computeFingerprint(traits, morning)).toMatch(
      /^[A-Za-z0-9_-]{8,32}$/
    );
  });

  it("is stable within a UTC day for the same traits", () => {
    expect(computeFingerprint(traits, morning)).toBe(
      computeFingerprint(traits, evening)
    );
  });

  it("changes with the UTC day", () => {
    expect(computeFingerprint(traits, morning)).not.toBe(
      computeFingerprint(traits, nextDay)
    );
  });

  it("uses coarse traits only: screen buckets and the primary language", () => {
    const base = computeFingerprint(traits, morning);
    expect(
      computeFingerprint(
        {
          ...traits,
          screenWidth: 1540,
          screenHeight: 1020,
          language: "EN-us, fr",
        },
        morning
      )
    ).toBe(base);
    expect(
      computeFingerprint({ ...traits, timeZone: "Europe/Berlin" }, morning)
    ).not.toBe(base);
    expect(
      computeFingerprint({ ...traits, browserMajor: "143" }, morning)
    ).not.toBe(base);
  });

  it("contains no raw trait value", () => {
    const fp = computeFingerprint(traits, morning);
    for (const raw of [
      "America",
      "New_York",
      "en-US",
      "1512",
      "982",
      "chrome",
      "142",
      "desktop",
    ])
      expect(fp).not.toContain(raw);
  });
});
