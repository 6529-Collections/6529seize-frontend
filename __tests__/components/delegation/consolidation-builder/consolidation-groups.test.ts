import {
  getConsolidationDepartures,
  getPrefillWallets,
  parseConsolidationGroup,
  selectExistingMembers,
} from "@/components/delegation/consolidation-builder/consolidation-groups";

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;
const D = `0x${"d".repeat(40)}`;
const E = `0x${"e".repeat(40)}`;
const F = `0x${"f".repeat(40)}`;

describe("parseConsolidationGroup", () => {
  it("returns the lowercased wallets of a consolidation", () => {
    expect(
      parseConsolidationGroup({
        data: [A.toUpperCase().replace("0X", "0x"), B],
      })
    ).toEqual([A, B]);
  });

  it("treats a single wallet, malformed data, or no data as no consolidation", () => {
    expect(parseConsolidationGroup({ data: [A] })).toEqual([]);
    expect(parseConsolidationGroup({ data: [A, "nope", 7] })).toEqual([]);
    expect(parseConsolidationGroup({ data: "x" })).toEqual([]);
    expect(parseConsolidationGroup(null)).toEqual([]);
  });
});

describe("getPrefillWallets", () => {
  it("puts the connected wallet first, followed by its consolidation", () => {
    expect(getPrefillWallets(B, [A, B, C])).toEqual([B, A, C]);
  });

  it("uses only the connected wallet when it is not consolidated", () => {
    expect(getPrefillWallets(A, [])).toEqual([A]);
    expect(getPrefillWallets(A, [B, C])).toEqual([A]);
  });

  it("never prefills more than the wallet limit", () => {
    expect(getPrefillWallets(A, [A, B, C, D, E])).toEqual([A, B, C, D]);
  });
});

describe("selectExistingMembers", () => {
  it("selects the consolidation containing the most listed wallets", () => {
    const groups = new Map([
      [A, [A, E]],
      [B, [B, C, D]],
      [C, [B, C, D]],
      [D, [B, C, D]],
    ]);

    expect(selectExistingMembers([A, B, C, D], groups)).toEqual([B, C, D]);
  });

  it("breaks ties in favour of the first listed wallet's consolidation", () => {
    const groups = new Map([
      [A, [A, E]],
      [B, [B, F]],
    ]);

    expect(selectExistingMembers([A, B], groups)).toEqual([A]);
  });

  it("returns no members when no listed wallet is consolidated", () => {
    expect(selectExistingMembers([A, B], new Map([[A, []]]))).toEqual([]);
  });
});

describe("getConsolidationDepartures", () => {
  it("names the unlisted members each consolidation leaves behind", () => {
    const groups = new Map([
      [A, [A, B, C]],
      [B, [A, B, C]],
      [D, [D, E]],
    ]);

    expect(getConsolidationDepartures([A, B, D], groups)).toEqual([
      { wallets: [A, B], separatedFrom: [C] },
      { wallets: [D], separatedFrom: [E] },
    ]);
  });

  it("reports nothing when the whole consolidation is listed", () => {
    const groups = new Map([
      [A, [A, B]],
      [B, [A, B]],
    ]);

    expect(getConsolidationDepartures([A, B, C], groups)).toEqual([]);
  });
});
