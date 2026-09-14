import {
  defaultCollectCustomExpiryInput,
  formatCollectCustomExpiryInput,
  resolveCollectCustomExpiry,
} from "@/components/collect/collect-custom-expiry";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const NOW = new Date(2026, 0, 15, 12, 0, 0, 0).getTime();
const DAY_MS = 86_400_000;

interface TimezoneCase {
  readonly input: string;
  readonly now: number;
}

function resolveInTimezone(
  zone: string,
  cases: readonly TimezoneCase[]
): unknown {
  // A fresh Node process applies the real timezone before Date is initialized.
  // Mutating process.env.TZ inside Jest's environment is not a reliable test.
  const script = `
    const fs = require("node:fs");
    const vm = require("node:vm");
    const ts = require("typescript");
    const source = fs.readFileSync(process.argv[1], "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
    const implementation = {};
    vm.runInNewContext(compiled, { exports: implementation });
    const cases = JSON.parse(process.argv[2]);
    process.stdout.write(JSON.stringify(cases.map(({input, now}) =>
      implementation.resolveCollectCustomExpiry(input, now)
    )));
  `;
  const output = execFileSync(
    process.execPath,
    [
      "-e",
      script,
      resolve(process.cwd(), "components/collect/collect-custom-expiry.ts"),
      JSON.stringify(cases),
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, TZ: zone },
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 16_384,
    }
  );
  return JSON.parse(output) as unknown;
}

describe("custom collecting order expiry", () => {
  it.each([
    "",
    "2026-1-20T12:00",
    "2026-01-20",
    "2026-01-20 12:00",
    "2026-01-20T12:00Z",
    "2026-01-20T12:00+01:00",
    "2026-01-20T12:00:00",
    " 2026-01-20T12:00",
    "2026-01-20T12:00 ",
    "2026-02-30T12:00",
    "2026-02-29T12:00",
    "2026-13-01T12:00",
    "2026-00-01T12:00",
    "2026-01-00T12:00",
    "2026-01-32T12:00",
    "2026-01-20T24:00",
    "2026-01-20T12:60",
    "0000-01-20T12:00",
  ])("rejects invalid or non-local input %s", (input) => {
    expect(resolveCollectCustomExpiry(input, NOW)).toEqual({
      issue: "invalid",
      expiresAt: null,
    });
  });

  it("accepts five minutes inclusively and returns seconds without changing the choice", () => {
    const timestamp = NOW + 300_000;
    expect(
      resolveCollectCustomExpiry(formatCollectCustomExpiryInput(timestamp), NOW)
    ).toEqual({ issue: null, expiresAt: timestamp / 1000 });
    expect(
      resolveCollectCustomExpiry(
        formatCollectCustomExpiryInput(timestamp),
        NOW + 1000
      )
    ).toEqual({ issue: "tooSoon", expiresAt: null });
  });

  it("uses the submission clock and floors its fractional second once", () => {
    const input = formatCollectCustomExpiryInput(NOW + 300_000);
    expect(resolveCollectCustomExpiry(input, NOW + 999)).toEqual({
      issue: null,
      expiresAt: NOW / 1000 + 300,
    });
    expect(resolveCollectCustomExpiry(input, NOW + 60_000)).toEqual({
      issue: "tooSoon",
      expiresAt: null,
    });
  });

  it("includes the thirty-day block-lag boundary but never clamps a later date", () => {
    const timestamp = NOW + 30 * DAY_MS - 120_000;
    const input = formatCollectCustomExpiryInput(timestamp);
    expect(resolveCollectCustomExpiry(input, NOW)).toEqual({
      issue: null,
      expiresAt: timestamp / 1000,
    });
    expect(resolveCollectCustomExpiry(input, NOW - 1000)).toEqual({
      issue: "tooLate",
      expiresAt: null,
    });
    expect(
      resolveCollectCustomExpiry(
        formatCollectCustomExpiryInput(NOW + 30 * DAY_MS),
        NOW
      )
    ).toEqual({ issue: "tooLate", expiresAt: null });
  });

  it("accepts a real leap day", () => {
    const now = new Date(2028, 1, 20, 12).getTime();
    const expiry = new Date(2028, 1, 29, 12).getTime();
    expect(resolveCollectCustomExpiry("2028-02-29T12:00", now)).toEqual({
      issue: null,
      expiresAt: expiry / 1000,
    });
  });

  it("formats local components, not a UTC date with its suffix removed", () => {
    const timestamp = new Date(2026, 0, 20, 7, 9, 42, 0).getTime();
    expect(formatCollectCustomExpiryInput(timestamp)).toBe("2026-01-20T07:09");
  });

  it("defaults to seven elapsed days at minute precision", () => {
    expect(defaultCollectCustomExpiryInput(NOW + 42_123)).toBe(
      formatCollectCustomExpiryInput(NOW + 7 * DAY_MS)
    );
  });

  it("captures the current clock when callers omit it", () => {
    const clock = jest.spyOn(Date, "now").mockReturnValue(NOW);
    try {
      const input = defaultCollectCustomExpiryInput();
      expect(resolveCollectCustomExpiry(input)).toEqual({
        issue: null,
        expiresAt: NOW / 1000 + 7 * 86_400,
      });
    } finally {
      clock.mockRestore();
    }
  });

  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER])(
    "rejects an invalid submission clock %p",
    (now) => {
      expect(resolveCollectCustomExpiry("2026-01-20T12:00", now)).toEqual({
        issue: "invalid",
        expiresAt: null,
      });
    }
  );

  it.each([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER])(
    "never formats an invalid timestamp %p",
    (timestamp) => {
      expect(formatCollectCustomExpiryInput(timestamp)).toBe("");
      expect(defaultCollectCustomExpiryInput(timestamp)).toBe("");
    }
  );

  it("rejects New York's nonexistent spring time without moving it forward", () => {
    const now = Date.parse("2026-03-01T12:00:00Z");
    expect(
      resolveInTimezone("America/New_York", [
        { input: "2026-03-08T02:30", now },
        { input: "2026-03-08T01:30", now },
        { input: "2026-03-08T03:30", now },
      ])
    ).toEqual([
      { issue: "invalid", expiresAt: null },
      { issue: null, expiresAt: Date.parse("2026-03-08T06:30:00Z") / 1000 },
      { issue: null, expiresAt: Date.parse("2026-03-08T07:30:00Z") / 1000 },
    ]);
  });

  it("rejects New York's repeated fall time instead of choosing one occurrence", () => {
    const now = Date.parse("2026-10-20T12:00:00Z");
    expect(
      resolveInTimezone("America/New_York", [
        { input: "2026-11-01T01:30", now },
        { input: "2026-11-01T00:30", now },
        { input: "2026-11-01T02:30", now },
      ])
    ).toEqual([
      { issue: "ambiguous", expiresAt: null },
      { issue: null, expiresAt: Date.parse("2026-11-01T04:30:00Z") / 1000 },
      { issue: null, expiresAt: Date.parse("2026-11-01T07:30:00Z") / 1000 },
    ]);
  });

  it("handles Lord Howe's half-hour changes without assuming a one-hour shift", () => {
    expect(
      resolveInTimezone("Australia/Lord_Howe", [
        { input: "2026-04-05T01:45", now: Date.parse("2026-03-25T12:00:00Z") },
        { input: "2026-04-05T02:00", now: Date.parse("2026-03-25T12:00:00Z") },
        { input: "2026-10-04T02:15", now: Date.parse("2026-09-25T12:00:00Z") },
        { input: "2026-10-04T02:30", now: Date.parse("2026-09-25T12:00:00Z") },
      ])
    ).toEqual([
      { issue: "ambiguous", expiresAt: null },
      { issue: null, expiresAt: Date.parse("2026-04-04T15:30:00Z") / 1000 },
      { issue: "invalid", expiresAt: null },
      { issue: null, expiresAt: Date.parse("2026-10-03T15:30:00Z") / 1000 },
    ]);
  });
});
