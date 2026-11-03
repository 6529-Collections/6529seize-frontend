import { ENGINE } from "@/lib/explained/engine";

/**
 * One wallet through every step (the full calculation by hand): one copy of
 * a card and one Gradient, each held the same whole days, in a wallet of
 * its own. The reader picks the card's edition and the days. The Gradient earns its own base and gives the boost;
 * each token's final is its base times the boost, and the identity's is
 * their sum (P26 §8.4). Every number is the engine's, on today's H.
 */
export interface Trace {
  readonly h: number;
  readonly edition: number;
  readonly days: number;
  readonly rateCents: number;
  readonly base: number;
  /** The Gradient's rate, base and final. */
  readonly gradRateCents: number;
  readonly gradBase: number;
  readonly betaCents: number;
  readonly cardFinal: number;
  readonly gradFinal: number;
  readonly final: number;
}

export function traceOf(
  h: number,
  edition: number,
  nMemes: number,
  gradRateCents: number,
  days = 100
): Trace {
  const rateCents = ENGINE.rateCents(h, edition);
  const base = ENGINE.baseTdh(rateCents, days);
  const gradBase = ENGINE.baseTdh(gradRateCents, days);
  const betaCents = ENGINE.boostCents({
    fullSets: 0,
    gradients: 1,
    completeSeasons: [],
    genesis: false,
    nakamoto: false,
    nMemes,
  });
  const cardFinal = ENGINE.finalTdh(base, betaCents);
  const gradFinal = ENGINE.finalTdh(gradBase, betaCents);
  return {
    h,
    edition,
    days,
    rateCents,
    base,
    gradRateCents,
    gradBase,
    betaCents,
    cardFinal,
    gradFinal,
    final: cardFinal + gradFinal,
  };
}
