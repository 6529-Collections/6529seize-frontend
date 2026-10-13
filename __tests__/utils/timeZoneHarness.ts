/**
 * Test helpers for code whose output depends on the time zone.
 *
 * Jest is pinned to UTC (see jest.config.js), so an ordinary test can never see
 * a zone bug. Pick the helper that matches what the code under test reads:
 *
 * - `runInTimeZone` runs an exported function in a fresh Node process whose
 *   real zone is the one requested. It is authoritative: `Date` getters,
 *   `toLocale*String` and `Intl` all follow the zone. It costs one process
 *   start (about a second), so batch many inputs into one call.
 * - `withHostTimeZone` makes `new Intl.DateTimeFormat(...)` default to a zone
 *   for the duration of a callback, in-process. Use it to render components.
 *   It only affects formatters created without an explicit `timeZone`; `Date`
 *   getters and `toLocale*String` still use the pinned zone.
 *
 * Mutating `process.env.TZ` inside a test does nothing useful: Jest hands each
 * test a copy of `process.env`.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/** UTC, a western zone (negative offset) and an eastern zone (UTC+12/+13). */
export const TEST_TIME_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "Pacific/Auckland",
] as const;

/** The furthest zones from UTC, for date-boundary cases. */
export const EXTREME_TIME_ZONES = [
  "Pacific/Pago_Pago",
  "Pacific/Kiritimati",
] as const;

const REPO_ROOT = resolve(__dirname, "../..");

// Reads one JSON request on stdin so no argument quoting or length limit
// applies on Windows, then imports the module through tsx (TypeScript, JSX and
// the "@/" alias all resolve as they do in the app).
const CHILD_SCRIPT = `
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const request = JSON.parse(readFileSync(0, "utf8"));
const loaded = await import(pathToFileURL(request.modulePath).href);
// tsx loads a TypeScript module as ESM on some Node versions and as CommonJS on
// others (Node 22 exposes only { default: module.exports }), so accept both.
const target =
  loaded[request.exportName] ??
  loaded.default?.[request.exportName] ??
  loaded["module.exports"]?.[request.exportName];
if (typeof target !== "function") {
  throw new Error(request.exportName + " is not an exported function");
}
const results = [];
for (const args of request.argsList) {
  results.push(await target(...args));
}
process.stdout.write(JSON.stringify({
  zone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
  results,
}));
`;

interface ChildResponse<T> {
  readonly zone: string;
  readonly results: readonly T[];
}

function canonicalZone(zone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
  }).resolvedOptions().timeZone;
}

/**
 * Calls `exportName` from a repo module once per entry of `argsList`, in a
 * Node process running in `zone`, and returns the results in order.
 *
 * Arguments and results cross a process boundary as JSON: pass dates as
 * strings or epoch milliseconds, not Date objects.
 *
 * @param zone IANA zone name such as "America/Los_Angeles".
 * @param modulePath Repo-relative path of the module, such as "i18n/format.ts".
 */
export function runInTimeZone<T = unknown>(
  zone: string,
  modulePath: string,
  exportName: string,
  argsList: readonly (readonly unknown[])[]
): T[] {
  const stdout = execFileSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", CHILD_SCRIPT],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: { ...process.env, TZ: zone },
      input: JSON.stringify({
        modulePath: resolve(REPO_ROOT, modulePath),
        exportName,
        argsList,
      }),
      maxBuffer: 1_048_576,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30_000,
    }
  );
  const response = JSON.parse(stdout) as ChildResponse<T>;
  // A silently ignored TZ would make every zone test pass for the wrong reason.
  if (response.zone !== canonicalZone(zone)) {
    throw new Error(
      `Child process ran in ${response.zone} instead of the requested ${zone}`
    );
  }
  return [...response.results];
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
}

/**
 * Runs `callback` while `Intl.DateTimeFormat` defaults to `zone` instead of the
 * pinned zone. An explicit `timeZone` option still wins, so this reproduces a
 * server or viewer in another zone for code that formats through `Intl`. An
 * async callback keeps the override until its promise settles.
 */
export function withHostTimeZone<T>(zone: string, callback: () => T): T {
  const RealDateTimeFormat = Intl.DateTimeFormat;
  const spy = jest
    .spyOn(Intl, "DateTimeFormat")
    .mockImplementation(
      ((locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) =>
        new RealDateTimeFormat(
          locales,
          options?.timeZone === undefined
            ? { ...options, timeZone: zone }
            : options
        )) as unknown as typeof Intl.DateTimeFormat
    );
  Object.assign(spy, {
    prototype: RealDateTimeFormat.prototype,
    supportedLocalesOf: RealDateTimeFormat.supportedLocalesOf,
  });

  let result: T;
  try {
    result = callback();
  } catch (error) {
    spy.mockRestore();
    throw error;
  }

  if (isPromiseLike(result)) {
    return Promise.resolve(result).finally(() => spy.mockRestore()) as T;
  }
  spy.mockRestore();
  return result;
}
