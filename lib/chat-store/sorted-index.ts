/**
 * An array kept sorted by a total order, ascending. Appends at the newest
 * end are O(1); other inserts and removals are a binary search plus a splice.
 * Between `beginBatch` and `commitBatch`, changes are collected and applied
 * in one O(n + m log m) merge, so a page of history or a mass deletion costs
 * one pass instead of one splice each.
 */
export class SortedIndex<T> {
  private items: T[] = [];
  private batchAdds: T[] | null = null;
  private batchRemovals: Set<T> | null = null;

  constructor(private readonly compare: (a: T, b: T) => number) {}

  /** Ascending. Do not mutate; valid until the next change. */
  values(): readonly T[] {
    return this.items;
  }

  get size(): number {
    return this.items.length;
  }

  beginBatch(): void {
    this.batchAdds ??= [];
    this.batchRemovals ??= new Set();
  }

  commitBatch(): void {
    const adds = this.batchAdds;
    const removals = this.batchRemovals;
    this.batchAdds = null;
    this.batchRemovals = null;
    if (adds === null || removals === null) {
      return;
    }
    const kept =
      removals.size === 0
        ? this.items
        : this.items.filter((item) => !removals.has(item));
    const added =
      removals.size === 0 ? adds : adds.filter((item) => !removals.has(item));
    if (added.length === 0) {
      this.items = kept;
      return;
    }
    added.sort(this.compare);
    this.items = mergeSorted(kept, added, this.compare);
  }

  add(item: T): void {
    if (this.batchAdds !== null) {
      this.batchAdds.push(item);
      return;
    }
    const items = this.items;
    const last = items.at(-1);
    if (last === undefined || this.compare(item, last) > 0) {
      items.push(item);
      return;
    }
    items.splice(this.lowerBound(item), 0, item);
  }

  remove(item: T): void {
    if (this.batchRemovals !== null) {
      this.batchRemovals.add(item);
      return;
    }
    const items = this.items;
    let index = this.lowerBound(item);
    if (items[index] !== item) {
      // Unreachable while the order is total; stay correct regardless.
      index = items.indexOf(item);
    }
    if (index >= 0) {
      items.splice(index, 1);
    }
  }

  /** First index whose item is not less than `probe`. */
  private lowerBound(probe: T): number {
    const items = this.items;
    let low = 0;
    let high = items.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (this.compare(items[middle] as T, probe) < 0) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low;
  }
}

function mergeSorted<T>(
  left: readonly T[],
  right: readonly T[],
  compare: (a: T, b: T) => number
): T[] {
  const merged = new Array<T>(left.length + right.length);
  let l = 0;
  let r = 0;
  let out = 0;
  while (l < left.length && r < right.length) {
    const a = left[l] as T;
    const b = right[r] as T;
    if (compare(a, b) <= 0) {
      merged[out++] = a;
      l++;
    } else {
      merged[out++] = b;
      r++;
    }
  }
  while (l < left.length) merged[out++] = left[l++] as T;
  while (r < right.length) merged[out++] = right[r++] as T;
  return merged;
}
