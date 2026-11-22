/**
 * The delivery service's record content as the orderer writes it (format tag
 * 0x10, the backend's `e2ee-record-container.ts`): row operations on the
 * service's tables plus the record's stream position and the content hash of
 * the record before it.
 *
 *   0x10 | version u8 (1) | header length u32be | header JSON | inline bins
 *
 * A byte column is `{"$b": i}`, an index into the bins; a bin is inline (its
 * length) or external (`{"h": sha256, "n": length}`, a separate payload).
 */
const RECORD_CONTENT_TAG = 0x10;
const VERSION = 1;
const PREFIX = 6;

/** External bytes the relays no longer hold (dropped at retention). */
export class MissingBytes {
  constructor(
    readonly sha256: string,
    readonly length: number
  ) {}
}

type RowValue = string | number | boolean | null | Uint8Array | MissingBytes;

export type Row = Readonly<Record<string, RowValue>>;

type RowOp =
  | { readonly op: "put"; readonly table: string; readonly row: Row }
  | { readonly op: "del"; readonly table: string; readonly key: Row };

export interface RecordContent {
  readonly type: string;
  readonly pos: number;
  readonly prev: string | null;
  readonly ops: readonly RowOp[];
}

interface Header {
  readonly v: unknown;
  readonly type: unknown;
  readonly pos: unknown;
  readonly prev: unknown;
  readonly ops: unknown;
  readonly bins: unknown;
}

class RecordContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecordContentError";
  }
}

function parseHeader(bytes: Uint8Array): Header {
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as Header;
  } catch {
    throw new RecordContentError("Header is not JSON");
  }
}

function decodeBins(
  bins: unknown,
  bytes: Uint8Array,
  offset: number,
  external: (sha256: string, length: number) => Uint8Array | null
): (Uint8Array | MissingBytes)[] {
  if (!Array.isArray(bins)) throw new RecordContentError("Bad bins");
  const out: (Uint8Array | MissingBytes)[] = [];
  let at = offset;
  for (const bin of bins) {
    if (typeof bin === "number") {
      if (!Number.isSafeInteger(bin) || bin < 0 || at + bin > bytes.length) {
        throw new RecordContentError("Bad inline bin");
      }
      out.push(bytes.slice(at, at + bin));
      at += bin;
      continue;
    }
    const ref = bin as { h?: unknown; n?: unknown };
    if (typeof ref.h !== "string" || typeof ref.n !== "number") {
      throw new RecordContentError("Bad external bin");
    }
    out.push(external(ref.h, ref.n) ?? new MissingBytes(ref.h, ref.n));
  }
  if (at !== bytes.length) throw new RecordContentError("Trailing bytes");
  return out;
}

function decodeRow(
  raw: unknown,
  bins: readonly (Uint8Array | MissingBytes)[]
): Row {
  if (typeof raw !== "object" || raw === null) {
    throw new RecordContentError("Bad row");
  }
  const row: Record<string, RowValue> = {};
  for (const [column, value] of Object.entries(raw)) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      row[column] = value;
      continue;
    }
    const index = (value as { $b?: unknown }).$b;
    const bin = typeof index === "number" ? bins[index] : undefined;
    if (!bin) throw new RecordContentError(`Bad value in ${column}`);
    row[column] = bin;
  }
  return row;
}

/**
 * Decodes record content. `external` returns an external bin's bytes when
 * the reader has them (already checked against the hash); otherwise the
 * column decodes as MissingBytes.
 */
export function decodeRecordContent(
  bytes: Uint8Array,
  external: (sha256: string, length: number) => Uint8Array | null = () => null
): RecordContent {
  if (bytes.length < PREFIX || bytes[0] !== RECORD_CONTENT_TAG) {
    throw new RecordContentError("Not a delivery-service record");
  }
  if (bytes[1] !== VERSION) {
    throw new RecordContentError("Unknown record version");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerEnd = PREFIX + view.getUint32(2, false);
  if (headerEnd > bytes.length) {
    throw new RecordContentError("Header overruns the record");
  }
  const header = parseHeader(bytes.subarray(PREFIX, headerEnd));
  if (
    header.v !== VERSION ||
    typeof header.type !== "string" ||
    typeof header.pos !== "number" ||
    !(header.prev === null || typeof header.prev === "string") ||
    !Array.isArray(header.ops)
  ) {
    throw new RecordContentError("Bad header");
  }
  const bins = decodeBins(header.bins, bytes, headerEnd, external);
  const ops = header.ops.map((raw: unknown): RowOp => {
    const op = raw as { op?: unknown; table?: unknown; row?: unknown };
    if ((op.op !== "put" && op.op !== "del") || typeof op.table !== "string") {
      throw new RecordContentError("Bad op");
    }
    const row = decodeRow(op.row, bins);
    return op.op === "put"
      ? { op: "put", table: op.table, row }
      : { op: "del", table: op.table, key: row };
  });
  return {
    type: header.type,
    pos: header.pos,
    prev: header.prev,
    ops,
  };
}
