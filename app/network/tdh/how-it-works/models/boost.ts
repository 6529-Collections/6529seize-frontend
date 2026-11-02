import {
  REGISTRY_V14,
  additionalSetsLimit,
  boostOfHoldings,
  boostableSeasons,
  seasonsFor,
  type BoostResult,
} from "@/components/explained/engine/tdh";

/**
 * "The boost ladder" (TDH-DESIGN.md §5.6): the boost of what a collector
 * holds, computed by the TDH v1.4 engine (P26 §8.3) on the registry the
 * facts layer's seam uses, with the real number of eligible Memes. The
 * parts are the engine's, in micro-units; the figure only draws them.
 */
const R = REGISTRY_V14;

export interface BoostState {
  /** Boostable seasons held completely, from the first. */
  readonly seasons: number;
  readonly sets: number;
  readonly genesis: boolean;
  readonly nakamoto: boolean;
  readonly gradients: number;
}

export const BOOST_START: BoostState = {
  seasons: 0,
  sets: 0,
  genesis: false,
  nakamoto: false,
  gradients: 1,
};

/** How many full sets the stepper offers. */
export const MAX_SETS = 3;

/** The seasons that pay a bonus on a cycle with `nMemes` eligible Memes. */
export function payingSeasons(nMemes: number): number {
  return boostableSeasons(seasonsFor(nMemes, R)).length;
}

/** The registry's Gradient limit: the Break it adds one more. */
export function gradientLimit(): number {
  return R.gradient_max_count;
}

export function boostOf(state: BoostState, nMemes: number): BoostResult {
  const paying = boostableSeasons(seasonsFor(nMemes, R)).map((s) => s.id);
  return boostOfHoldings(
    {
      fullSets: state.sets,
      completeSeasons: paying.slice(0, state.seasons),
      genesis: state.genesis,
      nakamoto: state.nakamoto,
      gradients: state.gradients,
    },
    nMemes,
    R
  );
}

/** The most the extra sets can ever add, in boost units (about 0.144). */
export function extraSetsLimit(): number {
  return additionalSetsLimit(R).micro / 1_000_000;
}

/**
 * The registry's boost values, as the rule rail prints them: each bonus and
 * the extra sets' first step as a multiplier, the ratio q as a fraction.
 */
export function boostRuleValues(): {
  readonly season: number;
  readonly first: number;
  readonly q: number;
  readonly genesis: number;
  readonly nakamoto: number;
  readonly gradient: number;
  readonly gradientMax: number;
} {
  return {
    season: R.season_bonus / 1_000_000,
    first: R.additional_set_first / 1_000_000,
    q: R.additional_set_ratio / 10_000,
    genesis: R.genesis_bonus / 1_000_000,
    nakamoto: R.nakamoto_bonus / 1_000_000,
    gradient: R.gradient_bonus / 1_000_000,
    gradientMax: R.gradient_max_count,
  };
}
