/** @jest-environment node */
import {
  walletCase,
  walletPositions,
  type WalletPreset,
} from "@/app/network/tdh/consolidation/walletPresets";

/**
 * "Four wallets, one identity" (TDH-DESIGN.md §5.9): every case grouped by
 * the TDH v1.4 engine gives the design's tested result.
 */
function groups(preset: WalletPreset): string {
  const found = walletCase(preset);
  const parts = found.groups.map((group) => group.join(" + "));
  return found.alone.length > 0
    ? `${parts.join(", ")}; ${found.alone.join(" and ")} alone`
    : parts.join(", ");
}

describe("Four wallets, one identity", () => {
  it.each<[WalletPreset, string]>([
    ["three", "A + B + C"],
    ["missing", "B + C; A alone"],
    ["step1", "A + D, B + C"],
    ["step2", "A + B + D; C alone"],
    ["step3", "A + B + C + D"],
    ["batch", "A + B + C + D"],
  ])("%s gives %s", (preset, expected) => {
    expect(groups(preset)).toBe(expected);
  });

  it("four linked before the gate: three together, one alone", () => {
    const found = walletCase("oldfour");
    expect(found.groups).toHaveLength(1);
    expect(found.groups[0]).toHaveLength(3);
    expect(found.alone).toHaveLength(1);
  });

  it("five: four at most, and an older wallet can be the one left out", () => {
    const found = walletCase("five");
    expect(found.groups).toEqual([["B", "C", "D", "E"]]);
    expect(found.alone).toEqual(["A"]);
  });

  it("draws a wallet left alone outside its group's boundary", () => {
    const found = walletCase("five");
    const at = walletPositions(found);
    const groupLeft = Math.min(
      ...(found.groups[0] ?? []).map((letter) => at[letter]?.x ?? 0)
    );
    expect(at["A"]?.x ?? 1).toBeLessThan(groupLeft - 0.2);
  });
});
