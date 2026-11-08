import { isSameRecord } from "@/lib/chat-store/same-record";

describe("isSameRecord", () => {
  it.each([
    ["identical flat records", { a: 1, b: "x" }, { a: 1, b: "x" }, true],
    ["key order does not matter", { a: 1, b: 2 }, { b: 2, a: 1 }, true],
    [
      "undefined in stored, value in incoming",
      { a: undefined, b: 1 },
      { a: 2, b: 1 },
      false,
    ],
    [
      "value in stored, undefined in incoming",
      { a: 2, b: 1 },
      { a: undefined, b: 1 },
      false,
    ],
    ["missing in stored, value in incoming", { b: 1 }, { a: 2, b: 1 }, false],
    ["value in stored, missing in incoming", { a: 2, b: 1 }, { b: 1 }, false],
    [
      "missing vs undefined (stored missing)",
      { b: 1 },
      { a: undefined, b: 1 },
      true,
    ],
    [
      "missing vs undefined (incoming missing)",
      { a: undefined, b: 1 },
      { b: 1 },
      true,
    ],
    ["extra key in stored", { a: 1, extra: 0 }, { a: 1 }, false],
    ["extra key in incoming", { a: 1 }, { a: 1, extra: 0 }, false],
    [
      "same count, different keys",
      { a: 1, x: undefined },
      { b: 1, a: 1 },
      false,
    ],
    ["null is a value", { a: null }, { a: undefined }, false],
    [
      "nested equal",
      { a: { b: { c: [1, 2] } } },
      { a: { b: { c: [1, 2] } } },
      true,
    ],
    [
      "nested differs",
      { a: { b: { c: [1, 2] } } },
      { a: { b: { c: [1, 3] } } },
      false,
    ],
    [
      "nested undefined vs missing",
      { a: { b: undefined, c: 1 } },
      { a: { c: 1 } },
      true,
    ],
    [
      "nested undefined vs value",
      { a: { b: undefined } },
      { a: { b: 0 } },
      false,
    ],
    ["array length differs", { a: [1, 2] }, { a: [1, 2, 3] }, false],
    ["array vs object", { a: [1] }, { a: { 0: 1 } }, false],
    ["object vs array", { a: { 0: 1 } }, { a: [1] }, false],
    [
      "arrays of objects",
      { a: [{ x: 1 }, { y: [2] }] },
      { a: [{ x: 1 }, { y: [2] }] },
      true,
    ],
    [
      "ignored identity fields",
      { a: 1, stableKey: "k1", stableHash: "h1" },
      { a: 1, stableKey: "id", stableHash: "id" },
      true,
    ],
    [
      "identity present on one side only",
      { a: 1, stableKey: "k1" },
      { a: 1 },
      true,
    ],
    [
      "identity ignored only at the top level",
      { a: { stableKey: "k1" } },
      { a: { stableKey: "k2" } },
      false,
    ],
  ] as const)("%s", (_name, stored, incoming, expected) => {
    expect(isSameRecord(stored, incoming)).toBe(expected);
  });

  it("matches a reference deep-equality on random records", () => {
    const random = mulberry32(4719);
    for (let run = 0; run < 3_000; run++) {
      const stored = randomRecord(random, 0);
      const incoming =
        random() < 0.5
          ? mutate(clone(stored) as Record<string, unknown>, random)
          : randomRecord(random, 0);
      expect(isSameRecord(stored, incoming)).toBe(
        referenceEqual(stored, incoming)
      );
    }
  });
});

const IGNORED = new Set(["stableKey", "stableHash"]);
const UNDEFINED = "\u0000undefined";

/** Canonical form: defined keys sorted, ignored keys dropped at the top. */
function canonical(value: unknown, top: boolean): unknown {
  if (value === undefined) return UNDEFINED;
  if (Array.isArray(value)) return value.map((item) => canonical(item, false));
  if (value !== null && typeof value === "object") {
    return Object.keys(value)
      .filter(
        (key) =>
          (value as Record<string, unknown>)[key] !== undefined &&
          !(top && IGNORED.has(key))
      )
      .sort()
      .map((key) => [
        key,
        canonical((value as Record<string, unknown>)[key], false),
      ]);
  }
  return value;
}

function referenceEqual(a: unknown, b: unknown): boolean {
  return (
    JSON.stringify(canonical(a, true)) === JSON.stringify(canonical(b, true))
  );
}

const KEYS = ["a", "b", "c", "stableKey", "stableHash"];

function randomValue(random: () => number, depth: number): unknown {
  const roll = random();
  if (depth < 2 && roll < 0.15) return randomRecord(random, depth + 1);
  if (depth < 2 && roll < 0.25) {
    return Array.from({ length: Math.floor(random() * 3) }, () =>
      randomValue(random, depth + 1)
    );
  }
  if (roll < 0.35) return undefined;
  if (roll < 0.45) return null;
  if (roll < 0.7) return Math.floor(random() * 3);
  return ["x", "y"][Math.floor(random() * 2)];
}

function randomRecord(
  random: () => number,
  depth: number
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const key of KEYS) {
    if (random() < 0.6) record[key] = randomValue(random, depth);
  }
  return record;
}

/** One small change somewhere, or none, so equal pairs are common. */
function mutate(
  record: Record<string, unknown>,
  random: () => number
): Record<string, unknown> {
  const key = KEYS[Math.floor(random() * KEYS.length)]!;
  const roll = random();
  if (roll < 0.25) return record;
  if (roll < 0.45) delete record[key];
  else if (roll < 0.6) record[key] = undefined;
  else record[key] = randomValue(random, 1);
  return record;
}

function clone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clone);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, clone(item)])
    );
  }
  return value;
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}
