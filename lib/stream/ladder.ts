import { EDITION_AUCTION_CONFIG } from "@/lib/stream/constants";
import type { Wei } from "@/lib/stream/types";

/**
 * The edition auction's price ladder (D138, PLAN section 1.3).
 *
 * Step `i` costs `base × M[(i mod N) × 192/N] × 10^(i div N) / 100`, where `M`
 * is the fixed E192 table of three-digit mantissas, `round(100 × 10^(j/192))`
 * rounded half up. `N` (steps per decade) is 24, 48, 96 or 192. The table is
 * fixed in the contract's bytecode; it is fixed here too, and the tests check
 * it against the D138 reference model.
 */
export const E192_MANTISSAS: readonly number[] = [
  100, 101, 102, 104, 105, 106, 107, 109, 110, 111, 113, 114, 115, 117, 118,
  120, 121, 123, 124, 126, 127, 129, 130, 132, 133, 135, 137, 138, 140, 142,
  143, 145, 147, 149, 150, 152, 154, 156, 158, 160, 162, 164, 165, 167, 169,
  172, 174, 176, 178, 180, 182, 184, 187, 189, 191, 193, 196, 198, 200, 203,
  205, 208, 210, 213, 215, 218, 221, 223, 226, 229, 232, 234, 237, 240, 243,
  246, 249, 252, 255, 258, 261, 264, 267, 271, 274, 277, 280, 284, 287, 291,
  294, 298, 301, 305, 309, 312, 316, 320, 324, 328, 332, 336, 340, 344, 348,
  352, 357, 361, 365, 370, 374, 379, 383, 388, 392, 397, 402, 407, 412, 417,
  422, 427, 432, 437, 442, 448, 453, 459, 464, 470, 475, 481, 487, 493, 499,
  505, 511, 517, 523, 530, 536, 542, 549, 556, 562, 569, 576, 583, 590, 597,
  604, 612, 619, 626, 634, 642, 649, 657, 665, 673, 681, 690, 698, 706, 715,
  723, 732, 741, 750, 759, 768, 777, 787, 796, 806, 816, 825, 835, 845, 856,
  866, 876, 887, 898, 909, 919, 931, 942, 953, 965, 976, 988,
];

/** The steps-per-decade values governance may choose. */
const LADDER_DENSITIES = [24, 48, 96, 192] as const;

interface LadderParams {
  readonly base: Wei;
  readonly perDecade: number;
  readonly steps: number;
}

const DEFAULT_LADDER: LadderParams = {
  base: EDITION_AUCTION_CONFIG.base,
  perDecade: EDITION_AUCTION_CONFIG.perDecade,
  steps: EDITION_AUCTION_CONFIG.steps,
};

function assertDensity(perDecade: number): void {
  if (!LADDER_DENSITIES.some((density) => density === perDecade)) {
    throw new RangeError(`unsupported ladder density: ${perDecade}`);
  }
}

/** The price of step `step`, in wei. Exact integer math, as on-chain. */
export function stepPrice(
  step: number,
  ladder: Pick<LadderParams, "base" | "perDecade"> = DEFAULT_LADDER
): Wei {
  assertDensity(ladder.perDecade);
  if (!Number.isInteger(step) || step < 0) {
    throw new RangeError(`invalid step: ${step}`);
  }
  const stride = 192 / ladder.perDecade;
  const mantissa = E192_MANTISSAS[(step % ladder.perDecade) * stride];
  if (mantissa === undefined) {
    throw new RangeError(`invalid step: ${step}`);
  }
  const decade = BigInt(Math.floor(step / ladder.perDecade));
  return (ladder.base * BigInt(mantissa) * 10n ** decade) / 100n;
}

/** Every step's price, ascending. */
export function ladderPrices(ladder: LadderParams = DEFAULT_LADDER): Wei[] {
  return Array.from({ length: ladder.steps }, (_, step) =>
    stepPrice(step, ladder)
  );
}

/**
 * The step whose price is closest to `amount` (typed prices snap to a step,
 * PLAN section 6). Ties go to the lower step. Clamped to the ladder.
 */
export function nearestStep(
  amount: Wei,
  ladder: LadderParams = DEFAULT_LADDER
): number {
  let low = 0;
  let high = ladder.steps - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (stepPrice(middle, ladder) < amount) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  if (low === 0) {
    return 0;
  }
  const above = stepPrice(low, ladder) - amount;
  const below = amount - stepPrice(low - 1, ladder);
  return below <= above ? low - 1 : low;
}
