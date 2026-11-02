import conformance from "@/components/explained/engine/conformance.json";
import {
  registryHash,
  tdhRuleId,
} from "@/components/explained/engine/registryHash";
import {
  REGISTRY_V14,
  boostCeiling,
  highestBoost,
} from "@/components/explained/engine/tdh";
import { ENGINE } from "@/lib/explained/engine";
import { RECORD } from "@/lib/explained/factInputs";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * Where the kit's facts layer meets lane E's engine. The engine carries its
 * own copy of P26 §10's registry (in the record's units: micro-units and
 * cents); the facts layer reads the record snapshot synced from 6529chain
 * (in decimal units). Both must describe the same rule version, or a page
 * would print the engine's numbers under the record's hash.
 */

/** Record fields P26 §10 writes in micro-units (10^-6). */
const MICRO_FIELDS = new Set([
  "season_bonus",
  "genesis_bonus",
  "nakamoto_bonus",
  "gradient_bonus",
]);
/** Record fields P26 §10 writes in cents. */
const CENT_FIELDS = new Set(["gradient_rate_minimum"]);

function inRecordUnits(field: string, value: number): number {
  if (MICRO_FIELDS.has(field)) {
    return Math.round(value * 1_000_000);
  }
  if (CENT_FIELDS.has(field)) {
    return Math.round(value * 100);
  }
  return value;
}

describe("the engine seam", () => {
  it("computes on the engine's registry, which the record names", () => {
    expect(ENGINE.name).toContain(RECORD.p26.ruleVersion);
    expect(REGISTRY_V14.rule_version).toBe(RECORD.p26.ruleVersion);
  });

  it("holds the record's registry values, field by field", () => {
    const engine = REGISTRY_V14 as unknown as Record<string, unknown>;
    const entries = Object.entries(RECORD.p26.registry);
    expect(entries.length).toBeGreaterThan(0);
    for (const [field, value] of entries) {
      expect([field, Number(engine[field])]).toEqual([
        field,
        inRecordUnits(field, value),
      ]);
    }
  });

  it("derives the record's registry hash and rule ID", () => {
    expect(registryHash(REGISTRY_V14)).toBe(RECORD.p26.registryHash);
    expect(tdhRuleId(REGISTRY_V14)).toBe(RECORD.p26.ruleId);
  });

  it("was proved against the record's P26 and all of its vectors", () => {
    expect(conformance.specification.commit).toBe(RECORD.p26.commit);
    expect(conformance.summary.vectors).toBe(RECORD.p26.vectors);
    expect(conformance.summary.fail).toBe(0);
    expect(conformance.summary.pass).toBe(conformance.summary.inScope);
  });

  it("gives the facts layer the engine's own boosts", () => {
    const book = createFactBook(fixtureFactInputs());
    const nMemes = book.num("memes.count");
    expect(book.num("engine.boost.todayMax")).toBe(
      highestBoost(nMemes, REGISTRY_V14).beta / 100
    );
    expect(book.num("engine.boost.ceiling")).toBe(
      boostCeiling(REGISTRY_V14) / 100
    );
  });

  it("keeps the adapter's Gradient floor at one TDH a day", () => {
    expect(ENGINE.rateCents(3941, 101)).toBe(3902);
    expect(ENGINE.rateCents(50, 101, true)).toBe(100);
    expect(ENGINE.rateCents(50, 101)).toBe(50);
    expect(() => ENGINE.rateCents(3941, 0)).toThrow(RangeError);
  });
});
