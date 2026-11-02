import type {
  StoredDevice,
  StoredGroup,
  StoredMessage,
  StoredOutboxItem,
} from "./records";
import type { E2eeStorage, E2eeStorageBatch } from "./storage";
import { nextVersion } from "./storage-version";
import type { ImportedPayload } from "./imported-payload";
import {
  compareHistory,
  isUnread,
  type HistoryKey,
  type HistoryPageOptions,
  type HistorySummary,
} from "./history-order";
const clone = <T>(value: T): T => structuredClone(value);

const joinKey = (...parts: string[]): string => parts.join("|");

export class MemoryE2eeStorage implements E2eeStorage {
  readonly kind = "memory" as const;
  private readonly devices = new Map<string, StoredDevice>();
  private readonly wasm = new Map<string, Uint8Array>();
  private readonly versions = new Map<string, number>();
  private readonly groups = new Map<string, StoredGroup>();
  private readonly messages = new Map<string, StoredMessage>();
  private readonly imports = new Map<string, Set<string>>();
  private readonly pages = new Map<string, StoredMessage[]>();
  private readonly outbox = new Map<string, StoredOutboxItem>();

  writeBatch(profileId: string, batch: E2eeStorageBatch): Promise<void> {
    const k = joinKey;
    let version: number;
    try {
      version = nextVersion(
        this.versions.get(profileId) ?? 0,
        batch.expectedVersion,
        false
      );
    } catch (error) {
      return Promise.reject(error as Error);
    }
    this.versions.set(profileId, version);
    if (batch.device) {
      this.devices.set(profileId, clone(batch.device));
    }
    if (batch.wasmState) {
      this.wasm.set(profileId, new Uint8Array(batch.wasmState));
    }
    for (const g of batch.deleteGroups ?? []) {
      this.groups.delete(k(profileId, g));
      this.dropMessages(profileId, g);
    }
    for (const group of batch.groups ?? []) {
      this.groups.set(k(profileId, group.g), clone(group));
    }
    for (const item of batch.deleteMessages ?? []) {
      this.deleteMessage(profileId, item.g, item.id);
    }
    for (const message of batch.messages ?? []) {
      this.deleteMessage(profileId, message.g, message.id);
      const key = k(profileId, message.g, message.id);
      this.messages.set(key, clone(message));
      if (message.imported) {
        const source = this.importKey(profileId, message.g, message.imported);
        const ids = this.imports.get(source) ?? new Set<string>();
        ids.add(key);
        this.imports.set(source, ids);
      }
    }
    for (const id of batch.deleteOutbox ?? []) {
      this.outbox.delete(k(profileId, id));
    }
    for (const item of batch.outbox ?? []) {
      this.outbox.set(k(profileId, item.id), clone(item));
    }
    return Promise.resolve();
  }

  private importKey(
    profileId: string,
    g: string,
    imp: ImportedPayload
  ): string {
    return joinKey(profileId, g, JSON.stringify([imp.w, imp.d, imp.p]));
  }

  private deleteMessage(profileId: string, g: string, id: string): void {
    const key = joinKey(profileId, g, id);
    const previous = this.messages.get(key);
    if (previous?.imported) {
      const source = this.importKey(profileId, g, previous.imported);
      const ids = this.imports.get(source);
      ids?.delete(key);
      if (ids?.size === 0) this.imports.delete(source);
    }
    this.messages.delete(key);
    this.pages.delete(joinKey(profileId, g));
  }

  private dropMessages(profileId: string, g: string): void {
    const prefix = joinKey(profileId, g, "");
    for (const key of [...this.messages.keys()]) {
      if (key.startsWith(prefix)) {
        const message = this.messages.get(key);
        if (message) this.deleteMessage(profileId, g, message.id);
      }
    }
  }

  getDevice(profileId: string): Promise<StoredDevice | null> {
    return Promise.resolve(clone(this.devices.get(profileId) ?? null));
  }

  getWasmState(profileId: string): Promise<Uint8Array | null> {
    const state = this.wasm.get(profileId);
    return Promise.resolve(state ? new Uint8Array(state) : null);
  }

  getStateVersion(profileId: string): Promise<number> {
    return Promise.resolve(this.versions.get(profileId) ?? 0);
  }

  private listByPrefix<T>(map: Map<string, T>, prefix: string): T[] {
    const out: T[] = [];
    for (const [key, value] of map) {
      if (key.startsWith(prefix)) {
        out.push(clone(value));
      }
    }
    return out;
  }

  listGroups(profileId: string): Promise<StoredGroup[]> {
    return Promise.resolve(this.listByPrefix(this.groups, `${profileId}|`));
  }

  listMessages(profileId: string, g: string): Promise<StoredMessage[]> {
    return Promise.resolve(
      this.listByPrefix(this.messages, joinKey(profileId, g, ""))
    );
  }

  getMessage(
    profileId: string,
    g: string,
    id: string
  ): Promise<StoredMessage | null> {
    return Promise.resolve(
      clone(this.messages.get(joinKey(profileId, g, id)) ?? null)
    );
  }

  pageMessages(
    profileId: string,
    g: string,
    options: HistoryPageOptions = {}
  ): Promise<StoredMessage[]> {
    const groupKey = joinKey(profileId, g);
    let rows = this.pages.get(groupKey);
    if (!rows) {
      rows = [...this.messages.entries()]
        .filter(([key]) => key.startsWith(groupKey + "|"))
        .map(([, message]) => message)
        .sort(compareHistory);
      this.pages.set(groupKey, rows);
    }
    const compareKey = (message: StoredMessage, key: HistoryKey) =>
      compareHistory(message, {
        pending: key[0] === 1,
        seq: key[1],
        ts: key[1],
        kind: key[2] === 0 ? "notice" : "message",
        id: key[3],
      } as StoredMessage);
    const selected = rows.filter(
      (message) =>
        (!options.before || compareKey(message, options.before) < 0) &&
        (!options.after || compareKey(message, options.after) > 0)
    );
    const limit = Math.min(200, Math.max(1, options.limit ?? 100));
    return Promise.resolve(
      clone(options.after ? selected.slice(0, limit) : selected.slice(-limit))
    );
  }

  findImported(
    profileId: string,
    g: string,
    imp: ImportedPayload
  ): Promise<StoredMessage[]> {
    const keys = this.imports.get(this.importKey(profileId, g, imp)) ?? [];
    const found: StoredMessage[] = [];
    for (const key of keys) {
      const message = this.messages.get(key);
      if (message && !message.deleted) found.push(clone(message));
    }
    return Promise.resolve(found);
  }

  async historySummary(
    profileId: string,
    g: string,
    readSeq: number
  ): Promise<HistorySummary> {
    const rows = (await this.listMessages(profileId, g)).sort(compareHistory);
    const unread = rows.filter((message) =>
      isUnread(message, profileId, readSeq)
    );
    return {
      last:
        rows
          .filter((message) => message.kind === "message" && !message.pending)
          .at(-1) ?? null,
      tail: rows.filter((message) => !message.pending).at(-1) ?? null,
      unread: unread.length,
      mentions: unread.filter((message) => message.mentions.includes(profileId))
        .length,
      count: rows.length,
      maxSeq: rows.reduce(
        (max, message) => Math.max(max, message.pending ? 0 : message.seq),
        0
      ),
    };
  }

  listOutbox(profileId: string): Promise<StoredOutboxItem[]> {
    return Promise.resolve(this.listByPrefix(this.outbox, `${profileId}|`));
  }

  clearProfile(profileId: string, expectedVersion?: number): Promise<void> {
    try {
      this.versions.set(
        profileId,
        nextVersion(this.versions.get(profileId) ?? 0, expectedVersion, true)
      );
    } catch (error) {
      return Promise.reject(error as Error);
    }
    for (const map of [this.imports, this.pages]) {
      for (const key of map.keys())
        if (key.startsWith(profileId + "|")) map.delete(key);
    }
    this.devices.delete(profileId);
    this.wasm.delete(profileId);
    for (const map of [this.groups, this.messages, this.outbox] as Map<
      string,
      unknown
    >[]) {
      for (const key of [...map.keys()]) {
        if (key.startsWith(`${profileId}|`)) {
          map.delete(key);
        }
      }
    }
    return Promise.resolve();
  }
}
