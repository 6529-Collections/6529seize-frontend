interface DropOrderItem {
  readonly id: string;
}

export interface DropOrderUpdate {
  readonly dropId: string;
  readonly priorityOrder: number;
}

export const getDropOrderIds = (drops: readonly DropOrderItem[]): string[] =>
  drops.map((drop) => drop.id);

export const areDropOrdersEqual = (
  left: readonly string[],
  right: readonly string[]
): boolean =>
  left.length === right.length &&
  left.every((id, index) => id === right[index]);

export const applyDropOrderIds = <T extends DropOrderItem>(
  drops: readonly T[],
  orderIds: readonly string[]
): T[] => {
  const dropsById = new Map(drops.map((drop) => [drop.id, drop]));
  return orderIds
    .map((id) => dropsById.get(id) ?? null)
    .filter((drop): drop is T => drop !== null);
};

export const getDropOrderUpdates = (
  drops: readonly DropOrderItem[]
): DropOrderUpdate[] =>
  drops.map((drop, index) => ({
    dropId: drop.id,
    priorityOrder: index + 1,
  }));

const hasSameDropIds = (
  left: readonly string[],
  right: readonly string[]
): boolean => {
  if (left.length === 0 || left.length !== right.length) {
    return false;
  }

  const rightIds = new Set(right);
  return left.every((id) => rightIds.has(id));
};

export const getRollbackOrderIds = ({
  currentDrops,
  persistedOrderIds,
}: {
  readonly currentDrops: readonly DropOrderItem[];
  readonly persistedOrderIds: readonly string[];
}): string[] => {
  const currentOrderIds = getDropOrderIds(currentDrops);

  return hasSameDropIds(currentOrderIds, persistedOrderIds)
    ? [...persistedOrderIds]
    : currentOrderIds;
};
