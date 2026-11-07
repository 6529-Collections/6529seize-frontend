/**
 * Row identity. `stableKey` (the React key) and `stableHash` (the DOM
 * `data-wave-drop-id`, and what reply threads match pending replies by)
 * keep today's content-hash form from `getStableDropKey`, but a record is
 * hashed only when it first arrives or its content changes, never on every
 * merge.
 */
import {
  getStableDropKey,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";

/** today's `findClosestMatch` window between a send and its server copy. */
const MATCH_WINDOW_MS = 10_000;

/**
 * The content-hash identity for a new record. A malformed copy (for example
 * one without an author) keeps the identity it came with rather than
 * breaking the merge.
 */
export function stableIdentity(
  drop: ExtendedDrop,
  key: string
): {
  readonly stableKey: string;
  readonly stableHash: string;
} {
  try {
    const { key, hash } = getStableDropKey(drop);
    return { stableKey: key, stableHash: hash };
  } catch {
    return {
      stableKey: drop.stableKey || drop.id || key,
      stableHash: drop.stableHash || drop.id || key,
    };
  }
}

const authorKey = (drop: ExtendedDrop): string | null | undefined =>
  drop.author.is_anonymous ? drop.author.id : drop.author.handle;

const contentOf = (drop: ExtendedDrop): string =>
  drop.parts.map((part) => part.content).join("");

/** True when a field `getStableDropKey` hashes differs, other than the time. */
export function stableInputsChanged(
  current: ExtendedDrop,
  incoming: ExtendedDrop
): boolean {
  try {
    return compareStableInputs(current, incoming);
  } catch {
    // A malformed copy: hash again (`stableIdentity` falls back safely).
    return true;
  }
}

function compareStableInputs(
  current: ExtendedDrop,
  incoming: ExtendedDrop
): boolean {
  if (
    current.wave.id !== incoming.wave.id ||
    current.title !== incoming.title ||
    authorKey(current) !== authorKey(incoming) ||
    current.reply_to?.drop_id !== incoming.reply_to?.drop_id ||
    current.reply_to?.drop_part_id !== incoming.reply_to?.drop_part_id ||
    current.parts.length !== incoming.parts.length ||
    current.metadata.length !== incoming.metadata.length
  ) {
    return true;
  }
  for (let index = 0; index < current.parts.length; index++) {
    if (current.parts[index]?.content !== incoming.parts[index]?.content) {
      return true;
    }
  }
  for (let index = 0; index < current.metadata.length; index++) {
    const a = current.metadata[index];
    const b = incoming.metadata[index];
    if (a?.data_key !== b?.data_key || a?.data_value !== b?.data_value) {
      return true;
    }
  }
  return false;
}

const timeOf = (drop: ExtendedDrop): number =>
  new Date(drop.created_at).getTime();

/**
 * Could `serverDrop` be the accepted copy of `pending`? Today's
 * `findClosestMatch` rule: same author (same ID when either is anonymous),
 * same text, created within 10 s.
 */
function isCandidate(serverDrop: ExtendedDrop, pending: ExtendedDrop): boolean {
  if (
    (pending.author.is_anonymous || serverDrop.author.is_anonymous) &&
    pending.author.id !== serverDrop.author.id
  ) {
    return false;
  }
  return (
    pending.author.handle === serverDrop.author.handle &&
    Math.abs(timeOf(pending) - timeOf(serverDrop)) < MATCH_WINDOW_MS &&
    contentOf(pending) === contentOf(serverDrop)
  );
}

/**
 * The pending send `serverDrop` is the accepted copy of, if any. The match
 * is exact when today's merge would give both the same stable hash: the
 * server copy hashed with the pending send's time equals the pending hash.
 * Among several, the one closest in time wins, as in `findClosestMatch`.
 */
export function findPendingMatch(
  serverDrop: ExtendedDrop,
  pending: readonly ExtendedDrop[]
): ExtendedDrop | null {
  const candidates = pending
    .filter((drop) => {
      try {
        return isCandidate(serverDrop, drop);
      } catch {
        // A malformed copy matches nothing.
        return false;
      }
    })
    .sort(
      (a, b) =>
        Math.abs(timeOf(a) - timeOf(serverDrop)) -
        Math.abs(timeOf(b) - timeOf(serverDrop))
    );
  for (const candidate of candidates) {
    if (hashesWith(serverDrop, candidate)) {
      return candidate;
    }
  }
  return null;
}

/** Today's rule: the server copy, hashed with the send's time, is the send. */
function hashesWith(serverDrop: ExtendedDrop, pending: ExtendedDrop): boolean {
  try {
    return getStableDropKey(serverDrop, [pending]).hash === pending.stableHash;
  } catch {
    return false;
  }
}
