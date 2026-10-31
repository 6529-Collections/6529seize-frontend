import {
  REGISTRY_V14,
  ZERO,
  computeCycle,
  type Transfer,
} from "@/components/explained/engine/tdh";
import {
  B0,
  DAY,
  HOUR,
  T0,
  WALLET,
  linkBothWays,
  transfer,
} from "./constructed";

/**
 * "Sales and moves" (P26 §7.1, §7.2): every wallet keeps a stack of its
 * copies' arrival times. A sale takes the last entries of the sender's
 * stack; a move inside one identity carries the entries, times and all, to
 * the end of the receiver's stack; any other move starts new entries.
 *
 * The example: wallets A and B are linked both ways. B has held one copy of
 * a card for 300 days, A one for 10. Each action is replayed as one cycle
 * by the TDH v1.4 engine; the days shown are its `raw` values. The Break it
 * moves B's old copy to A and then sells one: the moved copy is now last in
 * A's stack, so it is the one that leaves (legacy order, which P26 keeps).
 */
const R = REGISTRY_V14;

export type StackAction = "hold" | "sell" | "move" | "moveThenSell";

export const STACK_ACTIONS: readonly Exclude<StackAction, "moveThenSell">[] = [
  "hold",
  "sell",
  "move",
];

/** The example: days each copy has been held at the cutoff. */
export const STACKS = { oldDays: 300, newDays: 10, card: 1 } as const;

interface StackValues {
  /** Days of A's copies, first in to last in. */
  readonly a: readonly number[];
  /** Days of B's copies, first in to last in. */
  readonly b: readonly number[];
  /** Days of the copy sold, or null. */
  readonly sold: number | null;
  /** The identity's whole days for the card: A's and B's raw, added. */
  readonly raw: number;
}

function inputFor(action: StackAction): Transfer[] {
  const { oldDays, newDays, card } = STACKS;
  const moves: Transfer[] = [
    transfer({
      block: 1,
      tx: 0,
      log: 0,
      at: T0 - oldDays * DAY,
      token: card,
      from: ZERO,
      to: WALLET.B,
      amount: 1,
    }),
    transfer({
      block: 2,
      tx: 0,
      log: 0,
      at: T0 - newDays * DAY,
      token: card,
      from: ZERO,
      to: WALLET.A,
      amount: 1,
    }),
  ];
  if (action === "move" || action === "moveThenSell") {
    moves.push(
      transfer({
        block: 60,
        tx: 0,
        log: 0,
        at: T0 - 2 * HOUR,
        token: card,
        from: WALLET.B,
        to: WALLET.A,
        amount: 1,
      })
    );
  }
  if (action === "sell" || action === "moveThenSell") {
    moves.push(
      transfer({
        block: 61,
        tx: 0,
        log: 0,
        at: T0 - HOUR,
        token: card,
        from: WALLET.A,
        to: WALLET.C,
        amount: 1,
      })
    );
  }
  return moves;
}

function rawOf(
  result: ReturnType<typeof computeCycle>,
  wallet: string
): { readonly raw: number; readonly balance: number } {
  const token = result.wallets[wallet]?.memes[String(STACKS.card)];
  return { raw: token?.raw ?? 0, balance: token?.balance ?? 0 };
}

/**
 * Replays the action and reads A's and B's whole days from the engine. The
 * order of the copies drawn follows P26 §7.1 (moved entries are appended);
 * which copy left is read from the engine's days, not assumed.
 */
export function stackValues(action: StackAction): StackValues {
  const { oldDays, newDays } = STACKS;
  const delegationEvents = linkBothWays(WALLET.A, WALLET.B, 10, T0 - 200 * DAY);
  const result = computeCycle(
    {
      block: B0,
      timestamp: T0,
      transfers: inputFor(action),
      delegationEvents,
    },
    R
  );
  const a = rawOf(result, WALLET.A);
  const b = rawOf(result, WALLET.B);
  const before = oldDays + newDays;
  const raw = a.raw + b.raw;
  const sold =
    action === "sell" || action === "moveThenSell" ? before - raw : null;
  // A's stack, first in to last in: its own copy, then B's when moved in;
  // whichever the engine says left is removed.
  const inA =
    action === "hold" || action === "sell" ? [newDays] : [newDays, oldDays];
  const left = sold === null ? inA : removeLast(inA, sold);
  return {
    a: left.length === a.balance ? left : [],
    b: b.balance > 0 ? [b.raw] : [],
    sold,
    raw,
  };
}

/** The list without the last entry equal to `days`. */
function removeLast(list: readonly number[], days: number): number[] {
  const index = list.lastIndexOf(days);
  return index < 0 ? [...list] : list.filter((_, i) => i !== index);
}
