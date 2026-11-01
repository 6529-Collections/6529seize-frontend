import {
  REGISTRY_V14,
  baseTdh,
  boostOfHoldings,
  finalTdh,
  seasonsFor,
} from "@/components/explained/engine/tdh";

/**
 * "An identity" (TDH-DESIGN.md §5.7): wallet A holds most of one season and
 * wallet B the rest, one copy of each card held the same number of days,
 * each card at its own rate (P26 §5.2, from 6529.io's editions). Linked,
 * the identity holds the whole season, so one boost applies to every card
 * (P26 §8.3, §8.4); apart, neither wallet completes it. Every value is the
 * engine's on the TDH v1.4 registry.
 */
const R = REGISTRY_V14;

export const IDENTITY_EXAMPLE = {
  /** The season the two wallets share. */
  season: 13,
  /** Cards of that season in wallet B (its last ones); wallet A holds the rest. */
  inB: 4,
  /** Days every copy has been held. */
  days: 100,
} as const;

export interface IdentityValues {
  readonly season: number;
  readonly days: number;
  readonly cards: number;
  readonly inA: number;
  readonly inB: number;
  /** The linked identity's boost, in cents. */
  readonly boostCents: number;
  /** Either wallet's boost on its own, in cents: no season complete. */
  readonly apartBoostCents: number;
  readonly linkedTdh: number;
  readonly aTdh: number;
  readonly bTdh: number;
  /** The rate most of the season's cards have, in cents, and how many have it. */
  readonly typical: {
    readonly rateCents: number;
    readonly cards: number;
    readonly base: number;
    readonly linkedFinal: number;
  };
}

/**
 * `rateOfCard`: a card's rate in cents (P26 §5.2), or null when its edition
 * is not known; the model is then not drawn.
 */
export function identityValues(
  rateOfCard: (id: number) => number | null,
  nMemes: number
): IdentityValues | null {
  const { season, inB, days } = IDENTITY_EXAMPLE;
  const found = seasonsFor(nMemes, R).find((s) => s.id === season);
  const start = found?.start ?? null;
  const end = found?.end ?? null;
  if (start === null || end === null) {
    return null;
  }
  const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const rates = ids.map(rateOfCard);
  if (rates.some((rate) => rate === null)) {
    return null;
  }
  const cents = rates as number[];
  const cards = ids.length;
  const inA = cards - inB;
  const boostCents = boostOfHoldings(
    {
      fullSets: 0,
      completeSeasons: [season],
      genesis: false,
      nakamoto: false,
      gradients: 0,
    },
    nMemes,
    R
  ).beta;
  const apartBoostCents = boostOfHoldings(
    {
      fullSets: 0,
      completeSeasons: [],
      genesis: false,
      nakamoto: false,
      gradients: 0,
    },
    nMemes,
    R
  ).beta;
  // P26 §8.2, §8.4: base and final per card, then summed.
  const bases = cents.map((rate) => baseTdh(rate, days));
  const sum = (list: readonly number[], beta: number) =>
    list.reduce((total, base) => total + finalTdh(base, beta), 0);
  const counts = new Map<number, number>();
  for (const rate of cents) counts.set(rate, (counts.get(rate) ?? 0) + 1);
  const [typicalRate, typicalCards] = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || b[0] - a[0]
  )[0] ?? [0, 0];
  const typicalBase = baseTdh(typicalRate, days);
  return {
    season,
    days,
    cards,
    inA,
    inB,
    boostCents,
    apartBoostCents,
    linkedTdh: sum(bases, boostCents),
    aTdh: sum(bases.slice(0, inA), apartBoostCents),
    bTdh: sum(bases.slice(inA), apartBoostCents),
    typical: {
      rateCents: typicalRate,
      cards: typicalCards,
      base: typicalBase,
      linkedFinal: finalTdh(typicalBase, boostCents),
    },
  };
}

/**
 * A card's rate in cents from the facts layer's editions (`memes.editions`
 * rows are `[id, season, minted, E]`) and H.
 */
export function rateFromEditions(
  editions: readonly (readonly number[])[],
  h: number,
  rateCents: (h: number, edition: number) => number
): (id: number) => number | null {
  const byId = new Map(editions.map((row) => [row[0], row[3]]));
  return (id) => {
    const edition = byId.get(id);
    return edition === undefined || edition <= 0 ? null : rateCents(h, edition);
  };
}
