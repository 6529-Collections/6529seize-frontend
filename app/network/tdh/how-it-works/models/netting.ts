import {
  REGISTRY_V14,
  ZERO,
  computeCycle,
} from "@/components/explained/engine/tdh";
import { B0, DAY, T0, WALLET, transfer } from "./constructed";

/**
 * "Inside one transaction" (TDH-DESIGN.md §5.4), computed by the TDH v1.4
 * engine on small constructed inputs, never typed:
 *
 * - the round trip: a copy held for a while goes to a marketplace and comes
 *   back. Replayed as one transaction, its net movement is zero and it keeps
 *   its days (D131); replayed as two transactions, it comes back new;
 * - counterexample H of the Lean manifest (Tdh/Proofs/Counterexamples.lean,
 *   case H, on the TDH v1.4 registry): a mint and its burn inside one
 *   transaction leave every stack the same, yet change the edition, H, the
 *   rates and another holder's TDH.
 */

const R = REGISTRY_V14;

/** The round trip's example: days held before it, and its distance from T. */
export const ROUND_TRIP = { heldDays: 300, hoursBeforeT: 2, card: 1 } as const;
/** Whole days A's copy has at T after the round trip. */
export function roundTripDays(asOneTransaction: boolean): number {
  const { heldDays, hoursBeforeT, card } = ROUND_TRIP;
  const at = T0 - hoursBeforeT * 3_600;
  const transfers = [
    transfer({
      block: 1,
      tx: 0,
      log: 0,
      at: T0 - heldDays * DAY,
      token: card,
      from: ZERO,
      to: WALLET.A,
      amount: 1,
    }),
    transfer({
      block: 50,
      tx: 0,
      log: 0,
      at,
      token: card,
      from: WALLET.A,
      to: WALLET.M,
      amount: 1,
    }),
    // A log index is unique in its block; only the transaction differs.
    transfer({
      block: 50,
      tx: asOneTransaction ? 0 : 1,
      log: 1,
      at,
      token: card,
      from: WALLET.M,
      to: WALLET.A,
      amount: 1,
    }),
  ];
  const result = computeCycle({ block: B0, timestamp: T0, transfers }, R);
  return result.wallets[WALLET.A]?.memes[String(card)]?.raw ?? 0;
}

/** Counterexample H's input, as the Lean file writes it. */
export const CASE_H = {
  meme1: 1,
  meme2: 2,
  minted1: 10,
  minted2: 5,
  inserted: 10,
} as const;

interface CaseHValues {
  readonly minted1: number;
  readonly H: number;
  /** Meme 2's rate in cents. */
  readonly rate2: number;
  /** B's final TDH. */
  readonly bFinal: number;
  readonly total: number;
}

export function caseH(mintAndBurn: boolean): CaseHValues {
  const { meme1, meme2, minted1, minted2, inserted } = CASE_H;
  const tA = T0 - 10 * DAY;
  const transfers = [
    transfer({
      block: 1,
      tx: 0,
      log: 0,
      at: T0 - 100 * DAY,
      token: meme1,
      from: ZERO,
      to: WALLET.A,
      amount: minted1,
    }),
    transfer({
      block: 2,
      tx: 0,
      log: 0,
      at: T0 - 80 * DAY,
      token: meme2,
      from: ZERO,
      to: WALLET.B,
      amount: minted2,
    }),
    transfer({
      block: 50,
      tx: 0,
      log: 0,
      at: tA,
      token: meme1,
      from: WALLET.A,
      to: WALLET.C,
      amount: 1,
    }),
    ...(mintAndBurn
      ? [
          transfer({
            block: 50,
            tx: 0,
            log: 1,
            at: tA,
            token: meme1,
            from: ZERO,
            to: WALLET.X,
            amount: inserted,
          }),
          transfer({
            block: 50,
            tx: 0,
            log: 2,
            at: tA,
            token: meme1,
            from: WALLET.X,
            to: ZERO,
            amount: inserted,
          }),
        ]
      : []),
  ];
  const result = computeCycle({ block: B0, timestamp: T0, transfers }, R);
  const rateKey = Object.keys(result.rates).find((key) =>
    key.endsWith(`#${meme2}`)
  );
  return {
    minted1: result.edition[String(meme1)] ?? 0,
    H: result.H,
    rate2: rateKey ? (result.rates[rateKey] ?? 0) : 0,
    bFinal: result.identities[WALLET.B]?.final ?? 0,
    total: result.totals.final,
  };
}
