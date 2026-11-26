/** The last decision for a thread, including an unpin. */
export type ConversationPin = readonly [
  thread: string,
  revision: number,
  id: string,
  pinned: boolean,
];

type PinVersions = Readonly<Record<string, ConversationPin>>;

const THREAD_PATTERN = /^(?:dm:[\w-]{1,100}|group:0x[0-9a-f]{64})$/u;
const ID_PATTERN = /^[0-9a-f]{32}$/u;

export function isConversationPin(value: unknown): value is ConversationPin {
  if (!Array.isArray(value) || value.length !== 4) return false;
  const [thread, revision, id, pinned] = value as unknown[];
  return (
    typeof thread === "string" &&
    THREAD_PATTERN.test(thread) &&
    typeof revision === "number" &&
    Number.isSafeInteger(revision) &&
    revision > 0 &&
    typeof id === "string" &&
    ID_PATTERN.test(id) &&
    typeof pinned === "boolean"
  );
}

/**
 * A local change advances the thread's revision. The random id settles
 * concurrent changes at the same revision without relying on device clocks.
 */
export function mergeConversationPins(
  current: PinVersions,
  updates: readonly ConversationPin[]
): PinVersions {
  let next: Record<string, ConversationPin> | null = null;
  for (const update of updates) {
    const [thread, revision, id] = update;
    const previous = (next ?? current)[thread];
    if (
      !previous ||
      revision > previous[1] ||
      (revision === previous[1] && id > previous[2])
    ) {
      next ??= { ...current };
      next[thread] = update;
    }
  }
  return next ?? current;
}
