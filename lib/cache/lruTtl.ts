type LruTtlOptions = {
  readonly max: number;
  readonly ttlMs: number;
};

type Entry<V> = {
  readonly value: V;
  readonly expiresAt: number;
};

export default class LruTtlCache<K, V> {
  private readonly map = new Map<K, Entry<V>>();

  private readonly max: number;

  private readonly ttlMs: number;

  constructor(opts: LruTtlOptions) {
    this.max = Math.max(1, opts.max);
    this.ttlMs = Math.max(1000, opts.ttlMs);
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    this.map.delete(key);
    this.map.set(key, entry);

    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.map.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  set(key: K, value: V, ttlMs?: number): void {
    const expiresAt = Date.now() + this.normalizeTtlMs(ttlMs);
    if (this.map.has(key)) {
      this.map.delete(key);
    }

    this.map.set(key, { value, expiresAt });
    this.prune();
  }

  private normalizeTtlMs(ttlMs: number | undefined): number {
    if (typeof ttlMs === "number" && Number.isFinite(ttlMs)) {
      return Math.max(1000, ttlMs);
    }
    return this.ttlMs;
  }

  private prune(): void {
    const now = Date.now();
    for (const key of Array.from(this.map.keys())) {
      const entry = this.map.get(key);
      if (!entry) {
        continue;
      }

      if (now > entry.expiresAt) {
        this.map.delete(key);
      }
    }

    while (this.map.size > this.max) {
      const iterator = this.map.keys().next();
      if (iterator.done) {
        break;
      }

      this.map.delete(iterator.value as K);
    }
  }
}
