import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EXTREME_TIME_ZONES,
  runInTimeZone,
  TEST_TIME_ZONES,
  withHostTimeZone,
} from "./timeZoneHarness";

jest.setTimeout(60_000);

const FORMAT_MODULE = "i18n/format.ts";

function defaultZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

describe("runInTimeZone", () => {
  it.each([...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES])(
    "runs the requested function in %s",
    (zone) => {
      const [formatted] = runInTimeZone<string>(
        zone,
        FORMAT_MODULE,
        "formatDate",
        [
          [
            "en-US",
            "2026-10-12T12:00:00.000Z",
            { hour: "numeric", hour12: false, timeZoneName: "short" },
          ],
        ]
      );

      // Noon UTC: the printed hour proves the child really changed zone.
      const expected = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: zone,
        timeZoneName: "short",
      }).format(new Date("2026-10-12T12:00:00.000Z"));
      expect(formatted).toBe(expected);
    }
  );

  it("returns one result per argument list, in order", () => {
    expect(
      runInTimeZone<string>("UTC", FORMAT_MODULE, "formatDate", [
        ["en-US", "2026-01-02"],
        ["en-US", "2026-03-04"],
        ["en-US", "2026-05-06"],
      ])
    ).toEqual(["Jan 2, 2026", "Mar 4, 2026", "May 6, 2026"]);
  });

  it("fails loudly when the export is missing", () => {
    expect(() =>
      runInTimeZone("UTC", FORMAT_MODULE, "doesNotExist", [[]])
    ).toThrow();
  });

  it("is not affected by the pinned zone of the test process", () => {
    const [zone] = runInTimeZone<string>(
      "Pacific/Auckland",
      "i18n/format.ts",
      "formatDate",
      [["en-US", "2026-10-12T00:00:00.000Z"]]
    );
    // Auckland is UTC+13 on that date: still the 12th, and not the pinned zone.
    expect(zone).toBe("Oct 12, 2026");
  });
});

describe("runInTimeZone module shapes", () => {
  let directory: string;

  beforeAll(() => {
    directory = mkdtempSync(join(tmpdir(), "time-zone-harness-"));
  });

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("calls an export of a CommonJS-shaped module", () => {
    // Assigned through a variable, the exports are not statically detectable,
    // so an ESM import sees { default: module.exports } only. That is also what
    // tsx produces for a TypeScript module on Node 22.
    const file = join(directory, "commonjs-shape.cjs");
    writeFileSync(
      file,
      [
        "const api = {};",
        'api["greet"] = (name) => "hello " + name;',
        "module.exports = api;",
        "",
      ].join("\n")
    );

    expect(runInTimeZone<string>("UTC", file, "greet", [["a"], ["b"]])).toEqual(
      ["hello a", "hello b"]
    );
  });

  it("calls an export of an ES module", () => {
    const file = join(directory, "esm-shape.mjs");
    writeFileSync(
      file,
      'export function greet(name) { return "hi " + name; }\n'
    );

    expect(runInTimeZone<string>("UTC", file, "greet", [["a"]])).toEqual([
      "hi a",
    ]);
  });

  it("still rejects a name the module does not export", () => {
    const file = join(directory, "commonjs-missing.cjs");
    writeFileSync(
      file,
      [
        "const api = {};",
        'api["greet"] = () => "x";',
        "module.exports = api;",
        "",
      ].join("\n")
    );

    expect(() => runInTimeZone("UTC", file, "other", [[]])).toThrow();
  });
});

describe("withHostTimeZone", () => {
  const INSTANT = new Date("2026-10-12T00:30:00.000Z");
  const dayIn = () =>
    new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(INSTANT);

  it("changes the default zone of Intl.DateTimeFormat inside the callback", () => {
    const outside = defaultZone();
    const inside = withHostTimeZone("America/Los_Angeles", () => ({
      day: dayIn(),
      zone: defaultZone(),
    }));

    expect(inside).toEqual({
      day: "Oct 11, 2026",
      zone: "America/Los_Angeles",
    });
    expect(defaultZone()).toBe(outside);
  });

  it("agrees with a real process running in the same zone", () => {
    for (const zone of [...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES]) {
      const [real] = runInTimeZone<string>(zone, FORMAT_MODULE, "formatDate", [
        ["en-US", INSTANT.toISOString()],
      ]);
      expect(withHostTimeZone(zone, () => dayIn())).toBe(real);
    }
  });

  it("lets an explicit timeZone win", () => {
    const day = withHostTimeZone("Pacific/Kiritimati", () =>
      new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        timeZone: "America/Los_Angeles",
      }).format(INSTANT)
    );

    expect(day).toBe("Oct 11");
  });

  it("restores Intl.DateTimeFormat when the callback throws", () => {
    const original = Intl.DateTimeFormat;

    expect(() =>
      withHostTimeZone("Pacific/Auckland", () => {
        throw new Error("boom");
      })
    ).toThrow("boom");
    expect(Intl.DateTimeFormat).toBe(original);
  });

  it("keeps the override until an async callback settles", async () => {
    const original = Intl.DateTimeFormat;

    const inside = await withHostTimeZone("Pacific/Auckland", async () => {
      await Promise.resolve();
      return defaultZone();
    });

    expect(inside).toBe("Pacific/Auckland");
    expect(Intl.DateTimeFormat).toBe(original);
  });

  it("restores Intl.DateTimeFormat when an async callback rejects", async () => {
    const original = Intl.DateTimeFormat;

    await expect(
      withHostTimeZone("Pacific/Auckland", () =>
        Promise.reject(new Error("no"))
      )
    ).rejects.toThrow("no");
    expect(Intl.DateTimeFormat).toBe(original);
  });
});
