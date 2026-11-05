import type { Drop } from "@/helpers/waves/drop.helpers";

type DropChange = {
  key: string;
  originalValue: unknown;
  optimisticValue: unknown;
  originalHasKey: boolean;
  optimisticHasKey: boolean;
};

const serializeValue = (value: unknown): string => {
  if (value === undefined) {
    return "__undefined__";
  }
  return JSON.stringify(value);
};

export const valuesEqual = (left: unknown, right: unknown): boolean => {
  return serializeValue(left) === serializeValue(right);
};

export const cloneValue = <T>(value: T): T => {
  if (value === undefined) {
    return value;
  }

  return structuredClone(value);
};

type DropRecord = Drop & Record<string, unknown>;

export const toDropRecord = (drop: Drop): DropRecord => drop as DropRecord;

export const collectDropChanges = (
  original: Drop,
  updated: Drop
): DropChange[] => {
  const keys = Array.from(
    new Set([...Object.keys(original), ...Object.keys(updated)])
  );
  const changes: DropChange[] = [];
  const originalRecord = toDropRecord(original);
  const updatedRecord = toDropRecord(updated);

  for (const key of keys) {
    const originalHasKey = Object.hasOwn(original, key);
    const optimisticHasKey = Object.hasOwn(updated, key);
    const originalValue = originalHasKey ? originalRecord[key] : undefined;
    const optimisticValue = optimisticHasKey ? updatedRecord[key] : undefined;

    if (!valuesEqual(originalValue, optimisticValue)) {
      changes.push({
        key,
        originalValue: cloneValue(originalValue),
        optimisticValue: cloneValue(optimisticValue),
        originalHasKey,
        optimisticHasKey,
      });
    }
  }

  return changes;
};

export const cloneDrop = (drop: Drop): Drop => cloneValue(drop);
