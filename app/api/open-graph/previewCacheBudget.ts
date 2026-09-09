import { deserialize, serialize } from "node:v8";

export const PREVIEW_CACHE_MAX_ENTRY_BYTES = 128 * 1024;

const ENTRY_BYTES = 64;
const CONTAINER_BYTES = 64;
const PROPERTY_BYTES = 64;
const STRING_BYTES = 64;
const SLOT_BYTES = 16;
const MAX_DEPTH = 64;

function primitiveBytes(value: unknown): number | null {
  if (typeof value === "string") return STRING_BYTES + value.length * 2;
  if (value === null) return SLOT_BYTES;
  if (typeof value === "object") return null;
  if (
    value === undefined ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return SLOT_BYTES;
  }
  return Number.POSITIVE_INFINITY;
}

/** Copy only budgeted entries so slices cannot retain a much larger source string. */
export function copyPreviewCacheEntry<T>(
  key: string,
  data: T,
  maxBytes = PREVIEW_CACHE_MAX_ENTRY_BYTES
): { readonly key: string; readonly data: T } | null {
  if (!isPreviewCacheEntryWithinBudget(key, data, maxBytes)) return null;
  try {
    // V8 serialization preserves optional undefined values and severs string
    // backing stores for the key and payload. Oversized previews never reach it.
    return deserialize(serialize({ key, data })) as { key: string; data: T };
  } catch {
    return null;
  }
}

function hasPlainPrototype(value: object, array: boolean): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  if (array) return prototype === Array.prototype;
  return prototype === Object.prototype || prototype === null;
}

/**
 * Estimates retained plain preview data without serializing or copying strings.
 * Padded container/property charges and UTF-16 string sizes form a conservative
 * payload budget, not an exact measurement of the JavaScript engine's heap.
 */
export function isPreviewCacheEntryWithinBudget(
  key: string,
  preview: unknown,
  maxBytes = PREVIEW_CACHE_MAX_ENTRY_BYTES
): boolean {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) return false;

  let remaining = maxBytes;
  const ancestors = new Set<object>();
  const consume = (bytes: number): boolean => {
    if (bytes > remaining) return false;
    remaining -= bytes;
    return true;
  };

  const visit = (value: unknown, depth: number): boolean => {
    const bytes = primitiveBytes(value);
    if (bytes !== null) return consume(bytes);
    return visitObject(value as object, depth);
  };

  const visitProperty = (
    value: object,
    property: string,
    depth: number
  ): boolean => {
    const descriptor = Object.getOwnPropertyDescriptor(value, property);
    return (
      descriptor !== undefined &&
      "value" in descriptor &&
      consume(PROPERTY_BYTES + STRING_BYTES + property.length * 2) &&
      visit(descriptor.value, depth + 1)
    );
  };

  const visitObject = (value: object, depth: number): boolean => {
    const array = Array.isArray(value);
    if (
      !hasPlainPrototype(value, array) ||
      ancestors.has(value) ||
      depth >= MAX_DEPTH
    ) {
      return false;
    }
    // Charge all array slots before enumeration, including holes in sparse arrays.
    const slots = array ? value.length * SLOT_BYTES : 0;
    if (!consume(CONTAINER_BYTES + slots)) return false;

    ancestors.add(value);
    let properties = 0;
    try {
      for (const property in value) {
        if (!Object.hasOwn(value, property)) continue;
        properties += 1;
        if (!visitProperty(value, property, depth)) return false;
      }
      // JSON-like previews have no hidden or symbol properties. Refuse them
      // rather than retaining values that the enumerable traversal did not count.
      return Reflect.ownKeys(value).length === properties + (array ? 1 : 0);
    } finally {
      ancestors.delete(value);
    }
  };

  try {
    return consume(ENTRY_BYTES) && visit(key, 0) && visit(preview, 0);
  } catch {
    return false;
  }
}
