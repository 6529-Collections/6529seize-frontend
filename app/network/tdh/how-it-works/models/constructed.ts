import {
  REGISTRY_V14,
  type DelegationEvent,
  type Transfer,
} from "@/components/explained/engine/tdh";

/**
 * Small constructed inputs for the models that replay a cycle with the TDH
 * v1.4 engine (`computeCycle`): lettered example wallets, never real
 * addresses, and transfers and links placed by block. Every value a model
 * shows is the engine's on these inputs.
 */
const R = REGISTRY_V14;

export const DAY = R.day_s;
export const HOUR = 3_600;

/** A cutoff time for the constructed inputs: 2026-10-10 23:59:59 UTC. */
export const T0 = 1_791_676_799;
/** The constructed cutoff block, above every block used below. */
export const B0 = 100;

/** Lettered example wallets: low addresses no one holds a key for. */
export const WALLET = {
  A: "0x000000000000000000000000000000000000000a",
  B: "0x000000000000000000000000000000000000000b",
  C: "0x000000000000000000000000000000000000000c",
  M: "0x000000000000000000000000000000000000004d",
  X: "0x0000000000000000000000000000000000000099",
  Y: "0x0000000000000000000000000000000000000079",
} as const;

function txHash(block: number, tx: number): string {
  return `0x${(block * 1000 + tx).toString(16).padStart(64, "0")}`;
}

/** A transfer's position, time, token, parties and amount. */
interface Move {
  readonly block: number;
  readonly tx: number;
  readonly log: number;
  readonly at: number;
  readonly token: number;
  readonly from: string;
  readonly to: string;
  readonly amount: number;
}

/** A Meme transfer at its position. */
export function transfer(move: Move): Transfer {
  return {
    block: move.block,
    txIndex: move.tx,
    logIndex: move.log,
    batchPos: 0,
    timestamp: move.at,
    tx: txHash(move.block, move.tx),
    contract: R.memes,
    token: move.token,
    from: move.from,
    to: move.to,
    amount: move.amount,
  };
}

/**
 * Two wallets linked both ways (P26 §6.1, §6.2): each registers a
 * consolidation with the other, under The Memes, at `at`. The first
 * registration is at `block`, the second in the next block.
 */
export function linkBothWays(
  a: string,
  b: string,
  block: number,
  at: number
): DelegationEvent[] {
  return [
    {
      block,
      txIndex: 0,
      logIndex: 0,
      kind: "REGISTER",
      from: a,
      to: b,
      collection: R.memes,
      useCase: R.consolidation_use_case,
      timestamp: at,
    },
    {
      block: block + 1,
      txIndex: 0,
      logIndex: 0,
      kind: "REGISTER",
      from: b,
      to: a,
      collection: R.memes,
      useCase: R.consolidation_use_case,
      timestamp: at,
    },
  ];
}
