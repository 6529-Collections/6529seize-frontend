import {
  REGISTRY_V14,
  ZERO,
  computeCycle,
} from "@/components/explained/engine/tdh";
import { B0, DAY, HOUR, T0, WALLET, transfer } from "./constructed";

/**
 * "Which cards count" (P26 §5.1): a Meme or a Gradient counts once its first
 * mint is a whole day old at the snapshot, `firstMint <= T −
 * eligibility_min_age_s`; a NextGen token once it is minted.
 *
 * The real part reads the newest cards' first mints from the facts layer
 * and places them on "A card ages"'s timeline (`firstDay`), so a card and a
 * copy are judged by one rule of whole days.
 *
 * The Break it is counterexample I of the Lean model, as P26 §7.1 writes
 * it, replayed by the TDH v1.4 engine: a card's first mint counts every mint
 * as logged, so a mint of one copy and its burn, inserted into another
 * transaction ten days before the snapshot, make a card count early. Every
 * value is the engine's.
 */
const R = REGISTRY_V14;

/** The first result whose snapshot finds `firstMint` a whole day old. */
export function firstCountingResult(firstMint: number, dayS: number): number {
  // T is just before the boundary, so the boundary must be strictly later
  // than a whole day after the first mint.
  return (Math.floor((firstMint + dayS) / dayS) + 1) * dayS;
}

/** Counterexample I's input, as P26 §7.1 writes it. */
export const CASE_I = {
  /** The card first minted an hour before the snapshot, to A. */
  late: 1,
  lateCopies: 5,
  /** The card minted to Y ten days before the snapshot. */
  early: 2,
  earlyCopies: 3,
  earlyDays: 10,
  /** Copies minted and burned inside the early card's mint transaction. */
  inserted: 1,
} as const;

interface CaseIValues {
  /** Whether the late card is eligible. */
  readonly lateCounts: boolean;
  readonly eligible: number;
  readonly H: number;
  /** A's balance of the late card in its record, 0 when it has none. */
  readonly aBalance: number;
  /** Y's final TDH. */
  readonly yFinal: number;
}

export function caseI(mintAndBurn: boolean): CaseIValues {
  const { late, lateCopies, early, earlyCopies, earlyDays, inserted } = CASE_I;
  const tEarly = T0 - earlyDays * DAY;
  const transfers = [
    transfer({
      block: 5,
      tx: 0,
      log: 0,
      at: tEarly,
      token: early,
      from: ZERO,
      to: WALLET.Y,
      amount: earlyCopies,
    }),
    ...(mintAndBurn
      ? [
          transfer({
            block: 5,
            tx: 0,
            log: 1,
            at: tEarly,
            token: late,
            from: ZERO,
            to: WALLET.X,
            amount: inserted,
          }),
          transfer({
            block: 5,
            tx: 0,
            log: 2,
            at: tEarly,
            token: late,
            from: WALLET.X,
            to: ZERO,
            amount: inserted,
          }),
        ]
      : []),
    transfer({
      block: 90,
      tx: 0,
      log: 0,
      at: T0 - HOUR,
      token: late,
      from: ZERO,
      to: WALLET.A,
      amount: lateCopies,
    }),
  ];
  const result = computeCycle({ block: B0, timestamp: T0, transfers }, R);
  return {
    lateCounts: result.eligibleMemes.includes(String(late)),
    eligible: result.eligibleMemes.length,
    H: result.H,
    aBalance: result.wallets[WALLET.A]?.memes[String(late)]?.balance ?? 0,
    yFinal: result.identities[WALLET.Y]?.final ?? 0,
  };
}
