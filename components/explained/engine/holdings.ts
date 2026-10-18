/**
 * P26 §3 and §7.1: transfers read at their types, in canonical order, netted
 * per transaction, and replayed into acquisition stacks.
 *
 * Counts are exact integers (`bigint`): an amount is a `uint256`, a balance
 * may reach 2^64 before the range check refuses it, and a stack is a list of
 * runs `[timestamp, count]`, so an ERC-1155 amount of any size costs one run.
 */

import {
  ZERO,
  invalid,
  readAddress,
  readHex,
  readUint,
  type Rules,
  type Uint,
} from "./registry";

/** A decoded transfer (P26 §3.2). */
export interface Transfer {
  readonly block: Uint;
  readonly txIndex: Uint;
  readonly logIndex: Uint;
  readonly batchPos: Uint;
  /** The header timestamp of the transfer's block. */
  readonly timestamp: Uint;
  /** The transaction hash. */
  readonly tx: string;
  /** The Memes, Gradients or NextGen, as the registry names them. */
  readonly contract: string;
  readonly token: Uint;
  readonly from: string;
  readonly to: string;
  readonly amount: Uint;
}

/** A transfer read at its types; the engine's form. */
export interface CanonicalTransfer {
  readonly block: bigint;
  readonly txIndex: bigint;
  readonly logIndex: bigint;
  readonly batchPos: bigint;
  readonly timestamp: bigint;
  readonly tx: string;
  readonly contract: string;
  readonly token: bigint;
  readonly from: string;
  readonly to: string;
  readonly amount: bigint;
}

const AMOUNT_LIMIT = 2n ** 64n;

/**
 * A transfer read at its types (P26 §3.2): positions and timestamp `uint64`,
 * token and amount `uint256`, the hash 32 bytes, addresses 20 bytes, and a
 * contract of the registry's three collections. A value outside its type
 * makes the input malformed, wherever the transfer is (vectors 71, 77, 80).
 */
export function readTransfer(t: Transfer, rules: Rules): CanonicalTransfer {
  const contract = readAddress(t.contract, "a transfer's contract");
  if (
    contract !== rules.memes &&
    contract !== rules.gradients &&
    contract !== rules.nextgen
  ) {
    throw invalid(
      `${contract} is not The Memes, Gradients or NextGen (P26 §2)`
    );
  }
  return {
    block: readUint(t.block, 64, "a transfer's block"),
    txIndex: readUint(t.txIndex, 64, "a transfer's txIndex"),
    logIndex: readUint(t.logIndex, 64, "a transfer's logIndex"),
    batchPos: readUint(t.batchPos, 64, "a transfer's batchPos"),
    timestamp: readUint(t.timestamp, 64, "a transfer's timestamp"),
    tx: readHex(t.tx, 32, "a transfer's tx"),
    contract,
    token: readUint(t.token, 256, "a transfer's token"),
    from: readAddress(t.from, "a transfer's from"),
    to: readAddress(t.to, "a transfer's to"),
    amount: readUint(t.amount, 256, "a transfer's amount"),
  };
}

function compareKeys(a: CanonicalTransfer, b: CanonicalTransfer): number {
  const pairs: [bigint, bigint][] = [
    [a.block, b.block],
    [a.txIndex, b.txIndex],
    [a.logIndex, b.logIndex],
    [a.batchPos, b.batchPos],
  ];
  for (const [x, y] of pairs) {
    if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/**
 * P26 §3.2-§3.3 on the transfers in blocks `<= B`: the canonical order
 * `(block, txIndex, logIndex, batchPos)`, no key twice (vector 30), amounts
 * below 2^64, and one timestamp and one hash per transaction (vectors 48 and
 * 49).
 */
export function canonicalOrder(
  transfers: readonly CanonicalTransfer[]
): CanonicalTransfer[] {
  const out = [...transfers].sort(compareKeys);
  out.forEach((t, i) => {
    if (t.amount >= AMOUNT_LIMIT) {
      throw invalid("a transfer's amount is 2^64 or more (P26 §3.2)");
    }
    const previous = out[i - 1];
    if (previous === undefined) {
      return;
    }
    if (compareKeys(previous, t) === 0) {
      throw invalid(
        "two transfers share a canonical key (P26 §3.1, vector 30)"
      );
    }
    if (
      previous.block === t.block &&
      previous.txIndex === t.txIndex &&
      (previous.timestamp !== t.timestamp || previous.tx !== t.tx)
    ) {
      throw invalid(
        "one transaction's transfers differ in timestamp or hash (P26 §3.2)"
      );
    }
  });
  return out;
}

/** A transfer that moves copies: `amount > 0` and `from != to`. */
function moves(t: CanonicalTransfer): boolean {
  return t.amount > 0n && t.from !== t.to;
}

/** One movement of a (transaction, token) group, for `netMovements`. */
interface Movement {
  readonly from: string;
  readonly to: string;
  readonly amount: Uint;
}

interface NetResult {
  /** Received minus sent, per address. */
  readonly net: ReadonlyMap<string, bigint>;
  /** The pairs that replace the group, sources and destinations ascending. */
  readonly pairs: readonly { from: string; to: string; amount: bigint }[];
}

/**
 * P26 §7.1's netting of one transaction's movements of one token (D131):
 * `net(w)` for every address, sinks included; sources (`net < 0`) and
 * destinations (`net > 0`) in ascending address order, paired head to head.
 * A `|net(w)|` of 2^64 or more is outside the range (vector 50).
 */
export function netMovements(group: readonly Movement[]): NetResult {
  const net = new Map<string, bigint>();
  for (const m of group) {
    const amount = readUint(m.amount, 256, "a movement's amount");
    net.set(m.from, (net.get(m.from) ?? 0n) - amount);
    net.set(m.to, (net.get(m.to) ?? 0n) + amount);
  }
  for (const value of net.values()) {
    if (value >= AMOUNT_LIMIT || -value >= AMOUNT_LIMIT) {
      throw invalid(
        "a net movement of 2^64 or more, outside the tdh-v1.4 range (P26 §7.1, §8.7)"
      );
    }
  }
  const addresses = [...net.keys()].sort();
  const sources = addresses
    .filter((w) => (net.get(w) as bigint) < 0n)
    .map((w) => ({ w, left: -(net.get(w) as bigint) }));
  const destinations = addresses
    .filter((w) => (net.get(w) as bigint) > 0n)
    .map((w) => ({ w, left: net.get(w) as bigint }));
  const pairs: { from: string; to: string; amount: bigint }[] = [];
  let i = 0;
  let j = 0;
  while (i < sources.length && j < destinations.length) {
    const source = sources[i] as { w: string; left: bigint };
    const destination = destinations[j] as { w: string; left: bigint };
    const k = source.left < destination.left ? source.left : destination.left;
    pairs.push({ from: source.w, to: destination.w, amount: k });
    source.left -= k;
    destination.left -= k;
    if (source.left === 0n) {
      i++;
    }
    if (destination.left === 0n) {
      j++;
    }
  }
  return { net, pairs };
}

function tokenKey(t: CanonicalTransfer): string {
  return `${t.contract}#${t.token}`;
}

function netTransaction(
  group: readonly CanonicalTransfer[]
): CanonicalTransfer[] {
  const pending = new Map<string, CanonicalTransfer[]>();
  for (const t of group) {
    if (moves(t)) {
      const list = pending.get(tokenKey(t)) ?? [];
      list.push(t);
      pending.set(tokenKey(t), list);
    }
  }
  const out: CanonicalTransfer[] = [];
  const done = new Set<string>();
  for (const t of group) {
    const key = tokenKey(t);
    if (!moves(t)) {
      out.push(t); // zero-amount and self transfers are kept
    } else if (!done.has(key)) {
      // The group's first movement takes its pairs, at its position.
      done.add(key);
      for (const p of netMovements(pending.get(key) ?? []).pairs) {
        out.push({ ...t, from: p.from, to: p.to, amount: p.amount });
      }
    }
  }
  return out;
}

/**
 * P26 §7.1's netting of canonical transfers (D131): each transaction's
 * movements of each token become their net effect. Different transactions,
 * even in one block, are not netted.
 */
function netTransactions(
  transfers: readonly CanonicalTransfer[]
): CanonicalTransfer[] {
  const out: CanonicalTransfer[] = [];
  let i = 0;
  while (i < transfers.length) {
    const first = transfers[i] as CanonicalTransfer;
    let j = i + 1;
    while (
      j < transfers.length &&
      (transfers[j] as CanonicalTransfer).block === first.block &&
      (transfers[j] as CanonicalTransfer).txIndex === first.txIndex
    ) {
      j++;
    }
    const group = transfers.slice(i, j);
    out.push(...(group.length > 1 ? netTransaction(group) : group));
    i = j;
  }
  return out;
}

/** P26 §7.1's underflow test, on the transfers before netting (vector 44). */
function checkUnderflow(
  transfers: readonly CanonicalTransfer[],
  rules: Rules
): void {
  const held = new Map<string, bigint>();
  for (const t of transfers) {
    if (!moves(t)) {
      continue;
    }
    const key = tokenKey(t);
    if (!rules.sinks.has(t.from)) {
      const have = held.get(`${key}@${t.from}`) ?? 0n;
      if (have < t.amount) {
        throw invalid(
          `${t.from} sends ${t.amount} of ${key} but holds ${have} (P26 §7.1)`
        );
      }
      held.set(`${key}@${t.from}`, have - t.amount);
    }
    if (!rules.sinks.has(t.to)) {
      held.set(`${key}@${t.to}`, (held.get(`${key}@${t.to}`) ?? 0n) + t.amount);
    }
  }
}

/** A run of copies acquired at one time. */
export interface Run {
  timestamp: bigint;
  count: bigint;
}

function pushRun(runs: Run[], timestamp: bigint, count: bigint): void {
  if (count === 0n) {
    return;
  }
  const last = runs.at(-1);
  if (last?.timestamp === timestamp) {
    last.count += count;
  } else {
    runs.push({ timestamp, count });
  }
}

/** Removes the last `amount` copies; returns them as runs in stack order. */
function takeLast(runs: Run[], amount: bigint): Run[] {
  const taken: Run[] = [];
  let left = amount;
  while (left > 0n) {
    const last = runs.at(-1) as Run;
    if (last.count <= left) {
      runs.pop();
      taken.push({ ...last });
      left -= last.count;
    } else {
      last.count -= left;
      taken.push({ timestamp: last.timestamp, count: left });
      left = 0n;
    }
  }
  return taken.reverse();
}

function stackLength(runs: readonly Run[]): bigint {
  return runs.reduce((sum, run) => sum + run.count, 0n);
}

/** Acquisition stacks: token key (`contract#id`) to wallet to runs. */
export type Stacks = Map<string, Map<string, Run[]>>;

/**
 * P26 §7.1: the acquisition stacks after canonical transfers in blocks
 * `<= B`. The underflow test reads the transfers as given; the replay reads
 * them netted. A sale takes the copies received last; a move inside one
 * identity keeps their timestamps; a sink is credited, never debited, and
 * the FirstGM burn transaction credits no one.
 */
export function replayHoldings(
  transfers: readonly CanonicalTransfer[],
  clusterOf: Readonly<Record<string, readonly string[]>>,
  rules: Rules
): Stacks {
  checkUnderflow(transfers, rules);
  const stacks: Stacks = new Map();
  for (const t of netTransactions(transfers)) {
    if (!moves(t)) {
      continue;
    }
    const key = tokenKey(t);
    const perWallet = stacks.get(key) ?? new Map<string, Run[]>();
    stacks.set(key, perWallet);
    const moved = debit(perWallet, t, key, rules);
    const destination = perWallet.get(t.to) ?? [];
    perWallet.set(t.to, destination);
    credit(destination, t, moved, clusterOf, rules);
  }
  return stacks;
}

/**
 * Takes a netted transfer's copies off the sender's stack, the last received
 * first; a sink sends from no stack (null).
 */
function debit(
  perWallet: ReadonlyMap<string, Run[]>,
  t: CanonicalTransfer,
  key: string,
  rules: Rules
): Run[] | null {
  if (rules.sinks.has(t.from)) {
    return null;
  }
  const source = perWallet.get(t.from) ?? [];
  if (stackLength(source) < t.amount) {
    throw invalid(
      `${t.from} sends more of ${key} than it holds after netting (P26 §7.1)`
    );
  }
  return takeLast(source, t.amount);
}

/**
 * Puts a netted transfer's copies on the receiver's stack: a move inside one
 * identity keeps their timestamps, any other receipt is dated by the
 * transfer, and the FirstGM burn transaction credits no one.
 */
function credit(
  destination: Run[],
  t: CanonicalTransfer,
  moved: readonly Run[] | null,
  clusterOf: Readonly<Record<string, readonly string[]>>,
  rules: Rules
): void {
  if (rules.sinks.has(t.to)) {
    // P26 §3.4: the FirstGM burn transaction is not credited to ZERO.
    if (!(t.to === ZERO && t.tx === rules.firstgmBurnTx)) {
      pushRun(destination, t.timestamp, t.amount);
    }
  } else if (moved !== null && (clusterOf[t.to] ?? [t.to]).includes(t.from)) {
    moved.forEach((run) => pushRun(destination, run.timestamp, run.count));
  } else {
    pushRun(destination, t.timestamp, t.amount);
  }
}
