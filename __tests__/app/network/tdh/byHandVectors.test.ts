import { BY_HAND_VECTORS } from "@/app/network/tdh/implementations/byHandVectors";
import { VECTORS } from "@/app/network/tdh/implementations/vectors";
import {
  additionalSetsMicro,
  baseTdh,
  finalTdh,
} from "@/lib/tdh/tdhV1Arithmetic";

/**
 * The three vectors the implementations page restates in full (04, 06 and
 * 23, generated from their files at 6529chain f840096) agree with the
 * port's arithmetic wherever a value can be recomputed from the others.
 */
describe("vectors restated for checking by hand", () => {
  it("are three of P26's 89 conformance vectors", () => {
    const ids = new Set(VECTORS.map((vector) => vector.id));
    expect(BY_HAND_VECTORS.map((vector) => vector.id)).toEqual([
      "04-mid-period-transfer",
      "06-consolidation-age-carry",
      "23-identity-sums",
    ]);
    for (const vector of BY_HAND_VECTORS) {
      expect(ids.has(vector.id)).toBe(true);
    }
  });

  it("names every wallet a transfer or a record uses", () => {
    for (const vector of BY_HAND_VECTORS) {
      for (const transfer of vector.transfers) {
        for (const end of [transfer.from, transfer.to]) {
          expect(end === "mint" || end in vector.names).toBe(true);
        }
      }
      for (const record of vector.records) {
        for (const wallet of record.wallets) {
          expect(wallet in vector.names).toBe(true);
        }
      }
    }
  });

  it("recomputes 04 and 06: last in, first out, and the age carried inside an identity", () => {
    const [v04, v06] = BY_HAND_VECTORS;
    // 04: rate 1.00; A keeps two copies of 30 days after selling its last.
    const a04 = v04?.records.find((record) => record.wallets[0] === "a1");
    expect(a04?.raw).toBe(2 * 30);
    expect(a04?.base).toBe(baseTdh(100, 60));
    expect(100 + Math.round(additionalSetsMicro(2) / 10_000)).toBe(a04?.boostC);
    expect(finalTdh(a04?.base ?? 0, a04?.boostC ?? 0)).toBe(a04?.final);
    // 06: B's copy keeps its 200 days inside the identity.
    const identity = v06?.records.find((record) => record.kind === "identity");
    expect(identity?.raw).toBe(100 + 80 + 200);
    expect(finalTdh(identity?.base ?? 0, identity?.boostC ?? 0)).toBe(
      identity?.final
    );
    expect(identity?.final).toBe(410);
  });

  it("recomputes 23's per-token finals and the identity's sum", () => {
    const v23 = BY_HAND_VECTORS[2];
    const identity = v23?.records.find(
      (record) => record.kind === "identity" && record.wallets.length === 2
    );
    expect(identity?.tokens.map((token) => token.token)).toEqual([
      "memes#2",
      "memes#4",
    ]);
    for (const token of identity?.tokens ?? []) {
      expect(finalTdh(token.base, identity?.boostC ?? 0)).toBe(token.final);
    }
    // Meme 4: the identity's FINAL(20, 105) = 21, not 11 + 11.
    expect(finalTdh(20, 105)).toBe(21);
    expect(2 * finalTdh(10, 105)).toBe(22);
    expect(identity?.final).toBe(60);
  });
});
