import {
  getTdhBoostLadder,
  getTdhFutureCeiling,
  tdhRulesSchema,
} from "@/app/network/tdh/tdh-rules.helpers";

const rules = {
  snapshot: {
    block_number: 100,
    block_timestamp: "2026-01-02T00:00:00Z",
    eligible_memes_count: 100,
  },
  boost: {
    base_multiplier: 1,
    final_rounding_decimals: 2,
    season_sets: [{ season: 1, bonus: 0.05 }],
    season_schedule: {
      bonus_per_season: 0.05,
      last_boosted_season: 20,
      max_bonus: 1,
    },
    full_collection: {
      first_set_bonus: 0.05,
      additional_set_initial_bonus: 0.05,
      additional_set_decay_ratio: 0.6529,
      additional_sets_limit_bonus: 0.144051,
    },
    season_one_partials: [
      { key: "genesis", token_ids: [1, 2, 3], bonus: 0.01 },
      { key: "nakamoto", token_ids: [4], bonus: 0.01 },
    ],
    gradients: { bonus_per_token: 0.02, max_count: 5, max_bonus: 0.1 },
  },
};

describe("TDH full-schedule presentation", () => {
  it("uses the eventual schedule ceiling rather than the currently active season bonus", () => {
    expect(getTdhFutureCeiling(tdhRulesSchema.parse(rules))).toBe(2.24);
    const updated = {
      ...rules,
      boost: {
        ...rules.boost,
        season_schedule: { ...rules.boost.season_schedule, max_bonus: 1.2 },
        final_rounding_decimals: 3,
      },
    };
    expect(getTdhFutureCeiling(tdhRulesSchema.parse(updated))).toBe(2.444);
  });

  it("gives the four boost figures the pages quote, rounded like the boost", () => {
    // October 2026: seasons 1 to 16 pay, so a full set is 1.80.
    const today = tdhRulesSchema.parse({
      ...rules,
      boost: {
        ...rules.boost,
        full_collection: {
          ...rules.boost.full_collection,
          first_set_bonus: 0.8,
        },
      },
    });
    expect(getTdhBoostLadder(today)).toEqual({
      fullSetToday: 1.8,
      highestToday: 2.04,
      fullSetAllSeasons: 2,
      highestEver: 2.24,
    });
  });

  it("rejects malformed rule data instead of substituting an old schedule", () => {
    expect(tdhRulesSchema.safeParse({ ...rules, snapshot: {} }).success).toBe(
      false
    );
    expect(
      tdhRulesSchema.safeParse({
        ...rules,
        boost: { ...rules.boost, season_schedule: undefined },
      }).success
    ).toBe(false);
  });
});
