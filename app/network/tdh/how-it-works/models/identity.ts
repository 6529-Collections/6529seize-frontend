import {
  REGISTRY_V14,
  baseTdh,
  boostOfHoldings,
  finalTdh,
  seasonsFor,
} from "@/components/explained/engine/tdh";

/**
 * "An identity" (TDH-DESIGN.md §5.7): wallet A holds most of one season and
 * wallet B the rest, every card a copy held the same number of days at one
 * card's rate. Linked, the identity holds the whole season, so one boost
 * applies to every card (P26 §8.3, §8.4); apart, neither wallet completes
 * it. Every value is the engine's on the TDH v1.4 registry.
 */
const R = REGISTRY_V14;

const IDENTITY_EXAMPLE = {
  /** The season the two wallets share. */
  season: 13,
  /** Cards of that season in wallet B; wallet A holds the rest. */
  inB: 4,
  /** Days every copy has been held. */
  days: 100,
} as const;

interface IdentityValues {
  readonly season: number;
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
}

/** `rateCents`: the rate every card is drawn at (a 310-copy card's). */
export function identityValues(
  rateCents: number,
  nMemes: number
): IdentityValues | null {
  const { season, inB, days } = IDENTITY_EXAMPLE;
  const found = seasonsFor(nMemes, R).find((s) => s.id === season);
  const start = found?.start ?? null;
  const end = found?.end ?? null;
  if (start === null || end === null) {
    return null;
  }
  const cards = end - start + 1;
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
  const base = baseTdh(rateCents, days);
  return {
    season,
    cards,
    inA,
    inB,
    boostCents,
    apartBoostCents,
    linkedTdh: cards * finalTdh(base, boostCents),
    aTdh: inA * finalTdh(base, apartBoostCents),
    bTdh: inB * finalTdh(base, apartBoostCents),
  };
}
