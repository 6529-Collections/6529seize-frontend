/**
 * Guards the Jest time zone pin in jest.config.js. If this fails, every other
 * date test is running in the machine's zone and can pass or fail by accident.
 */
const expectedZone = process.env["JEST_TZ"] || "UTC";

function resolvedZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

describe("jest time zone pin", () => {
  it("runs the test process in the pinned zone", () => {
    expect(resolvedZone()).toBe(
      new Intl.DateTimeFormat("en-US", {
        timeZone: expectedZone,
      }).resolvedOptions().timeZone
    );
  });

  it("applies the zone to Date, not only to Intl", () => {
    const january = new Date(Date.UTC(2026, 0, 15, 12));
    const july = new Date(Date.UTC(2026, 6, 15, 12));
    if (expectedZone === "UTC") {
      expect(january.getTimezoneOffset()).toBe(0);
      expect(july.getTimezoneOffset()).toBe(0);
      expect(new Date(2026, 9, 12).toISOString()).toBe(
        "2026-10-12T00:00:00.000Z"
      );
    } else {
      const wallClock = (date: Date) =>
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: expectedZone,
        }).format(date);
      expect(january.getHours()).toBe(Number(wallClock(january)) % 24);
      expect(july.getHours()).toBe(Number(wallClock(july)) % 24);
    }
  });

  it("exposes the pin to the test through process.env", () => {
    expect(process.env["TZ"]).toBe(expectedZone);
  });
});
