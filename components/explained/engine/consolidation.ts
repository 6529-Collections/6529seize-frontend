/**
 * P26 §6: consolidation, with D136's four-wallet rule. Delegation events
 * build a row per pair of wallets (§6.2); confirmed rows group wallets into
 * identities of up to `consolidation_max_wallets` (§6.3), and a group grows
 * past `consolidation_ungated_max_wallets` only when one member's links with
 * every other member were registered both ways at or after
 * `consolidation_gate_activation_s`.
 *
 * Wallets are compared as strings. `computeCycle` gives them lowercase
 * addresses; a model may give letters.
 */

import {
  invalid,
  readAddress,
  readUint,
  rulesOf,
  type Registry,
  type Rules,
  type Uint,
} from "./registry";

/** A decoded delegation event (P26 §6.1), kept or not. */
export interface DelegationEvent {
  readonly block: Uint;
  readonly txIndex: Uint;
  readonly logIndex: Uint;
  readonly kind: "REGISTER" | "REVOKE";
  /** `w1`, the wallet whose delegation changes. */
  readonly from: string;
  /** `w2`, the delegate. */
  readonly to: string;
  readonly collection: string;
  /** The event's `useCase`; absent means the registry's consolidation use case. */
  readonly useCase?: Uint;
  /**
   * The header timestamp of the event's block (P26 §6.2). Absent or null: no
   * time, which counts as before activation (vector 99).
   */
  readonly timestamp?: Uint | null;
}

/** `(block, txIndex, logIndex)`, compared in that order. */
type Position = readonly [bigint, bigint, bigint];

export function comparePositions(a: Position, b: Position): number {
  for (let i = 0; i < 3; i++) {
    const x = a[i] as bigint;
    const y = b[i] as bigint;
    if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/** P26 §6.2's row for one pair of wallets. */
export interface PairRow {
  /** The wallet that registered its direction first. */
  readonly w1: string;
  /** The wallet that registered second. */
  readonly w2: string;
  /** The position of the event that last set the row. */
  readonly position: Position;
  readonly confirmed: boolean;
  /** The time of `w1`'s latest registration, or null for none. */
  readonly t1: bigint | null;
  /** The time of `w2`'s latest registration; null while not confirmed. */
  readonly t2: bigint | null;
}

/**
 * The rows, each under its pair's key: the two wallets sorted and joined
 * with `-` (`"A-B"`, or two lowercase addresses), the identity key of P26
 * §6.5 for two wallets.
 */
export type PairState = ReadonlyMap<string, PairRow>;

/** A pair's key (`PairState`). */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

interface ReadEvent {
  readonly position: Position;
  readonly kind: "REGISTER" | "REVOKE";
  readonly from: string;
  readonly to: string;
  readonly time: bigint | null;
}

function readPosition(e: DelegationEvent): Position {
  return [
    readUint(e.block, 64, "a delegation event's block"),
    readUint(e.txIndex, 64, "a delegation event's txIndex"),
    readUint(e.logIndex, 64, "a delegation event's logIndex"),
  ];
}

function readTime(e: DelegationEvent): bigint | null {
  return e.timestamp === undefined || e.timestamp === null
    ? null
    : readUint(e.timestamp, 64, "a delegation event's timestamp");
}

function readKind(e: DelegationEvent): "REGISTER" | "REVOKE" {
  if (e.kind !== "REGISTER" && e.kind !== "REVOKE") {
    throw invalid(`${String(e.kind)} is no delegation event kind (P26 §6.1)`);
  }
  return e.kind;
}

/**
 * P26 §6.2: the pair state after `events`, applied in position order. The
 * events are kept consolidation events (§6.1); two at one position make the
 * input invalid.
 */
export function pairState(events: readonly DelegationEvent[]): PairState {
  const read: ReadEvent[] = events.map((e) => ({
    position: readPosition(e),
    kind: readKind(e),
    from: e.from,
    to: e.to,
    time: readTime(e),
  }));
  read.sort((a, b) => comparePositions(a.position, b.position));
  const rows = new Map<string, PairRow>();
  read.forEach((e, i) => {
    const previous = read[i - 1];
    if (previous && comparePositions(previous.position, e.position) === 0) {
      throw invalid(
        "two delegation events at one position (P26 §3.1, vector 51)"
      );
    }
    applyEvent(rows, e);
  });
  return rows;
}

function applyEvent(rows: Map<string, PairRow>, e: ReadEvent): void {
  const { from: a, to: b, position } = e;
  const key = pairKey(a, b);
  const row = rows.get(key);
  if (e.kind === "REGISTER") {
    if (!row) {
      rows.set(key, {
        w1: a,
        w2: b,
        position,
        confirmed: false,
        t1: e.time,
        t2: null,
      });
    } else if (row.w1 === a) {
      // a registers its direction again: only its time moves (vector 92)
      rows.set(key, { ...row, t1: e.time });
    } else {
      // a confirms the pair, or registers again as its second registrant
      rows.set(key, {
        w1: b,
        w2: a,
        position,
        confirmed: true,
        t1: row.t1,
        t2: e.time,
      });
    }
    return;
  }
  if (!row) {
    return;
  }
  if (row.w1 === a && !row.confirmed) {
    rows.delete(key);
  } else if (row.w1 === a) {
    // the first registrant revokes: the second's direction and time remain
    rows.set(key, {
      w1: b,
      w2: a,
      position,
      confirmed: false,
      t1: row.t2,
      t2: null,
    });
  } else {
    rows.set(key, {
      w1: b,
      w2: a,
      position,
      confirmed: false,
      t1: row.t1,
      t2: null,
    });
  }
}

/** A wallet the four-wallet gate turned away from a group (D136). */
interface GateRefusal {
  readonly group: readonly string[];
  readonly wallet: string;
}

export interface ClusterResult {
  /** Every group of two or more wallets, each sorted. */
  readonly clusters: readonly (readonly string[])[];
  /** Each wallet of a confirmed pair to its sorted cluster (singletons too). */
  readonly of: Readonly<Record<string, readonly string[]>>;
  /** The joins the gate refused, in the order the scan met them. */
  readonly refusals: readonly GateRefusal[];
}

/**
 * P26 §6.3 (D136, 6529.io's grouping): confirmed links newest block first,
 * within one block by ascending pair key; a wallet joins a group when it is
 * linked with every member, and a group grows past the ungated maximum only
 * through a member whose links with all the others are fresh.
 */
export function clusters(state: PairState, r: Registry): ClusterResult {
  return clustersWith(state, rulesOf(r));
}

function clustersWith(state: PairState, rules: Rules): ClusterResult {
  const confirmed = [...state.values()].filter((row) => row.confirmed);
  confirmed.sort((x, y) => {
    const bx = x.position[0];
    const by = y.position[0];
    if (bx !== by) {
      return bx > by ? -1 : 1;
    }
    return pairKey(x.w1, x.w2) < pairKey(y.w1, y.w2) ? -1 : 1;
  });
  const linked = new Map<string, PairRow>();
  for (const row of confirmed) {
    linked.set(pairKey(row.w1, row.w2), row);
  }
  const fresh = (x: string, y: string): boolean => {
    const row = linked.get(pairKey(x, y));
    return (
      row !== undefined &&
      row.t1 !== null &&
      row.t2 !== null &&
      row.t1 >= rules.gateActivation &&
      row.t2 >= rules.gateActivation
    );
  };
  const refusals: GateRefusal[] = [];
  const canJoin = (group: readonly string[], wallet: string): boolean => {
    if (!group.every((x) => linked.has(pairKey(x, wallet)))) {
      return false;
    }
    if (group.length < rules.ungatedMaxWallets) {
      return true;
    }
    const all = [...group, wallet];
    const hub = all.some((m) => all.every((o) => o === m || fresh(m, o)));
    if (!hub) {
      refusals.push({ group: [...group], wallet });
    }
    return hub;
  };
  const queue = confirmed.map((row) => [row.w1, row.w2] as const);
  const used = new Set<string>();
  const groups: string[][] = [];
  while (queue.length > 0) {
    const [w1, w2] = queue.shift() as readonly [string, string];
    if (used.has(w1) || used.has(w2)) {
      continue;
    }
    const group = [w1, w2];
    let added = true;
    while (added && group.length < rules.maxWallets) {
      added = false;
      for (let i = 0; i < queue.length; i++) {
        const [c1, c2] = queue[i] as readonly [string, string];
        let wallet: string | null = null;
        if (group.includes(c1) && !group.includes(c2) && !used.has(c2)) {
          wallet = c2;
        } else if (group.includes(c2) && !group.includes(c1) && !used.has(c1)) {
          wallet = c1;
        }
        if (wallet !== null && canJoin(group, wallet)) {
          group.push(wallet);
          queue.splice(i, 1);
          added = true;
          break;
        }
      }
    }
    group.forEach((w) => used.add(w));
    groups.push(group.sort());
  }
  const of: Record<string, readonly string[]> = {};
  for (const group of groups) {
    for (const w of group) {
      of[w] = group;
    }
  }
  for (const row of confirmed) {
    for (const w of [row.w1, row.w2]) {
      of[w] ??= [w];
    }
  }
  return { clusters: groups, of, refusals };
}

/** A delegation event read at its types (P26 §3.2, §6.1). */
export interface CheckedEvent extends ReadEvent {
  readonly collection: string;
  readonly useCase: bigint;
}

export function readDelegationEvent(
  e: DelegationEvent,
  rules: Rules
): CheckedEvent {
  return {
    position: readPosition(e),
    kind: readKind(e),
    from: readAddress(e.from, "a delegation event's from"),
    to: readAddress(e.to, "a delegation event's to"),
    collection: readAddress(e.collection, "a delegation event's collection"),
    useCase:
      e.useCase === undefined
        ? rules.useCase
        : readUint(e.useCase, 256, "a delegation event's useCase"),
    time: readTime(e),
  };
}

/**
 * P26 §6.1: the kept events in blocks `<= B`, in position order. Two events
 * at one position, kept or not, make the input invalid (vector 51), and so
 * does one stamped after `T` (vector 100). An event is kept when its use
 * case is `consolidation_use_case`, its collection is in
 * `consolidation_collections`, and its two wallets differ and are not sinks.
 */
function keptEvents(
  events: readonly CheckedEvent[],
  B: bigint,
  T: bigint,
  rules: Rules
): CheckedEvent[] {
  const inputs = events
    .filter((e) => e.position[0] <= B)
    .sort((a, b) => comparePositions(a.position, b.position));
  inputs.forEach((e, i) => {
    const previous = inputs[i - 1];
    if (previous && comparePositions(previous.position, e.position) === 0) {
      throw invalid(
        "two delegation events at one position (P26 §3.1, vector 51)"
      );
    }
    if (e.time !== null && e.time > T) {
      throw invalid(
        "a delegation event in a block <= B is stamped after T (P26 §4.2, vector 100)"
      );
    }
  });
  return inputs.filter(
    (e) =>
      e.useCase === rules.useCase &&
      rules.collections.has(e.collection) &&
      e.from !== e.to &&
      !rules.sinks.has(e.from) &&
      !rules.sinks.has(e.to)
  );
}

function toEvent(e: CheckedEvent): DelegationEvent {
  return {
    block: e.position[0],
    txIndex: e.position[1],
    logIndex: e.position[2],
    kind: e.kind,
    from: e.from,
    to: e.to,
    collection: e.collection,
    timestamp: e.time,
  };
}

/** P26 §6 at the cutoff `(B, T)`: the kept events' pairs, then the clusters. */
export function clustersWithKept(
  events: readonly CheckedEvent[],
  B: bigint,
  T: bigint,
  rules: Rules
): ClusterResult {
  const kept = keptEvents(events, B, T, rules).map(toEvent);
  return clustersWith(pairState(kept), rules);
}
