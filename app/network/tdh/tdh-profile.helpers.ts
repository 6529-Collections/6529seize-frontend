import { z } from "zod";

const nonnegative = z.number().finite().nonnegative();
const integer = nonnegative.int().safe();
const tokenSchema = z.object({
  id: z.union([integer.transform(String), z.string().regex(/^(0|[1-9]\d*)$/)]),
  balance: integer,
  tdh: integer,
  tdh__raw: integer,
  hodl_rate: nonnegative,
  days_held_per_edition: z.array(integer),
});

export const tdhProfileSchema = z.object({
  block: integer.positive(),
  date: z.string().datetime({ offset: true }),
  wallets: z.array(z.string().regex(/^0x[\da-f]{40}$/i)),
  consolidation_display: z.string(),
  tdh: integer,
  tdh__raw: integer,
  boost: z.number().finite().min(1),
  boosted_tdh: integer,
  boosted_tdh_rate: nonnegative,
  memes: z.array(tokenSchema),
  gradients: z.array(tokenSchema),
  nextgen: z.array(tokenSchema),
  boost_breakdown: z.record(
    z.object({ acquired: nonnegative, available: nonnegative })
  ),
});

export type TdhProfile = z.infer<typeof tdhProfileSchema>;
export type TdhProfileToken = z.infer<typeof tokenSchema>;
export type TdhCollection = "memes" | "gradients" | "nextgen";
export const TDH_COLLECTIONS: readonly TdhCollection[] = [
  "memes",
  "gradients",
  "nextgen",
];

export function reconcileTdhProfile(profile: TdhProfile) {
  const tokens = TDH_COLLECTIONS.flatMap((collection) => profile[collection]);
  const total = tokens.reduce(
    (sum, token) => sum + Math.round(token.tdh * profile.boost),
    0
  );
  const base = tokens.reduce((sum, token) => sum + token.tdh, 0);
  return {
    total,
    matches: total === profile.boosted_tdh && base === profile.tdh,
  };
}

export function getBoostLabel(key: string) {
  const season = /^memes_szn(\d+)$/.exec(key);
  if (season) return { kind: "season", season: Number(season[1]) } as const;
  const labels = {
    memes_card_sets: "collection",
    memes_genesis: "genesis",
    memes_nakamoto: "nakamoto",
    gradients: "gradients",
  } as const;
  return {
    kind: "other",
    label: Object.hasOwn(labels, key)
      ? labels[key as keyof typeof labels]
      : "other",
  } as const;
}
