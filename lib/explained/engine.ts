import {
  additionalSetsMicro,
  baseTdh,
  boost,
  effectiveEdition,
  finalTdh,
  rateCents,
} from "@/lib/tdh/tdhV1Arithmetic";

/**
 * The one seam between the facts layer and the TDH engine. Release 1's
 * engine is `engine/tdh.ts` (lane E: the registry-driven port of the
 * mockups' engine, which passes P26's in-scope vectors and the D136
 * checks); until it lands this adapter wraps today's TDH arithmetic, which
 * computes the same rates, editions and boosts. Swapping engines changes
 * this file only.
 */
export interface BoostQuery {
  /** Complete sets of every eligible Meme. */
  readonly fullSets: number;
  readonly gradients: number;
  /** Seasons held completely, by number, when there is no full set. */
  readonly completeSeasons: readonly number[];
  readonly genesis: boolean;
  readonly nakamoto: boolean;
  /** Eligible Memes on the cycle. */
  readonly nMemes: number;
}

export interface EngineAdapter {
  /** Which engine computed the values, for the facts' source lines. */
  readonly name: string;
  /** RATE(H, E) in cents (P26 §8.1); `minimumOne` for Gradients. */
  rateCents(numerator: number, edition: number, minimumOne?: boolean): number;
  /** E = max(minted + adj, floor) (P26 §5.2). */
  effectiveEdition(
    minted: number,
    claimLimit: number
  ): { edition: number; floorApplied: boolean };
  /** BASE(rate, days) (P26 §8.2). */
  baseTdh(rateCents: number, days: number): number;
  /** FINAL(base, beta) (P26 §8.4). */
  finalTdh(base: number, betaCents: number): number;
  /** The boost in cents (P26 §8.3). */
  boostCents(query: BoostQuery): number;
  /** ADD(sets) in micro-units (P26 §8.3). */
  additionalSetsMicro(sets: number): number;
}

export const ENGINE: EngineAdapter = {
  name: "the TDH v1.4 arithmetic (lib/tdh/tdhV1Arithmetic.ts)",
  rateCents(numerator, edition, minimumOne = false) {
    const cents = rateCents(numerator, edition, minimumOne);
    if (cents === null) {
      throw new RangeError(`no rate for an edition of ${edition}`);
    }
    return cents;
  },
  effectiveEdition(minted, claimLimit) {
    return effectiveEdition(minted, claimLimit);
  },
  baseTdh(cents, days) {
    return baseTdh(cents, days);
  },
  finalTdh(base, betaCents) {
    return finalTdh(base, betaCents);
  },
  boostCents(query) {
    return boost({
      fullSets: query.fullSets,
      gradients: query.gradients,
      completeSeasons: query.completeSeasons,
      genesis: query.genesis,
      nakamoto: query.nakamoto,
      nMemes: query.nMemes,
    }).betaCents;
  },
  additionalSetsMicro(sets) {
    return additionalSetsMicro(sets);
  },
};
