import { z } from "zod";

const nonnegative = z.number().finite().nonnegative();
export const tdhRulesSchema = z.object({
  snapshot: z.object({
    block_number: nonnegative.int().safe(),
    block_timestamp: z.string().datetime({ offset: true }),
    eligible_memes_count: nonnegative.int().safe(),
  }),
  boost: z.object({
    base_multiplier: nonnegative,
    final_rounding_decimals: nonnegative.int().max(6),
    season_sets: z.array(
      z.object({ season: nonnegative.int(), bonus: nonnegative })
    ),
    season_schedule: z.object({
      bonus_per_season: nonnegative,
      last_boosted_season: nonnegative.int(),
      max_bonus: nonnegative,
    }),
    full_collection: z.object({
      first_set_bonus: nonnegative,
      additional_set_initial_bonus: nonnegative,
      additional_set_decay_ratio: nonnegative.lt(1),
      additional_sets_limit_bonus: nonnegative,
    }),
    season_one_partials: z.array(
      z.object({
        key: z.enum(["genesis", "nakamoto"]),
        token_ids: z.array(nonnegative.int()),
        bonus: nonnegative,
      })
    ),
    gradients: z.object({
      bonus_per_token: nonnegative,
      max_count: nonnegative.int(),
      max_bonus: nonnegative,
    }),
  }),
});
export type TdhRules = z.infer<typeof tdhRulesSchema>;

export function getTdhFutureCeiling({ boost }: TdhRules) {
  const precision = 10 ** boost.final_rounding_decimals;
  const maximum =
    boost.base_multiplier +
    boost.season_schedule.max_bonus +
    boost.full_collection.additional_sets_limit_bonus +
    boost.gradients.max_bonus;
  return Math.round(maximum * precision) / precision;
}
