import type {
  ApiE2eeEntryKind,
  ApiE2eeLogItem,
  ApiE2eeWelcome,
} from "@/lib/e2ee/api-types";
import { bytesToBase64 } from "@/lib/e2ee/bytes";
import {
  type CrpOpener,
  type RelayAuth,
  RelayConnection,
  RelayReadError,
} from "./crp-client";
import {
  decodeRecordContent,
  MissingBytes,
  type RecordContent,
  type Row,
} from "./record-content";
import {
  contentRefOf,
  isOrdererRecord,
  type RelayItem,
  sha256Hex,
} from "./relay-records";

const PAGE = 500;
const WELCOMES_PER_PAGE = 50;
const PAGE_BYTE_BUDGET = 2.5 * 1024 * 1024;
const WELCOME_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** One verified record of a stream, decoded. */
interface StreamRecord {
  readonly pos: number;
  readonly prev: string | null;
  readonly hash: string;
  readonly content: RecordContent;
}

interface StreamState {
  after: number;
  readonly records: StreamRecord[];
}

interface RelayReaderSettings {
  readonly urls: readonly string[];
  readonly net: string;
  readonly ordererKey: string;
  readonly auth: () => Promise<RelayAuth | null>;
  readonly open?: CrpOpener | undefined;
  readonly now?: (() => number) | undefined;
}

function rowsOf(
  records: readonly StreamRecord[],
  table: string
): Map<string, Row> {
  const rows = new Map<string, Row>();
  const keyOf = (row: Row, columns: readonly string[]) =>
    JSON.stringify(columns.map((column) => row[column] ?? null));
  const columnsOf: Record<string, readonly string[]> = {
    e2ee_welcomes: ["id"],
    e2ee_welcome_deliveries: ["welcome_id", "device_key"],
    e2ee_log: ["group_handle", "seq"],
    e2ee_group_roster: ["id"],
    e2ee_blob_chunks: ["blob_id", "chunk_index"],
    e2ee_blobs: ["blob_id"],
  };
  const columns = columnsOf[table] ?? [];
  for (const record of records) {
    for (const op of record.content.ops) {
      if (op.table !== table) continue;
      if (op.op === "put") {
        rows.set(keyOf(op.row, columns), op.row);
        continue;
      }
      for (const [key, row] of Array.from(rows.entries())) {
        const matches = Object.entries(op.key).every(
          ([column, value]) => row[column] === value
        );
        if (matches) rows.delete(key);
      }
    }
  }
  return rows;
}

/** A text column's value; anything else in it is a malformed record. */
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  throw new RelayReadError("A text column holds something else");
}

function entryKind(value: unknown): ApiE2eeEntryKind | null {
  if (value === 1) return "commit";
  if (value === 2) return "proposal";
  return null;
}

function parseKeyList(value: unknown): string[] {
  if (typeof value !== "string" || !value) return [];
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Reads the delivery service's streams from the relays as a member device
 * does: every record must be the orderer's (pinned key) and follow the hash
 * chain; anything else throws, and the caller falls back to 6529.io's REST
 * routes. Streams are cached and read onward from the last page.
 */
export class E2eeRelayReader {
  private connection: Promise<RelayConnection> | null = null;
  private readonly streams = new Map<string, StreamState>();

  constructor(private readonly settings: RelayReaderSettings) {}

  private now(): number {
    return (this.settings.now ?? Date.now)();
  }

  private async connect(): Promise<RelayConnection> {
    const existing = this.connection
      ? await this.connection.catch(() => null)
      : null;
    if (existing?.isOpen) return existing;
    const auth = await this.settings.auth();
    if (!auth) throw new RelayReadError("No device grant for relay reads");
    const attempt = (async () => {
      let lastError: unknown = null;
      for (const url of this.settings.urls) {
        try {
          return await RelayConnection.open({
            url,
            net: this.settings.net,
            auth,
            open: this.settings.open,
          });
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new RelayReadError("No relay could be reached");
    })();
    this.connection = attempt;
    attempt.catch(() => {
      if (this.connection === attempt) this.connection = null;
    });
    return attempt;
  }

  close(): void {
    void this.connection
      ?.then((connection) => connection.close())
      .catch(() => undefined);
    this.connection = null;
  }

  private async verified(item: RelayItem): Promise<StreamRecord | null> {
    if (!(await isOrdererRecord(item.event, this.settings.ordererKey))) {
      throw new RelayReadError(`Record ${item.event.id} is not the orderer's`);
    }
    const ref = contentRefOf(item.event);
    if (!ref) return null;
    let bytes = ref.inline;
    if (!bytes && ref.payload) {
      const payload = await (await this.connect()).payload(ref.payload.h);
      if ((await sha256Hex(payload)) !== ref.payload.h) {
        throw new RelayReadError("A payload does not match its hash");
      }
      bytes = payload;
    }
    if (!bytes) throw new RelayReadError("A record has no content");
    const content = decodeRecordContent(bytes);
    return {
      pos: content.pos,
      prev: content.prev,
      hash: await sha256Hex(bytes),
      content,
    };
  }

  /** The stream's records so far, verified and chained, read onward. */
  private async read(wave: string): Promise<readonly StreamRecord[]> {
    const state = this.streams.get(wave) ?? { after: 0, records: [] };
    const connection = await this.connect();
    for (;;) {
      const page = await connection.history(wave, state.after, PAGE);
      for (const item of page.items) {
        state.after = Math.max(state.after, item.rseq);
        const record = await this.verified(item);
        if (record) this.accept(state, record);
      }
      if (!page.more || !page.items.length) break;
    }
    this.streams.set(wave, state);
    return state.records;
  }

  private accept(state: StreamState, record: StreamRecord): void {
    const last = state.records[state.records.length - 1];
    if (last && record.pos <= last.pos) {
      if (
        state.records.some(
          (r) => r.pos === record.pos && r.hash === record.hash
        )
      ) {
        return;
      }
      throw new RelayReadError("Two records at one position");
    }
    if (last && (record.pos !== last.pos + 1 || record.prev !== last.hash)) {
      throw new RelayReadError("The stream's hash chain is broken");
    }
    state.records.push(record);
  }

  private async bytesOf(value: unknown): Promise<Uint8Array> {
    if (value instanceof Uint8Array) return value;
    if (value instanceof MissingBytes) {
      const bytes = await (await this.connect()).payload(value.sha256);
      if ((await sha256Hex(bytes)) !== value.sha256) {
        throw new RelayReadError("A payload does not match its hash");
      }
      return bytes;
    }
    throw new RelayReadError("Expected bytes");
  }

  /** The device's pending Welcomes, as `GET e2ee/devices/{k}/welcomes`. */
  async welcomes(deviceKey: string): Promise<ApiE2eeWelcome[]> {
    const records = await this.read(`dv/${deviceKey.toLowerCase()}`);
    const welcomes = rowsOf(records, "e2ee_welcomes");
    const cutoff = this.now() - WELCOME_RETENTION_MS;
    const deliveries = Array.from(
      rowsOf(records, "e2ee_welcome_deliveries").values()
    )
      .filter(
        (row) =>
          row["device_key"] === deviceKey.toLowerCase() &&
          Number(row["created_at"]) >= cutoff
      )
      .sort(
        (a, b) =>
          Number(a["created_at"]) - Number(b["created_at"]) ||
          textOf(a["welcome_id"]).localeCompare(textOf(b["welcome_id"]))
      )
      .slice(0, WELCOMES_PER_PAGE);
    const out: ApiE2eeWelcome[] = [];
    let bytes = 0;
    for (const delivery of deliveries) {
      const welcome = welcomes.get(JSON.stringify([delivery["welcome_id"]]));
      if (!welcome) continue;
      const data = await this.bytesOf(welcome["data"]);
      const tree =
        welcome["ratchet_tree"] === null
          ? null
          : await this.bytesOf(welcome["ratchet_tree"]);
      bytes += data.length + (tree?.length ?? 0);
      if (out.length && bytes > PAGE_BYTE_BUDGET) break;
      out.push({
        id: textOf(welcome["id"]),
        group: textOf(welcome["group_handle"]),
        epoch: Number(welcome["epoch"]),
        data: bytesToBase64(data),
        ratchet_tree: tree ? bytesToBase64(tree) : null,
        added_by_profile_id: textOf(welcome["added_by_profile_id"]),
        added_by_device_key: textOf(welcome["added_by_device_key"]),
        created_at: Number(welcome["created_at"]),
      });
    }
    return out;
  }

  /**
   * A page of a group's log for one device, as `GET e2ee/groups/{g}/log`
   * pages it: items after `afterSeq` inside the device's roster windows.
   * `lastSeq` is 6529.io's head for the group; a relay that has not caught
   * up with it throws, so the caller reads the page from 6529.io instead.
   */
  async log(input: {
    readonly group: string;
    readonly deviceKey: string;
    readonly afterSeq: number;
    readonly limit: number;
    readonly lastSeq: number;
  }): Promise<{
    readonly items: ApiE2eeLogItem[];
    readonly next_after_seq: number | null;
  }> {
    const group = input.group.toLowerCase();
    const device = input.deviceKey.toLowerCase();
    const records = await this.read(`cv/${group}`);
    const log = Array.from(rowsOf(records, "e2ee_log").values());
    const highest = log.reduce(
      (max, row) => Math.max(max, Number(row["seq"])),
      0
    );
    if (highest < input.lastSeq) {
      throw new RelayReadError("The relays are behind 6529.io for this group");
    }
    const windows = Array.from(rowsOf(records, "e2ee_group_roster").values())
      .filter((row) => row["device_key"] === device)
      .map((row) => ({
        from: Number(row["joined_epoch"]),
        to: row["removed_epoch"] === null ? null : Number(row["removed_epoch"]),
      }));
    if (!windows.length) throw new RelayReadError("No window for this device");
    const inWindow = (epoch: number) =>
      windows.some((w) => epoch >= w.from && (w.to === null || epoch < w.to));
    const rows = log
      .filter((row) => Number(row["seq"]) > input.afterSeq)
      .filter((row) => inWindow(Number(row["epoch"])))
      .sort((a, b) => Number(a["seq"]) - Number(b["seq"]))
      .slice(0, input.limit + 1);
    const page: ApiE2eeLogItem[] = [];
    let bytes = 0;
    for (const row of rows.slice(0, input.limit)) {
      bytes += Number(row["padded_len"]);
      if (page.length && bytes > PAGE_BYTE_BUDGET) break;
      page.push(await this.logItem(row));
    }
    const hasMore = rows.length > page.length;
    return {
      items: page,
      next_after_seq:
        hasMore && page.length ? page[page.length - 1]!.seq : null,
    };
  }

  private async logItem(row: Row): Promise<ApiE2eeLogItem> {
    const isEntry = row["item_type"] === "entry";
    const text = (column: string) =>
      row[column] === null ? null : textOf(row[column]);
    return {
      seq: Number(row["seq"]),
      type: isEntry ? "entry" : "message",
      epoch: Number(row["epoch"]),
      kind: isEntry ? entryKind(row["kind"]) : null,
      data: bytesToBase64(await this.bytesOf(row["data"])),
      entry_hash: text("entry_hash"),
      epoch_commitment: text("epoch_commitment"),
      next_commit_key: text("next_commit_key"),
      signature: text("signature"),
      roster_add: parseKeyList(row["roster_add"]),
      roster_remove: parseKeyList(row["roster_remove"]),
      epoch_fp: text("epoch_fp"),
      created_at: Number(row["created_at"]),
    };
  }

  /** One attachment chunk's bytes, base64, as the blob routes serve them. */
  async blobChunk(blobId: string, index: number): Promise<string> {
    const records = await this.read(`bl/${blobId.toLowerCase()}`);
    const blob = rowsOf(records, "e2ee_blobs");
    const chunk = rowsOf(records, "e2ee_blob_chunks").get(
      JSON.stringify([blobId.toLowerCase(), index])
    );
    if (!chunk || blob.size === 0) {
      throw new RelayReadError("No such attachment chunk on the relays");
    }
    return bytesToBase64(await this.bytesOf(chunk["data"]));
  }
}
