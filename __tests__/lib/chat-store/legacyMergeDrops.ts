/**
 * Test oracle: the wave-message merge used before the normalized chat store
 * (lib/chat-store), kept verbatim so the store can be checked against it.
 */
import type { Drop } from "@/helpers/waves/drop.helpers";
import { DropSize, getStableDropKey } from "@/helpers/waves/drop.helpers";

/**
 * Merges two arrays of drops, removing duplicates based on id,
 * preferring newer versions of duplicates, and sorting by serial_no
 *
 * @param currentDrops Current array of drops
 * @param newDrops New array of drops to merge in
 * @returns A new merged array with no duplicates, sorted by serial_no
 */
export function legacyMergeDrops(
  currentDrops: Drop[],
  newDrops: Drop[]
): Drop[] {
  // Create a map for fast lookup by id
  const dropsMapStableKey = new Map<string, Drop>();

  const newDropsWithStableKey = newDrops.map((drop) => {
    const { key, hash } = getStableDropKey(drop, currentDrops);

    return {
      ...drop,
      stableHash: hash,
      stableKey: key,
    };
  });

  for (const drop of currentDrops) {
    dropsMapStableKey.set(drop.stableKey, drop);
  }

  // Then add all new drops, overwriting any duplicates
  // This ensures we keep the newest version of each drop
  for (const drop of newDropsWithStableKey) {
    dropsMapStableKey.set(drop.stableKey, drop);
  }

  // Convert the map back to an array
  const mergedDrops = Array.from(dropsMapStableKey.values());

  const dropsMapSerialNo = new Map<number, Drop>();

  for (const drop of mergedDrops) {
    dropsMapSerialNo.set(drop.serial_no, drop);
  }

  const finalDrops = Array.from(dropsMapSerialNo.values());

  finalDrops.sort((a, b) => {
    if (a.type === DropSize.LIGHT || b.type === DropSize.LIGHT) {
      return b.serial_no - a.serial_no;
    }

    const createdAtDiff = getDropCreatedAtMillis(b) - getDropCreatedAtMillis(a);
    return createdAtDiff || b.serial_no - a.serial_no;
  });

  return finalDrops;
}

function getDropCreatedAtMillis(drop: Drop): number {
  if (drop.created_at === undefined || drop.created_at === null) {
    return drop.serial_no;
  }

  const timestamp =
    typeof drop.created_at === "number"
      ? drop.created_at
      : new Date(drop.created_at).getTime();

  return Number.isFinite(timestamp) ? timestamp : drop.serial_no;
}
