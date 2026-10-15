import {
  BOOST_EXAMPLES,
  EDITION_EXAMPLES,
  MINUTE_EXAMPLE,
  RATE_EXAMPLES,
  householdScenario,
} from "@/app/network/tdh/how-it-works/examples";
import { replayStacks } from "@/app/network/tdh/how-it-works/explorables/StackSimulator";

// The worked examples of How TDH is calculated, checked against the numbers
// the P26 Python reference printed (plan, Appendix A).
describe("How TDH is calculated: worked examples", () => {
  it("prints the rate table of step 7", () => {
    expect(RATE_EXAMPLES.map((row) => [row.id, row.cents])).toEqual([
      ["firstgm", 100],
      ["nextgen", 394],
      ["meme310", 1_271],
      ["meme300", 1_314],
      ["gradient", 3_902],
    ]);
  });

  it("prints the edition floors of step 6", () => {
    expect(EDITION_EXAMPLES.map((row) => [row.edition, row.cents])).toEqual([
      [310, 1_271],
      [310, 1_271],
      [300, 1_314],
      [303, 1_301],
      [309, 1_275],
    ]);
  });

  it("prints the boost table of step 9", () => {
    expect(
      Object.fromEntries(BOOST_EXAMPLES.map((row) => [row.id, row.betaCents]))
    ).toEqual({
      nothing: 100,
      oneGradient: 102,
      fiveGradients: 110,
      genesisNakamoto: 102,
      season2: 105,
      season2GenesisNakamoto: 107,
      currentSeasonOnly: 100,
      oneFullSet: 180,
      allButNewest: 180,
      twoFullSets: 185,
      threeFullSets: 188,
      oneFullSetFiveGradients: 190,
      highest: 204,
    });
  });

  it("computes the one-minute example: 100 days × 12.71 = 1,271, × 1.02 = 1,296", () => {
    expect(MINUTE_EXAMPLE).toMatchObject({
      rateCents: 1_271,
      base: 1_271,
      betaCents: 102,
      final: 1_296,
    });
  });

  it("computes the household as one identity", () => {
    const result = householdScenario("identity");
    const [identity] = result.records;
    expect(identity?.betaCents).toBe(104);
    expect(
      identity?.rows.map((row) => [row.card, row.base, row.final])
    ).toEqual([
      ["firstgm", 320, 333],
      ["meme310", 1_144, 1_190],
      ["gradient1", 15_608, 16_232],
      ["gradient2", 1_171, 1_218],
      ["nextgen", 1_438, 1_496],
    ]);
    expect(identity?.base).toBe(19_681);
    expect(result.total).toBe(20_469);
    expect(identity?.dailyRateE4).toBe(1_005_576);
  });

  it("computes the household as two wallets, tomorrow and after selling Gradient 2", () => {
    const wallets = householdScenario("wallets");
    expect(
      wallets.records.map((record) => [
        record.label,
        record.betaCents,
        record.base,
        record.final,
      ])
    ).toEqual([
      ["A", 102, 15_928, 16_246],
      ["B", 102, 3_753, 3_828],
    ]);
    expect(wallets.records.map((record) => record.dailyRateE4)).toEqual([
      418_404, 567_834,
    ]);
    expect(wallets.total).toBe(20_074);

    const tomorrow = householdScenario("tomorrow");
    expect(tomorrow.total).toBe(20_583);
    expect(tomorrow.records[0]?.rows.map((row) => row.final)).toEqual([
      335, 1_217, 16_273, 1_258, 1_500,
    ]);

    const sell = householdScenario("sell");
    expect(sell.records[0]?.betaCents).toBe(102);
    expect(sell.total).toBe(18_880);
  });
});

describe("stack simulator replay (P26 §7.1, §6.4)", () => {
  const events = [
    { kind: "buy", day: 0 },
    { kind: "buy", day: 10 },
    { kind: "move", day: 30 },
    { kind: "buy", day: 40 },
    { kind: "sell", day: 50 },
  ] as const;

  it("keeps a moved copy's age when the wallets are consolidated", () => {
    expect(replayStacks(events, true)).toEqual({ a: [0], b: [10] });
  });

  it("restarts a moved copy's age when they are not, for the whole history", () => {
    expect(replayStacks(events, false)).toEqual({ a: [0], b: [30] });
  });

  it("sells the newest copy first", () => {
    expect(
      replayStacks(
        [
          { kind: "buy", day: 0 },
          { kind: "buy", day: 5 },
          { kind: "sell", day: 9 },
        ],
        true
      )
    ).toEqual({
      a: [0],
      b: [],
    });
  });
});
