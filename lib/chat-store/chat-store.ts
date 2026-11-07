/**
 * The normalized chat store (WAVES-PLAN 0.4). Framework-free; the React
 * hook owns subscriptions, loading flags and render scheduling.
 *
 * - Records by key: the drop ID now, the root event ID in Phase 2 (D5);
 *   only `keyOf` changes then.
 * - A per-wave index sorted by (time, serial, key): `order.ts`.
 * - Merge by key: a lookup, then an append or a binary-search insert. No
 *   per-merge scan of the wave, no re-hashing, no re-sort.
 * - Stale revisions are rejected (`revision.ts`, from #4128).
 * - Deleted keys are tombstoned per wave, so responses already in flight
 *   cannot bring them back (#4639).
 * - Pending sends are keyed by their client ID and carry an explicit
 *   lifecycle (`lib/action-lifecycle`). A server copy carrying the send's
 *   `client_drop_id` (the POST response or its creation frame) settles it
 *   exactly; without one, today's content match is the fallback.
 */
import {
  createActionState,
  transition,
  type ActionEvent,
  type ActionState,
  type IllegalTransitionReporter,
} from "@/lib/action-lifecycle";
import {
  DropSize,
  type Drop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";

import {
  compareOrderEntries,
  comparePlaceholderEntries,
  orderEntryFor,
  type OrderEntry,
  type PlaceholderEntry,
} from "./order";
import { isOlderRevision } from "./revision";
import { isSameRecord } from "./same-record";
import { SortedIndex } from "./sorted-index";
import {
  findPendingMatch,
  stableIdentity,
  stableInputsChanged,
} from "./stable-key";

export type MergePolicy =
  /** Incoming copies replace stored ones (live updates, pages). */
  | "standard"
  /** Stored copies win; only unknown keys are added (server feed seeds). */
  | "preserve-existing";

export interface MergeResult {
  readonly changed: boolean;
  /** Incoming copies older than the stored revision. */
  readonly stale: number;
  /** Pending sends replaced by their accepted copy. */
  readonly reconciled: number;
}

export interface PendingSend {
  readonly clientId: string;
  readonly waveId: string;
  readonly state: ActionState;
  /** The `client_drop_id` sent with the create request, lowercase. */
  readonly clientDropId: string | null;
  /** The accepted record's key, once its server copy replaced the pending one. */
  readonly serverKey: string | null;
}

export interface ChatStoreOptions {
  /** The record key. Phase 0: the drop ID; Phase 2: the root event ID. */
  readonly keyOf?: ((drop: Drop) => string) | undefined;
  /** Receives illegal pending-send transitions; default: the lifecycle's. */
  readonly lifecycleReporter?: IllegalTransitionReporter | null | undefined;
}

/** The create request's client ID, echoed on its response and creation frame. */
function clientDropIdOf(drop: Drop): string | null {
  const value = (drop as { readonly client_drop_id?: unknown }).client_drop_id;
  return typeof value === "string" && value.length > 0
    ? value.toLowerCase()
    : null;
}

/** `getOptimisticDropId` prefixes client IDs of optimistic drops with this. */
export const OPTIMISTIC_KEY_PREFIX = "temp-";

/** Above this many changes in one call, the index is rebuilt in one pass. */
const BATCH_THRESHOLD = 16;
/** Settled pending sends kept for lookups after their row was replaced. */
const MAX_SETTLED_PENDING_SENDS = 64;

const EMPTY_DROPS: Drop[] = [];

const UNCHANGED: MergeResult = { changed: false, stale: 0, reconciled: 0 };

interface WaveRecords {
  readonly records: Map<string, Drop>;
  readonly entries: Map<string, OrderEntry>;
  readonly order: SortedIndex<OrderEntry>;
  readonly placeholderEntries: Map<string, PlaceholderEntry>;
  readonly placeholders: SortedIndex<PlaceholderEntry>;
  /** Accepted records by serial number; a serial belongs to one record. */
  readonly serials: Map<number, string>;
  /** Client IDs of pending sends still shown as their own row. */
  readonly pending: Set<string>;
  version: number;
  snapshot: Drop[] | null;
}

/** One merge call: its wave, whether stored copies win, and its results. */
interface MergeContext {
  readonly waveId: string;
  readonly wave: WaveRecords;
  readonly preserveExisting: boolean;
  changed: boolean;
  stale: number;
  reconciled: number;
}

const createWave = (): WaveRecords => ({
  records: new Map(),
  entries: new Map(),
  order: new SortedIndex(compareOrderEntries),
  placeholderEntries: new Map(),
  placeholders: new SortedIndex(comparePlaceholderEntries),
  serials: new Map(),
  pending: new Set(),
  version: 0,
  snapshot: null,
});

const withIdentity = (
  drop: ExtendedDrop,
  identity: { readonly stableKey: string; readonly stableHash: string }
): ExtendedDrop =>
  drop.stableKey === identity.stableKey &&
  drop.stableHash === identity.stableHash
    ? drop
    : {
        ...drop,
        stableKey: identity.stableKey,
        stableHash: identity.stableHash,
      };

export class ChatStore {
  private readonly keyOf: (drop: Drop) => string;
  private readonly waves = new Map<string, WaveRecords>();
  /** Per-wave deleted keys; Map order is least recently touched first. */
  private readonly tombstones = new Map<string, Set<string>>();
  private readonly pendingSends = new Map<string, PendingSend>();
  /** `client_drop_id` -> client ID of the pending send that sent it. */
  private readonly pendingByClientDropId = new Map<string, string>();
  private readonly lifecycleReporter:
    | IllegalTransitionReporter
    | null
    | undefined;
  /** Settled client IDs, oldest first. */
  private readonly settled = new Set<string>();
  /** Source of wave versions; never repeats, even after a wave is deleted. */
  private clock = 0;

  constructor(options: ChatStoreOptions = {}) {
    this.keyOf = options.keyOf ?? ((drop) => drop.id);
    this.lifecycleReporter = options.lifecycleReporter;
  }

  // Reads -------------------------------------------------------------------

  /**
   * The wave's records, newest first. The same array is returned until the
   * wave changes, so it can serve as an external-store snapshot. Callers
   * must not mutate it.
   */
  getDrops(waveId: string): Drop[] {
    const wave = this.waves.get(waveId);
    if (wave === undefined) {
      return EMPTY_DROPS;
    }
    wave.snapshot ??= this.materialize(wave);
    return wave.snapshot;
  }

  get(waveId: string, key: string): Drop | undefined {
    return this.waves.get(waveId)?.records.get(key);
  }

  hasWave(waveId: string): boolean {
    return this.waves.has(waveId);
  }

  size(waveId: string): number {
    return this.waves.get(waveId)?.records.size ?? 0;
  }

  /** Increases whenever the wave's records change. */
  version(waveId: string): number {
    return this.waves.get(waveId)?.version ?? 0;
  }

  isTombstoned(waveId: string, key: string): boolean {
    return this.tombstones.get(waveId)?.has(key) ?? false;
  }

  /** Waves holding deletion tombstones, least recently touched first. */
  tombstonedWaveIds(): string[] {
    return [...this.tombstones.keys()];
  }

  getPendingSend(clientId: string): PendingSend | undefined {
    return this.pendingSends.get(clientId);
  }

  // Writes ------------------------------------------------------------------

  merge(
    waveId: string,
    drops: readonly Drop[],
    policy: MergePolicy = "standard"
  ): MergeResult {
    const tombstones = this.tombstones.get(waveId);
    // Within one batch the later copy of a key wins.
    const batch = new Map<string, Drop>();
    for (const drop of drops) {
      const key = this.keyOf(drop);
      if (tombstones?.has(key) !== true) {
        batch.set(key, drop);
      }
    }
    if (batch.size === 0) {
      return UNCHANGED;
    }

    let wave = this.waves.get(waveId);
    if (wave === undefined) {
      wave = createWave();
      this.waves.set(waveId, wave);
    }
    const context: MergeContext = {
      waveId,
      wave,
      preserveExisting: policy === "preserve-existing",
      changed: false,
      stale: 0,
      reconciled: 0,
    };
    const batched = batch.size > BATCH_THRESHOLD;
    if (batched) {
      wave.order.beginBatch();
      wave.placeholders.beginBatch();
    }
    for (const [key, drop] of batch) {
      if (drop.type === DropSize.LIGHT) {
        this.mergePlaceholder(context, key, drop);
      } else {
        this.mergeFull(context, key, drop);
      }
    }
    if (batched) {
      wave.order.commitBatch();
      wave.placeholders.commitBatch();
    }
    if (context.changed) {
      this.touch(wave);
    }
    return {
      changed: context.changed,
      stale: context.stale,
      reconciled: context.reconciled,
    };
  }

  /**
   * Removes records and tombstones their keys, so late copies are ignored.
   * Tombstones are kept even when the wave holds no records yet.
   */
  remove(waveId: string, keys: readonly string[]): boolean {
    if (keys.length === 0) {
      return false;
    }
    const tombstones = this.tombstones.get(waveId) ?? new Set<string>();
    for (const key of keys) {
      tombstones.add(key);
    }
    // Re-insert so the wave becomes the most recently touched.
    this.tombstones.delete(waveId);
    this.tombstones.set(waveId, tombstones);
    for (const key of keys) {
      this.releasePendingSend(key);
    }

    const wave = this.waves.get(waveId);
    if (wave === undefined) {
      return false;
    }
    const batched = keys.length > BATCH_THRESHOLD;
    if (batched) {
      wave.order.beginBatch();
      wave.placeholders.beginBatch();
    }
    let changed = false;
    for (const key of keys) {
      changed = this.removeRecord(wave, key) || changed;
    }
    if (batched) {
      wave.order.commitBatch();
      wave.placeholders.commitBatch();
    }
    if (changed) {
      this.touch(wave);
    }
    return changed;
  }

  /** Drops the wave's records and pending sends; tombstones stay. */
  deleteWave(waveId: string): boolean {
    for (const [clientId, send] of this.pendingSends) {
      if (send.waveId === waveId) {
        this.releasePendingSend(clientId);
      }
    }
    return this.waves.delete(waveId);
  }

  forgetTombstones(waveId: string): void {
    this.tombstones.delete(waveId);
  }

  /** Forgets everything, for a profile switch. */
  clear(): void {
    this.waves.clear();
    this.tombstones.clear();
    this.pendingSends.clear();
    this.pendingByClientDropId.clear();
    this.settled.clear();
  }

  // Pending sends -------------------------------------------------------------

  /**
   * Shows `drop` as a pending send keyed by its client ID, in `sending`.
   * Merging a drop whose ID starts with `temp-` does the same. Pass the
   * `client_drop_id` sent to the server (or set it on `drop`) so its
   * server copy settles the send exactly.
   */
  addPendingSend(
    waveId: string,
    drop: ExtendedDrop,
    options: { readonly clientDropId?: string | undefined } = {}
  ): PendingSend | null {
    const clientId = this.keyOf(drop);
    if (this.isTombstoned(waveId, clientId)) {
      return null;
    }
    this.registerPendingSend(
      waveId,
      clientId,
      options.clientDropId?.toLowerCase() ?? clientDropIdOf(drop)
    );
    this.merge(waveId, [drop]);
    return this.pendingSends.get(clientId) ?? null;
  }

  /** Applies a lifecycle event to a pending send. */
  dispatchPendingSend(
    clientId: string,
    event: ActionEvent
  ): PendingSend | undefined {
    const send = this.pendingSends.get(clientId);
    if (send === undefined) {
      return undefined;
    }
    const state = this.transition(send.state, event);
    if (state === send.state) {
      return send;
    }
    const next = { ...send, state };
    this.pendingSends.set(clientId, next);
    const wave = this.waves.get(send.waveId);
    if (wave?.pending.has(clientId) === true) {
      // The row renders from this state.
      this.touch(wave);
    }
    return next;
  }

  /**
   * The server accepted the pending send as `serverDrop`: one atomic swap.
   * The accepted row keeps the pending row's identity, so it does not
   * remount. Works whether or not the message echo got there first.
   */
  settlePendingSend(clientId: string, serverDrop: ExtendedDrop): boolean {
    const send = this.pendingSends.get(clientId);
    if (send === undefined) {
      return false;
    }
    const waveId = send.waveId;
    const wave = this.waves.get(waveId);
    const pendingRecord = wave?.records.get(clientId);
    const serverKey = this.keyOf(serverDrop);
    if (
      wave !== undefined &&
      pendingRecord?.type === DropSize.FULL &&
      !wave.records.has(serverKey) &&
      !this.isTombstoned(waveId, serverKey) &&
      this.claimSerial(wave, serverKey, serverDrop, false)
    ) {
      this.insertFull(
        wave,
        serverKey,
        withIdentity(serverDrop, pendingRecord),
        false
      );
      this.touch(wave);
    } else {
      // The echo may already have replaced the pending row.
      this.merge(waveId, [serverDrop]);
    }
    this.settlePending(waveId, clientId, serverKey);
    return true;
  }

  // Internals -----------------------------------------------------------------

  private touch(wave: WaveRecords): void {
    wave.version = ++this.clock;
    wave.snapshot = null;
  }

  private transition(state: ActionState, event: ActionEvent): ActionState {
    return transition(state, event, { reporter: this.lifecycleReporter });
  }

  private isPendingKey(key: string): boolean {
    const send = this.pendingSends.get(key);
    return send === undefined
      ? key.startsWith(OPTIMISTIC_KEY_PREFIX)
      : send.serverKey === null;
  }

  private registerPendingSend(
    waveId: string,
    clientId: string,
    clientDropId: string | null
  ): void {
    if (this.pendingSends.has(clientId)) {
      return;
    }
    const state = this.transition(createActionState("server"), {
      type: "SUBMIT",
      requiresSignature: false,
    });
    this.pendingSends.set(clientId, {
      clientId,
      waveId,
      state,
      clientDropId,
      serverKey: null,
    });
    if (clientDropId !== null) {
      this.pendingByClientDropId.set(clientDropId, clientId);
    }
  }

  private releasePendingSend(clientId: string): void {
    const clientDropId = this.pendingSends.get(clientId)?.clientDropId;
    if (
      clientDropId !== undefined &&
      clientDropId !== null &&
      this.pendingByClientDropId.get(clientDropId) === clientId
    ) {
      this.pendingByClientDropId.delete(clientDropId);
    }
    this.pendingSends.delete(clientId);
    this.settled.delete(clientId);
  }

  /** The still-shown pending send in this wave that created `drop`. */
  private pendingSendFor(waveId: string, drop: Drop): string | null {
    const clientDropId = clientDropIdOf(drop);
    const clientId =
      clientDropId === null
        ? undefined
        : this.pendingByClientDropId.get(clientDropId);
    const send =
      clientId === undefined ? undefined : this.pendingSends.get(clientId);
    return send?.waveId === waveId && send.serverKey === null
      ? send.clientId
      : null;
  }

  /** Records acceptance, removes the pending row and tombstones its client ID. */
  private settlePending(
    waveId: string,
    clientId: string,
    serverKey: string
  ): void {
    const send = this.pendingSends.get(clientId);
    if (send === undefined) {
      return;
    }
    const state = this.transition(send.state, { type: "SEND_OK" });
    this.pendingSends.set(clientId, { ...send, state, serverKey });
    this.settled.add(clientId);
    if (this.settled.size > MAX_SETTLED_PENDING_SENDS) {
      const oldest = this.settled.values().next().value;
      if (oldest !== undefined) {
        this.releasePendingSend(oldest);
      }
    }
    // The client ID never comes back as its own row.
    const tombstones = this.tombstones.get(waveId) ?? new Set<string>();
    tombstones.add(clientId);
    this.tombstones.set(waveId, tombstones);
    const wave = this.waves.get(waveId);
    if (wave !== undefined && this.removeRecord(wave, clientId)) {
      this.touch(wave);
    }
  }

  private mergePlaceholder(
    context: MergeContext,
    key: string,
    drop: Drop
  ): void {
    const { wave } = context;
    const existing = wave.records.get(key);
    if (existing !== undefined) {
      // A placeholder never replaces a full record.
      if (existing.type === DropSize.FULL || context.preserveExisting) {
        return;
      }
      this.removeRecord(wave, key);
      context.changed = true;
    }
    if (!this.claimSerial(wave, key, drop, context.preserveExisting)) {
      return;
    }
    const record: Drop =
      drop.stableKey === drop.id && drop.stableHash === drop.id
        ? drop
        : { ...drop, stableKey: drop.id, stableHash: drop.id };
    const entry: PlaceholderEntry = { s: drop.serial_no, k: key };
    wave.records.set(key, record);
    wave.placeholderEntries.set(key, entry);
    wave.placeholders.add(entry);
    wave.serials.set(drop.serial_no, key);
    context.changed = true;
  }

  private mergeFull(
    context: MergeContext,
    key: string,
    drop: ExtendedDrop
  ): void {
    const { wave } = context;
    const existing = wave.records.get(key);
    if (context.preserveExisting && existing !== undefined) {
      return;
    }
    if (existing?.type === DropSize.FULL) {
      this.updateFull(context, key, existing, drop);
      return;
    }
    if (existing !== undefined) {
      // A placeholder is hydrated: the full record takes its place.
      this.removeRecord(wave, key);
    }
    this.insertNewFull(context, key, drop);
  }

  /** A copy of a stored full record: stale, unchanged, or an update. */
  private updateFull(
    context: MergeContext,
    key: string,
    existing: ExtendedDrop,
    drop: ExtendedDrop
  ): void {
    const { wave, waveId } = context;
    if (isOlderRevision(drop, existing)) {
      context.stale++;
      return;
    }
    // A copy with nothing new keeps the stored object, so rows showing it
    // stay memoized.
    if (!isSameRecord(existing, drop)) {
      this.replaceFull(wave, key, existing, drop);
      context.changed = true;
    }
    // A creation frame can follow a feed copy of the same drop.
    const creator =
      wave.pending.size === 0 ? null : this.pendingSendFor(waveId, drop);
    if (creator !== null) {
      this.settlePending(waveId, creator, key);
      context.reconciled++;
    }
  }

  /** A full record for a key the wave does not hold yet. */
  private insertNewFull(
    context: MergeContext,
    key: string,
    drop: ExtendedDrop
  ): void {
    const { wave, waveId } = context;
    if (this.isPendingKey(key)) {
      this.registerPendingSend(waveId, key, clientDropIdOf(drop));
      wave.pending.add(key);
      this.insertFull(
        wave,
        key,
        withIdentity(drop, stableIdentity(drop, key)),
        true
      );
      context.changed = true;
      return;
    }

    if (!this.claimSerial(wave, key, drop, context.preserveExisting)) {
      return;
    }
    const match =
      wave.pending.size === 0 ? null : this.matchPending(waveId, wave, drop);
    if (match === null) {
      this.insertFull(
        wave,
        key,
        withIdentity(drop, stableIdentity(drop, key)),
        false
      );
    } else {
      // The accepted copy of a pending send keeps its row identity.
      this.insertFull(wave, key, withIdentity(drop, match), false);
      this.settlePending(waveId, this.keyOf(match), key);
      context.reconciled++;
    }
    context.changed = true;
  }

  /**
   * The pending send `drop` is the server copy of. Its `client_drop_id`
   * decides when present; otherwise today's content match does.
   */
  private matchPending(
    waveId: string,
    wave: WaveRecords,
    drop: ExtendedDrop
  ): ExtendedDrop | null {
    if (clientDropIdOf(drop) !== null) {
      const creator = this.pendingSendFor(waveId, drop);
      const record = creator === null ? undefined : wave.records.get(creator);
      return record?.type === DropSize.FULL ? record : null;
    }
    const pending: ExtendedDrop[] = [];
    for (const clientId of wave.pending) {
      const record = wave.records.get(clientId);
      if (record?.type === DropSize.FULL) {
        pending.push(record);
      }
    }
    return findPendingMatch(drop, pending);
  }

  /**
   * Gives `drop`'s serial to `key`. A serial belongs to one accepted record:
   * a later full record replaces another holder (today's merge did the
   * same), but a placeholder never replaces a full record.
   */
  private claimSerial(
    wave: WaveRecords,
    key: string,
    drop: Drop,
    preserveExisting: boolean
  ): boolean {
    const holder = wave.serials.get(drop.serial_no);
    if (holder === undefined || holder === key) {
      return true;
    }
    const held = wave.records.get(holder);
    if (
      preserveExisting ||
      (drop.type === DropSize.LIGHT && held?.type === DropSize.FULL)
    ) {
      return false;
    }
    this.removeRecord(wave, holder);
    return true;
  }

  private insertFull(
    wave: WaveRecords,
    key: string,
    record: ExtendedDrop,
    pending: boolean
  ): void {
    const entry = orderEntryFor(record, key, pending);
    wave.records.set(key, record);
    wave.entries.set(key, entry);
    wave.order.add(entry);
    if (!pending) {
      wave.serials.set(record.serial_no, key);
    }
  }

  private replaceFull(
    wave: WaveRecords,
    key: string,
    existing: ExtendedDrop,
    drop: ExtendedDrop
  ): void {
    // Hash again only when hashed content changed (an edit); otherwise keep
    // the row identity, including one inherited from a pending send.
    const record = stableInputsChanged(existing, drop)
      ? withIdentity(drop, stableIdentity(drop, key))
      : withIdentity(drop, existing);
    wave.records.set(key, record);
    const entry = wave.entries.get(key);
    const pending = wave.pending.has(key);
    const next = orderEntryFor(record, key, pending);
    if (entry?.t !== next.t || entry.s !== next.s) {
      if (entry !== undefined) {
        wave.order.remove(entry);
      }
      wave.entries.set(key, next);
      wave.order.add(next);
    }
    if (!pending && existing.serial_no !== record.serial_no) {
      if (wave.serials.get(existing.serial_no) === key) {
        wave.serials.delete(existing.serial_no);
      }
      wave.serials.set(record.serial_no, key);
    }
  }

  private removeRecord(wave: WaveRecords, key: string): boolean {
    const record = wave.records.get(key);
    if (record === undefined) {
      return false;
    }
    wave.records.delete(key);
    wave.pending.delete(key);
    if (wave.serials.get(record.serial_no) === key) {
      wave.serials.delete(record.serial_no);
    }
    const entry = wave.entries.get(key);
    if (entry !== undefined) {
      wave.entries.delete(key);
      wave.order.remove(entry);
    }
    const placeholder = wave.placeholderEntries.get(key);
    if (placeholder !== undefined) {
      wave.placeholderEntries.delete(key);
      wave.placeholders.remove(placeholder);
    }
    return true;
  }

  /** Newest first; placeholders take their serial position among accepted records. */
  private materialize(wave: WaveRecords): Drop[] {
    const order = wave.order.values();
    const placeholders = wave.placeholders.values();
    const drops: Drop[] = [];
    let next = placeholders.length - 1;
    for (let index = order.length - 1; index >= 0; index--) {
      const entry = order[index] as OrderEntry;
      if (!entry.p) {
        while (
          next >= 0 &&
          (placeholders[next] as PlaceholderEntry).s > entry.s
        ) {
          drops.push(recordOf(wave, placeholders[next--] as PlaceholderEntry));
        }
      }
      drops.push(recordOf(wave, entry));
    }
    while (next >= 0) {
      drops.push(recordOf(wave, placeholders[next--] as PlaceholderEntry));
    }
    return drops;
  }
}

const recordOf = (wave: WaveRecords, entry: { readonly k: string }): Drop =>
  wave.records.get(entry.k) as Drop;
