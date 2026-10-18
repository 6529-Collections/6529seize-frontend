/** @jest-environment node */
import path from "node:path";
import { GET } from "@/app/network/tdh/public-vectors.json/route";
import record from "@/components/explained/engine/conformance.json";
import {
  JsonNonInteger,
  VectorFormatError,
  canonicalJson,
  isObject,
  parseJsonExact,
  type JsonValue,
} from "@/components/explained/engine/json";
import { PUBLIC_VECTORS_JSON } from "@/components/explained/engine/publicVectors";
import { runVector } from "@/components/explained/engine/vectors";
import {
  PUBLIC_VECTOR_IDS,
  contentDigest,
  engineDigest,
  engineFiles,
  entryOf,
  readChainVectors,
} from "@/scripts/explained/tdh-engine-conformance";

/**
 * The engine against P26's conformance vectors (6529chain
 * `design/tdh-reference/vectors`). The vectors are private until they are
 * published with the validator code, except five restated in full here.
 *
 * - Every run: the five public vectors pass, and the conformance record is
 *   the one the current engine sources produced, with every vector in scope
 *   passing. A change to the engine without a fresh run against the whole
 *   set fails here.
 * - With `TDH_6529CHAIN` naming a 6529chain checkout: every vector is read
 *   with `git show` and run again, and must give the record's results.
 *
 * Refresh the record after an engine change:
 *   6529 exec tsx scripts/explained/tdh-engine-conformance.ts --chain <checkout>
 */
const ROOT = path.resolve(__dirname, "../../../..");
const REFRESH =
  "run `6529 exec tsx scripts/explained/tdh-engine-conformance.ts --chain <6529chain checkout>`";

describe("the five public vectors", () => {
  const doc = parseJsonExact(PUBLIC_VECTORS_JSON);
  const vectors =
    isObject(doc) && isObject(doc["vectors"]) ? doc["vectors"] : {};
  const byId = new Map(record.vectors.map((v) => [v.id, v]));

  it("are 04, 06, 23, 28 and 36 of TDH v1.4, from the record's commit", () => {
    expect(isObject(doc) && doc["ruleVersion"]).toBe("tdh-v1.4");
    expect(
      isObject(doc) && isObject(doc["source"]) && doc["source"]["commit"]
    ).toBe(record.specification.commit);
    expect(Object.keys(vectors)).toEqual([...PUBLIC_VECTOR_IDS]);
  });

  it("are served as written at /network/tdh/public-vectors.json", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(await response.text()).toBe(`${PUBLIC_VECTORS_JSON}\n`);
  });

  it.each([...PUBLIC_VECTOR_IDS])(
    "%s passes and is the specification's own",
    (id) => {
      const text = canonicalJson(vectors[id] as JsonValue);
      const run = runVector(id, text);
      expect(run.failures).toEqual([]);
      expect(run.status).toBe("pass");
      // The same content, value for value, as the private file the record ran.
      expect(contentDigest(text)).toBe(byId.get(id)?.digest);
      expect(run.checks).toBe(byId.get(id)?.checks);
    }
  );
});

describe("the conformance record", () => {
  it(`was produced by the engine as it is (else ${REFRESH})`, () => {
    expect(record.engine.files).toEqual(engineFiles(ROOT));
    expect(record.engine.sha256).toBe(engineDigest(ROOT));
  });

  it("covers all 104 of P26's vectors, each once, and every one in scope passes", () => {
    const ids = record.vectors.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(104);
    expect(record.summary).toEqual({
      vectors: 104,
      inScope: 89,
      pass: 89,
      fail: 0,
      outOfScope: 15,
      checks: record.vectors.reduce((sum, v) => sum + v.checks, 0),
    });
    const outside = record.vectors.filter((v) => v.status === "out-of-scope");
    expect(new Set(outside.map((v) => v.scope))).toEqual(new Set(["decoding"]));
    expect(
      record.vectors
        .filter((v) => v.status !== "out-of-scope")
        .every((v) => v.status === "pass")
    ).toBe(true);
  });

  it("includes D136's vectors, 89 to 103, in scope", () => {
    const d136 = record.vectors.filter((v) => /^(89|9\d|10[0-3])-/.test(v.id));
    expect(d136).toHaveLength(15);
    expect(
      d136.filter((v) => v.status === "pass").map((v) => v.id)
    ).toHaveLength(14);
    expect(d136.find((v) => v.status !== "pass")?.id).toBe(
      "98-raw-log-four-wallet"
    );
  });
});

const CHAIN = process.env["TDH_6529CHAIN"];
(CHAIN ? describe : describe.skip)(
  "every vector, read from 6529chain with git show (TDH_6529CHAIN)",
  () => {
    it("gives the record's results", () => {
      const chain = readChainVectors(
        CHAIN as string,
        process.env["TDH_6529CHAIN_REF"] ?? record.specification.commit
      );
      expect(chain.commit).toBe(record.specification.commit);
      const entries = chain.vectors.map((v) =>
        entryOf(runVector(v.id, v.text), v.text)
      );
      expect(entries).toEqual(record.vectors);
    });
  }
);

describe("the vector reader", () => {
  it("keeps every integer exact, and -0, fractions and exponents apart", () => {
    const value = parseJsonExact(
      '{"a": 18446744073709551615, "b": 9007199254740991, "c": -0, "d": 1.0, "e": 1e3, "f": [true, null, "x"]}'
    );
    expect(value).toEqual({
      a: 18_446_744_073_709_551_615n,
      b: 9_007_199_254_740_991,
      c: new JsonNonInteger("-0"),
      d: new JsonNonInteger("1.0"),
      e: new JsonNonInteger("1e3"),
      f: [true, null, "x"],
    });
    expect(canonicalJson(value)).toBe(
      '{"a":18446744073709551615,"b":9007199254740991,"c":-0,"d":1.0,"e":1e3,"f":[true,null,"x"]}'
    );
  });

  it.each([
    ['{"a": 1, "a": 2}', /named twice/],
    ['{"a": 01}', /after the JSON value|expected/],
    ["[1, 2,]", /not JSON/],
    ['{"a": NaN}', /not JSON/],
    ['"open', /unterminated/],
    ["{} {}", /after the JSON value/],
  ])("refuses %s as no vector", (text, message) => {
    expect(() => parseJsonExact(text)).toThrow(VectorFormatError);
    expect(() => parseJsonExact(text)).toThrow(message);
  });
});

describe("the vector runner", () => {
  const cycle = { block: 2_000, timestamp: 1_791_676_799 };
  const mint = {
    block: 1_000,
    tx_index: 0,
    log_index: 0,
    batch_pos: 0,
    timestamp: 1_791_676_799 - 10 * 86_400,
    tx: `0x${"1".padStart(64, "0")}`,
    contract: "memes",
    token: 1,
    from: "0x0000000000000000000000000000000000000000",
    to: "0x00000000000000000000000000000000000000a1",
    amount: 1,
  };
  const run = (vector: object) => runVector("test", JSON.stringify(vector));

  it("passes a right answer and fails a wrong one", () => {
    const right = {
      cycle,
      transfers: [mint],
      expected: { H: 1, rates: { "memes#1": 100 } },
    };
    expect(run(right)).toMatchObject({
      status: "pass",
      checks: 2,
      scope: "cycle",
    });
    const wrong = { ...right, expected: { H: 2 } };
    expect(run(wrong)).toMatchObject({
      status: "fail",
      failures: ["H: expected 2, got 1"],
    });
  });

  it("passes an input with no result only when the engine refuses it", () => {
    const refused = {
      cycle,
      transfers: [{ ...mint, timestamp: cycle.timestamp + 1 }],
      expected_invalid: "after T",
    };
    expect(run(refused)).toMatchObject({
      status: "pass",
      note: expect.stringMatching(/after T/),
    });
    expect(
      run({ cycle, transfers: [mint], expected_invalid: "nothing" }).status
    ).toBe("fail");
  });

  it("fails a file that is no vector, whatever it expects", () => {
    expect(
      run({ cycle, expected_invalid: "x", surprise: 1 }).failures[0]
    ).toMatch(/^not a vector/);
    expect(run({ expected: {} }).failures[0]).toMatch(/needs cycle/);
    expect(
      run({ cycle, transfers: [{ ...mint, contract: "other" }], expected: {} })
        .status
    ).toBe("fail");
    expect(run({ cycle, expected: { unknown: 1 } }).failures).toEqual([
      "unchecked expected block unknown",
    ]);
  });

  it("leaves log decoding to the validators' readers", () => {
    expect(run({ cycle, logs: [], expected_transfers: [] })).toMatchObject({
      status: "out-of-scope",
      scope: "decoding",
    });
  });

  it("runs arithmetic cases, and fails a block it does not check", () => {
    const arithmetic = {
      rate_cents: [
        { n: 3_941, d: 200, expected: 1_970 },
        { n: 0, d: 101, minimum_one: true, expected: 100 },
        { n: 0, d: 101, minimum_c: 250, expected: 250 },
      ],
      base_tdh: [{ rate_c: 1_271, raw: 2, expected: 25 }],
      final_tdh: [{ base: 25, beta_c: 114, expected: 28 }],
      additional_sets_u: [{ sets: 33, expected: 144_051 }],
    };
    expect(run({ arithmetic })).toMatchObject({
      status: "pass",
      scope: "arithmetic",
      checks: 6,
    });
    expect(run({ arithmetic: { ...arithmetic, roots: [] } }).failures).toEqual([
      "unchecked arithmetic roots",
    ]);
  });

  it("runs cutoffs, whole days and their cases with no cutoff", () => {
    const headers = {
      "100": 1_791_676_787,
      "101": 1_791_676_799,
      "102": 1_791_676_811,
    };
    const vector = {
      cutoff: {
        date: "20261011",
        headers,
        finalized: 102,
        expected: { block: 101, timestamp: 1_791_676_799 },
      },
      cutoff_invalid: [
        {
          date: "20261011",
          headers,
          finalized: 101,
          reason: "102 is not final",
        },
        {
          date: 20_261_011,
          headers,
          finalized: 102,
          reason: "a date is a string",
        },
      ],
      days: [{ T: 1_791_676_799, acquired: 1_791_590_399, expected: 1 }],
    };
    expect(run(vector)).toMatchObject({
      status: "pass",
      scope: "cutoff",
      checks: 5,
    });
    const wrong = {
      ...vector,
      cutoff_invalid: [{ ...vector.cutoff, reason: "x" }],
    };
    expect(run(wrong).failures).toEqual(["cutoff case 0 gave a cutoff (x)"]);
  });

  it("runs registry hashes", () => {
    const hash =
      "0x3cfa0e6eae7b8769516597e117ecd55580ecb6b75194139f053d3e0ec09d9f36";
    expect(run({ registry_hashes: [{ params: {}, hash }] })).toMatchObject({
      status: "pass",
      scope: "registry",
    });
    expect(
      run({ registry_hashes: [{ params: { day_s: 1 }, hash }] }).status
    ).toBe("fail");
  });
});
