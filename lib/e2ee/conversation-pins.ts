/** The last decision for a thread, including an unpin. */
export type ConversationPin = readonly [
  thread: string,
  revision: number,
  id: string,
  pinned: boolean,
];

type PinVersions = Readonly<Record<string, ConversationPin>>;

/** An ordered position is scoped to the decision that pinned the thread. */
export type ConversationPinRank = readonly [
  pin: ConversationPin,
  revision: number,
  id: string,
  position: number,
];

export type PinRankVersions = Readonly<Record<string, ConversationPinRank>>;

export interface PinChanges {
  readonly pins: readonly ConversationPin[];
  readonly ranks: readonly ConversationPinRank[];
}

const THREAD_PATTERN = /^(?:dm:[\w-]{1,100}|group:0x[0-9a-f]{64})$/u;
const ID_PATTERN = /^[0-9a-f]{32}$/u;

const isRevision = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const isId = (value: unknown): value is string =>
  typeof value === "string" && ID_PATTERN.test(value);

export function isConversationPin(value: unknown): value is ConversationPin {
  if (!Array.isArray(value) || value.length !== 4) return false;
  const [thread, revision, id, pinned] = value as unknown[];
  return (
    typeof thread === "string" &&
    THREAD_PATTERN.test(thread) &&
    isRevision(revision) &&
    isId(id) &&
    typeof pinned === "boolean"
  );
}

export function isConversationPinRank(
  value: unknown
): value is ConversationPinRank {
  if (!Array.isArray(value) || value.length !== 4) return false;
  const [pin, revision, id, position] = value as unknown[];
  return (
    isConversationPin(pin) &&
    pin[3] &&
    isRevision(revision) &&
    isId(id) &&
    typeof position === "number" &&
    Number.isSafeInteger(position) &&
    position >= 0
  );
}

function compareVersions(
  a: readonly [unknown, number, string, unknown],
  b: readonly [unknown, number, string, unknown]
): number {
  return a[1] - b[1] || Number(a[2] > b[2]) - Number(a[2] < b[2]);
}

function mergeThreadVersions<T>(
  current: Readonly<Record<string, T>>,
  updates: readonly T[],
  threadOf: (update: T) => string,
  compare: (update: T, previous: T) => number
): Readonly<Record<string, T>> {
  let next: Record<string, T> | null = null;
  for (const update of updates) {
    const thread = threadOf(update);
    const previous = (next ?? current)[thread];
    if (previous === undefined || compare(update, previous) > 0) {
      next ??= { ...current };
      next[thread] = update;
    }
  }
  return next ?? current;
}

/**
 * A local change advances the thread's revision. The random id settles
 * concurrent changes at the same revision without relying on device clocks.
 */
export function mergeConversationPins(
  current: PinVersions,
  updates: readonly ConversationPin[]
): PinVersions {
  return mergeThreadVersions(
    current,
    updates,
    ([thread]) => thread,
    compareVersions
  );
}

export function mergeConversationPinRanks(
  current: PinRankVersions,
  updates: readonly ConversationPinRank[]
): PinRankVersions {
  // A rank from a previous pin decision cannot displace one for a re-pin.
  return mergeThreadVersions(
    current,
    updates,
    ([[thread]]) => thread,
    (a, b) => compareVersions(a[0], b[0]) || compareVersions(a, b)
  );
}

export function pinPosition(
  ranks: PinRankVersions,
  pin: ConversationPin | undefined
): number | undefined {
  if (!pin?.[3]) return undefined;
  const rank = ranks[pin[0]];
  return rank && compareVersions(rank[0], pin) === 0 ? rank[3] : undefined;
}

/** Ranked pins precede legacy pins. Equal positions converge by thread key. */
export function comparePinPositions(
  a: number | undefined,
  b: number | undefined,
  aThread: string,
  bThread: string
): number {
  if (a === undefined) return b === undefined ? 0 : 1;
  if (b === undefined) return -1;
  return a - b || Number(aThread > bThread) - Number(aThread < bThread);
}
