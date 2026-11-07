/**
 * Whether an incoming copy carries nothing new. Feeds, newest-drops syncs
 * and socket frames often re-deliver drops the wave already holds; keeping
 * the stored object then keeps every memoized row that shows it from
 * re-rendering. Row identity fields are the store's own and are ignored;
 * the store adds them at the top level only, so nested objects (reply and
 * quote targets) compare in full. A missing key and an `undefined` one are
 * treated alike.
 */
const IDENTITY_FIELDS: ReadonlySet<string> = new Set([
  "stableKey",
  "stableHash",
]);

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let index = 0; index < a.length; index++) {
      if (!sameValue(a[index], b[index])) {
        return false;
      }
    }
    return true;
  }
  if (Array.isArray(b)) {
    return false;
  }
  return sameFields(
    a as Readonly<Record<string, unknown>>,
    b as Readonly<Record<string, unknown>>,
    null
  );
}

/** Keys holding a value: a missing key and an `undefined` one are alike. */
function definedKeys(
  record: Readonly<Record<string, unknown>>,
  ignored: ReadonlySet<string> | null
): string[] {
  return Object.keys(record).filter(
    (key) => record[key] !== undefined && ignored?.has(key) !== true
  );
}

/** The same set of defined keys, each with the same value. */
function sameFields(
  a: Readonly<Record<string, unknown>>,
  b: Readonly<Record<string, unknown>>,
  ignored: ReadonlySet<string> | null
): boolean {
  const keysA = definedKeys(a, ignored);
  const keysB = new Set(definedKeys(b, ignored));
  if (keysA.length !== keysB.size) {
    return false;
  }
  return keysA.every((key) => keysB.has(key) && sameValue(a[key], b[key]));
}

/** Deep equality of two copies of a record, ignoring row identity. */
export function isSameRecord(stored: object, incoming: object): boolean {
  return (
    stored === incoming ||
    sameFields(
      stored as Readonly<Record<string, unknown>>,
      incoming as Readonly<Record<string, unknown>>,
      IDENTITY_FIELDS
    )
  );
}
