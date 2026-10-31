import {
  REGISTRY_V14,
  additionalSetsMicro,
  baseTdh,
  boostOfHoldings,
  effectiveEdition,
  finalTdh,
  rateCents,
  type Registry,
} from "@/components/explained/engine/tdh";

/**
 * The one seam between the facts layer and the TDH engine. Release 1's
 * engine is `components/explained/engine/tdh.ts` (lane E: the
 * registry-driven port of P26, which passes every one of P26's conformance
 * vectors, log decoding included, refuses every file that is no vector, and
 * passes the D136 checks). This adapter computes on that engine with
 * the TDH v1.4 registry; swapping engines or registries changes this file
 * only. `__tests__/explained/engineSeam.test.ts` checks that the engine's
 * registry, registry hash, rule ID and vector count agree with the record
 * snapshot synced from 6529chain.
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
  /** The rule registry it computes on (P26 §10), for the values pages print. */
  readonly registry: Registry;
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

/** The rule registry every value of the adapter is computed on. */
const REGISTRY: Registry = REGISTRY_V14;

export const ENGINE: EngineAdapter = {
  name: `the ${REGISTRY.rule_version} engine (components/explained/engine/tdh.ts)`,
  registry: REGISTRY,
  rateCents(numerator, edition, minimumOne = false) {
    const cents = rateCents(
      numerator,
      edition,
      minimumOne ? REGISTRY.gradient_rate_minimum : undefined
    );
    if (cents === null) {
      throw new RangeError(`no rate for an edition of ${edition}`);
    }
    return cents;
  },
  effectiveEdition(minted, claimLimit) {
    const { edition, floorApplied } = effectiveEdition(
      minted,
      claimLimit,
      REGISTRY
    );
    return { edition, floorApplied };
  },
  baseTdh(cents, days) {
    return baseTdh(cents, days);
  },
  finalTdh(base, betaCents) {
    return finalTdh(base, betaCents);
  },
  boostCents(query) {
    return boostOfHoldings(
      {
        fullSets: query.fullSets,
        gradients: query.gradients,
        completeSeasons: query.completeSeasons,
        genesis: query.genesis,
        nakamoto: query.nakamoto,
      },
      query.nMemes,
      REGISTRY
    ).beta;
  },
  additionalSetsMicro(sets) {
    return additionalSetsMicro(sets, REGISTRY);
  },
};
