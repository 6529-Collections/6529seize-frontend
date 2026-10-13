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
