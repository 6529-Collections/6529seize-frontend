import { assertDateTime } from "@/lib/museum/publication/publicEntityGraphPrimitives";
import {
  isRfc3339DateTime,
  parseRfc3339DateTime,
} from "@/lib/museum/publication/rfc3339";

describe("parseRfc3339DateTime", () => {
  it.each([
    ["2026-08-12T07:37:56Z", Date.UTC(2026, 7, 12, 7, 37, 56)],
    ["2026-08-12T07:37:56.984Z", Date.UTC(2026, 7, 12, 7, 37, 56, 984)],
    // Microsecond precision is what the producing pipeline emits.
    ["2026-08-12T07:37:56.984246Z", Date.UTC(2026, 7, 12, 7, 37, 56, 984)],
    ["2026-08-12T09:37:56+02:00", Date.UTC(2026, 7, 12, 7, 37, 56)],
    ["2026-08-12T00:07:56-07:30", Date.UTC(2026, 7, 12, 7, 37, 56)],
    ["2028-02-29T00:00:00Z", Date.UTC(2028, 1, 29)],
    ["2000-02-29T23:59:59Z", Date.UTC(2000, 1, 29, 23, 59, 59)],
    ["2026-12-31T23:59:59.999Z", Date.UTC(2026, 11, 31, 23, 59, 59, 999)],
  ])("accepts %s", (value, instant) => {
    expect(parseRfc3339DateTime(value)).toBe(instant);
    expect(isRfc3339DateTime(value)).toBe(true);
  });

  it.each([
    // No zone: Date.parse would read these in the host time zone.
    "2026-08-12T07:37:56",
    "2026-08-12T07:37:56.984",
    // Date-only, partial, and non-ISO shapes that Date.parse tolerates.
    "2026-08-12",
    "2026-08",
    "2026",
    "Aug 12 2026",
    "Wed, 12 Aug 2026 07:37:56 GMT",
    "2026-08-12 07:37:56Z",
    "2026-08-12t07:37:56z",
    // Offsets must carry a colon and stay in range.
    "2026-08-12T07:37:56+0200",
    "2026-08-12T07:37:56+02",
    "2026-08-12T07:37:56+24:00",
    "2026-08-12T07:37:56+02:60",
    // Surrounding whitespace is not part of the format.
    " 2026-08-12T07:37:56Z",
    "2026-08-12T07:37:56Z ",
    "",
    // Days and times that do not exist (Date.parse rolls several of these over).
    "2026-02-30T00:00:00Z",
    "2026-02-31T00:00:00Z",
    "2027-02-29T00:00:00Z",
    "1900-02-29T00:00:00Z",
    "2026-04-31T00:00:00Z",
    "2026-00-10T00:00:00Z",
    "2026-13-10T00:00:00Z",
    "2026-08-00T00:00:00Z",
    "2026-08-32T00:00:00Z",
    "2026-08-12T24:00:00Z",
    "2026-08-12T23:60:00Z",
    "2026-08-12T23:59:60Z",
    "2026-08-12T23:59:99Z",
  ])("rejects %j", (value) => {
    expect(parseRfc3339DateTime(value)).toBeNull();
    expect(isRfc3339DateTime(value)).toBe(false);
  });

  it.each([undefined, null, 0, 1786520276984, {}, [], true])(
    "rejects the non-string value %j",
    (value) => {
      expect(parseRfc3339DateTime(value)).toBeNull();
    }
  );

  it("returns the same instant regardless of the host time zone", () => {
    // An explicit zone makes the result independent of the process zone, which
    // is what separates this from Date.parse on zone-less input.
    expect(parseRfc3339DateTime("2026-03-08T10:00:00Z")).toBe(
      parseRfc3339DateTime("2026-03-08T03:00:00-07:00")
    );
  });
});

describe("parseRfc3339DateTime fractional seconds", () => {
  const base = Date.UTC(2026, 7, 12, 7, 37, 56);

  it.each([
    ["no fraction", "2026-08-12T07:37:56Z", base],
    ["1 digit", "2026-08-12T07:37:56.9Z", base + 900],
    ["2 digits", "2026-08-12T07:37:56.98Z", base + 980],
    ["3 digits", "2026-08-12T07:37:56.984Z", base + 984],
    ["6 digits (the producer format)", "2026-08-12T07:37:56.984246Z", base + 984],
    ["9 digits", "2026-08-12T07:37:56.123456789Z", base + 123],
    // Truncated like Date itself, never rounded up into the next second.
    ["6 digits that would round up", "2026-08-12T07:37:56.999999Z", base + 999],
    ["6 digits below one millisecond", "2026-08-12T07:37:56.000001Z", base],
    ["6 digits with trailing zeros", "2026-08-12T07:37:56.500000Z", base + 500],
    ["6 digits and a positive offset", "2026-08-12T09:37:56.984246+02:00", base + 984],
    ["6 digits and a negative offset", "2026-08-12T00:07:56.984246-07:30", base + 984],
  ])("parses %s", (_name, value, instant) => {
    expect(parseRfc3339DateTime(value)).toBe(instant);
  });

  it("hands Date.parse at most three fractional digits", () => {
    const parse = jest.spyOn(Date, "parse");
    try {
      parseRfc3339DateTime("2026-08-12T07:37:56.984246Z");
      parseRfc3339DateTime("2026-08-12T07:37:56.9+02:00");
      parseRfc3339DateTime("2026-08-12T07:37:56Z");
      expect(parse.mock.calls.map(([argument]) => argument)).toEqual([
        "2026-08-12T07:37:56.984Z",
        "2026-08-12T07:37:56.900+02:00",
        // Without a fraction the value is passed through unchanged.
        "2026-08-12T07:37:56Z",
      ]);
    } finally {
      parse.mockRestore();
    }
  });

  it("still rejects a fraction on an otherwise invalid value", () => {
    expect(parseRfc3339DateTime("2026-08-12T07:37:56.984246")).toBeNull();
    expect(parseRfc3339DateTime("2026-02-30T07:37:56.984246Z")).toBeNull();
    expect(parseRfc3339DateTime("2026-08-12T07:37:56.Z")).toBeNull();
    expect(parseRfc3339DateTime("2026-08-12T07:37:56,984Z")).toBeNull();
  });
});

describe("assertDateTime", () => {
  it("accepts strict RFC 3339 values", () => {
    expect(() =>
      assertDateTime(
        { observed_at: "2026-08-12T07:37:56.984246Z" },
        "observed_at",
        "invalid"
      )
    ).not.toThrow();
  });

  it.each([
    "2026-08-12T07:37:56",
    "2026-08-12",
    "Aug 12 2026",
    "2026-02-30T00:00:00Z",
    "",
    "   ",
  ])("throws the caller's code for %j", (value) => {
    expect(() =>
      assertDateTime({ observed_at: value }, "observed_at", "invalid_code")
    ).toThrow("invalid_code");
  });

  it("throws when the key is missing or not a string", () => {
    expect(() => assertDateTime({}, "observed_at", "invalid_code")).toThrow(
      "invalid_code"
    );
    expect(() =>
      assertDateTime({ observed_at: 1786520276984 }, "observed_at", "c")
    ).toThrow("c");
  });
});
