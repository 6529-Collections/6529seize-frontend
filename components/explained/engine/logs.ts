/**
 * P26 §3.1, §3.2, §4.2 and §6.1 on raw `eth_getLogs` entries: which logs are
 * inputs, their JSON-RPC types, the header timestamps of their blocks, and
 * the canonical Solidity ABI decoding of transfer and delegation events.
 *
 * A cycle can be given its logs raw, decoded, or some of each (the vectors
 * do all three); `computeCycle` checks the §3.1 rules across both. Topics are
 * the keccak-256 of the event signatures, computed here, not typed.
 */

import { keccak256, stringToBytes } from "viem";

import type { CheckedEvent } from "./consolidation";
import type { CanonicalTransfer } from "./holdings";
import {
  invalid,
  readAddress,
  readHex,
  readUint,
  type Rules,
} from "./registry";
import { headerTimestamps } from "./time";

/**
 * An `eth_getLogs` entry as JSON-RPC gives it. The engine reads these seven
 * members and `removed`; any other member, such as `blockHash`, is not read
 * (P26 §3.2, vector 106).
 */
export interface RawLog {
  readonly address: string;
  readonly topics: readonly string[];
  readonly data: string;
  readonly blockNumber: string;
  readonly transactionIndex: string;
  readonly logIndex: string;
  readonly transactionHash: string;
  readonly removed?: boolean;
}

/** The members every `eth_getLogs` entry has (P26 §3.1). */
export const LOG_FIELDS = [
  "address",
  "topics",
  "data",
  "blockNumber",
  "transactionIndex",
  "logIndex",
  "transactionHash",
] as const;

/** Raw logs and the header timestamps of their blocks, by decimal block number. */
export interface RawLogsInput {
  readonly entries: readonly unknown[];
  readonly headerTimestamps: Readonly<Record<string, unknown>>;
}

/** A log's place on chain: `(block, logIndex)` identifies it (P26 §3.1). */
export interface LogPosition {
  readonly block: bigint;
  readonly txIndex: bigint;
  readonly logIndex: bigint;
}

/** What the selected raw logs give. */
export interface DecodedLogs {
  readonly transfers: readonly CanonicalTransfer[];
  /** Delegation events, kept or not (§6.1), each with its block's time. */
  readonly events: readonly CheckedEvent[];
  /** The selected logs that give no transfer and no delegation event. */
  readonly ignored: readonly LogPosition[];
}

export const NO_LOGS: DecodedLogs = { transfers: [], events: [], ignored: [] };

function topic(signature: string): string {
  return keccak256(stringToBytes(signature));
}

const TRANSFER_SINGLE = topic(
  "TransferSingle(address,address,address,uint256,uint256)"
);
const TRANSFER_BATCH = topic(
  "TransferBatch(address,address,address,uint256[],uint256[])"
);
const TRANSFER_721 = topic("Transfer(address,address,uint256)");

/**
 * §6.1's delegation events: the kind, the number of data words, the word
 * holding `useCase`, the word holding the `allTokens` bool and the word
 * holding an address (the sub-delegate), where the event has one. Topics are
 * always `[topic0, from (or delegator), collection, delegate]`.
 */
interface DelegationLayout {
  readonly kind: "REGISTER" | "REVOKE";
  readonly words: number;
  readonly useCaseAt: number;
  readonly boolAt: number | null;
  readonly addressAt: number | null;
}

const DELEGATION_LAYOUTS: ReadonlyMap<string, DelegationLayout> = new Map([
  [
    topic("RegisterDelegation(address,address,address,uint256,bool,uint256)"),
    { kind: "REGISTER", words: 3, useCaseAt: 0, boolAt: 1, addressAt: null },
  ],
  [
    topic(
      "RegisterDelegationUsingSubDelegation(address,address,address,address,uint256,bool,uint256)"
    ),
    { kind: "REGISTER", words: 4, useCaseAt: 1, boolAt: 2, addressAt: 0 },
  ],
  [
    topic("RevokeDelegation(address,address,address,uint256)"),
    { kind: "REVOKE", words: 1, useCaseAt: 0, boolAt: null, addressAt: null },
  ],
  [
    topic(
      "RevokeDelegationUsingSubDelegation(address,address,address,address,uint256)"
    ),
    { kind: "REVOKE", words: 2, useCaseAt: 1, boolAt: null, addressAt: 0 },
  ],
]);

const HEX_DIGITS = /^0x[0-9a-fA-F]*$/;
const AMOUNT_LIMIT = 2n ** 64n;
const ADDRESS_BITS = 160n;

/** A log read at its JSON-RPC types (P26 §3.1). */
interface TypedLog {
  readonly address: string;
  readonly topics: readonly string[];
  readonly data: string;
  readonly position: LogPosition;
  readonly tx: string;
  readonly removed: boolean;
}

/** A JSON-RPC quantity: `0x` and at least one hex digit, below 2^64. */
function readQuantity(value: unknown, what: string): bigint {
  if (typeof value !== "string" || !HEX_DIGITS.test(value) || value.length < 3) {
    throw invalid(`${what} is not a hex quantity (P26 §3.1)`);
  }
  return readUint(BigInt(value), 64, what);
}

/** `0x` and the hex of whole bytes, any number of them, lowercased. */
function readData(value: unknown, what: string): string {
  if (
    typeof value !== "string" ||
    !HEX_DIGITS.test(value) ||
    value.length % 2 !== 0
  ) {
    throw invalid(`${what} is not hex bytes (P26 §3.1)`);
  }
  return value.toLowerCase();
}

function member(log: Readonly<Record<string, unknown>>, name: string): unknown {
  if (!(name in log)) {
    throw invalid(`a log has no ${name}: it is not an eth_getLogs entry`);
  }
  return log[name];
}

/**
 * P26 §3.1: an `eth_getLogs` entry at its JSON-RPC types: the address 20
 * bytes, each topic and the transaction hash 32 bytes, data hex bytes, the
 * block number and indexes quantities below 2^64, and `removed`, when
 * present, a boolean (vector 69). Every entry is read so, selected or not.
 */
export function readLog(entry: unknown): TypedLog {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    throw invalid("a log is not a JSON object: it is not an eth_getLogs entry");
  }
  const log = entry as Readonly<Record<string, unknown>>;
  for (const name of LOG_FIELDS) {
    member(log, name);
  }
  const what = `log ${String(log["logIndex"])} of block ${String(log["blockNumber"])}`;
  const position: LogPosition = {
    block: readQuantity(log["blockNumber"], `${what}: blockNumber`),
    txIndex: readQuantity(log["transactionIndex"], `${what}: transactionIndex`),
    logIndex: readQuantity(log["logIndex"], `${what}: logIndex`),
  };
  const topics = log["topics"];
  if (!Array.isArray(topics)) {
    throw invalid(`${what}: topics is not a list (P26 §3.1)`);
  }
  const removed = log["removed"];
  if (removed !== undefined && typeof removed !== "boolean") {
    throw invalid(`${what}: removed is not a boolean (P26 §3.1, vector 69)`);
  }
  return {
    address: readAddress(log["address"], `${what}: address`),
    topics: topics.map((t: unknown) => readHex(t, 32, `${what}: topic`)),
    data: readData(log["data"], `${what}: data`),
    position,
    tx: readHex(log["transactionHash"], 32, `${what}: transactionHash`),
    removed: removed === true,
  };
}

function wordOf(hex: string): bigint {
  return BigInt(`0x${hex.slice(2) || "0"}`);
}

/** The data's 32-byte words; data that is not whole words is malformed. */
function dataWords(data: string, what: string): bigint[] {
  const hex = data.slice(2);
  if (hex.length % 64 !== 0) {
    throw invalid(`${what}: data is not a whole number of words (P26 §3.2)`);
  }
  const words: bigint[] = [];
  for (let at = 0; at < hex.length; at += 64) {
    words.push(BigInt(`0x${hex.slice(at, at + 64)}`));
  }
  return words;
}

/** §3.2: an address word has 12 zero high bytes. */
function addressOf(word: bigint, what: string): string {
  if (word >> ADDRESS_BITS !== 0n) {
    throw invalid(
      `${what}: an address word has non-zero high bytes (P26 §3.2)`
    );
  }
  return `0x${word.toString(16).padStart(40, "0")}`;
}

function amountOf(word: bigint, what: string): bigint {
  if (word >= AMOUNT_LIMIT) {
    throw invalid(`${what}: an amount of 2^64 or more (P26 §3.2)`);
  }
  return word;
}

function whatOf(log: TypedLog): string {
  return `log ${log.position.logIndex} of block ${log.position.block}`;
}

interface TransferHead {
  readonly log: TypedLog;
  readonly timestamp: bigint;
  readonly from: string;
  readonly to: string;
}

function transferOf(
  head: TransferHead,
  batchPos: number,
  token: bigint,
  amount: bigint
): CanonicalTransfer {
  return {
    block: head.log.position.block,
    txIndex: head.log.position.txIndex,
    logIndex: head.log.position.logIndex,
    batchPos: BigInt(batchPos),
    timestamp: head.timestamp,
    tx: head.log.tx,
    contract: head.log.address,
    token,
    from: head.from,
    to: head.to,
    amount,
  };
}

/**
 * `TransferBatch`'s data as the canonical encoding of two arrays of one
 * length `n`: offsets 0x40 and 0x60 + 32n, then each array's length and
 * elements. Returns `[ids, values]`.
 */
function batchArrays(words: readonly bigint[], what: string): [bigint[], bigint[]] {
  const n = words.length >= 4 ? (words[2] as bigint) : -1n;
  const canonical =
    n >= 0n &&
    words[0] === 0x40n &&
    words[1] === 0x60n + 32n * n &&
    BigInt(words.length) === 4n + 2n * n &&
    words[3 + Number(n)] === n;
  if (!canonical) {
    throw invalid(
      `${what}: TransferBatch data is not the canonical encoding of two equal-length arrays (P26 §3.2)`
    );
  }
  const count = Number(n);
  return [words.slice(3, 3 + count), words.slice(4 + count, 4 + 2 * count)];
}

/** The Memes' ERC-1155 `TransferSingle` and `TransferBatch` (P26 §3.2). */
function decodeErc1155(log: TypedLog, timestamp: bigint): CanonicalTransfer[] {
  const [topic0, operator, from, to] = log.topics as [
    string,
    string,
    string,
    string,
  ];
  if (topic0 !== TRANSFER_SINGLE && topic0 !== TRANSFER_BATCH) {
    return [];
  }
  const what = whatOf(log);
  const head: TransferHead = {
    log,
    timestamp,
    from: addressOf(wordOf(from), what),
    to: addressOf(wordOf(to), what),
  };
  addressOf(wordOf(operator), what);
  const words = dataWords(log.data, what);
  if (topic0 === TRANSFER_SINGLE) {
    if (words.length !== 2) {
      throw invalid(`${what}: TransferSingle data is not id || value (P26 §3.2)`);
    }
    const [token, amount] = words as [bigint, bigint];
    return [transferOf(head, 0, token, amountOf(amount, what))];
  }
  const [ids, values] = batchArrays(words, what);
  return ids.map((token, k) =>
    transferOf(head, k, token, amountOf(values[k] as bigint, what))
  );
}

/** Gradients' and NextGen's ERC-721 `Transfer`: no data, one copy (P26 §3.2). */
function decodeErc721(log: TypedLog, timestamp: bigint): CanonicalTransfer[] {
  const [topic0, from, to, token] = log.topics as [
    string,
    string,
    string,
    string,
  ];
  if (topic0 !== TRANSFER_721) {
    return [];
  }
  const what = whatOf(log);
  const head: TransferHead = {
    log,
    timestamp,
    from: addressOf(wordOf(from), what),
    to: addressOf(wordOf(to), what),
  };
  if (dataWords(log.data, what).length > 0) {
    throw invalid(`${what}: an ERC-721 Transfer with data (P26 §3.2)`);
  }
  return [transferOf(head, 0, wordOf(token), 1n)];
}

/**
 * One log's transfers (P26 §3.2): none for a log that is no transfer event of
 * the three collections (another address, topic or topic count); the input
 * has no result for a malformed transfer log, anything but the canonical
 * Solidity ABI encoding, or an amount of 2^64 or more.
 */
export function decodeTransferLog(
  log: TypedLog,
  timestamp: bigint,
  rules: Rules
): CanonicalTransfer[] {
  if (log.topics.length !== 4) {
    return [];
  }
  if (log.address === rules.memes) {
    return decodeErc1155(log, timestamp);
  }
  if (log.address === rules.gradients || log.address === rules.nextgen) {
    return decodeErc721(log, timestamp);
  }
  return [];
}

/**
 * One log's delegation event (P26 §6.1), kept or not, with its block's time;
 * null for a log that is none of the four. The input has no result for a
 * malformed one: an address word with high bytes, another number of data
 * words, or an `allTokens` that is no bool.
 */
export function decodeDelegationLog(
  log: TypedLog,
  timestamp: bigint | null,
  rules: Rules
): CheckedEvent | null {
  const layout = DELEGATION_LAYOUTS.get(log.topics[0] ?? "");
  if (log.address !== rules.delegation || log.topics.length !== 4 || !layout) {
    return null;
  }
  const what = whatOf(log);
  const [from, collection, to] = log.topics
    .slice(1)
    .map((t) => addressOf(wordOf(t), what)) as [string, string, string];
  const words = dataWords(log.data, what);
  if (words.length !== layout.words) {
    throw invalid(
      `${what}: a delegation event with ${words.length} data words (P26 §6.1)`
    );
  }
  if (layout.addressAt !== null) {
    addressOf(words[layout.addressAt] as bigint, what);
  }
  if (layout.boolAt !== null && (words[layout.boolAt] as bigint) > 1n) {
    throw invalid(`${what}: allTokens is not a bool (P26 §6.1)`);
  }
  const { block, txIndex, logIndex } = log.position;
  return {
    position: [block, txIndex, logIndex],
    kind: layout.kind,
    from,
    to,
    collection,
    useCase: words[layout.useCaseAt] as bigint,
    time: timestamp,
  };
}

function positionKey(block: bigint, logIndex: bigint): string {
  return `${block}:${logIndex}`;
}

/**
 * P26 §3.1: within a block, a larger logIndex never has a smaller txIndex
 * (vector 53). Takes every log's position once.
 */
export function checkLogOrder(positions: Iterable<LogPosition>): void {
  const sorted = [...positions].sort((a, b) => {
    if (a.block !== b.block) {
      return a.block < b.block ? -1 : 1;
    }
    if (a.logIndex === b.logIndex) {
      return 0;
    }
    return a.logIndex < b.logIndex ? -1 : 1;
  });
  sorted.forEach((p, i) => {
    const previous = sorted[i - 1];
    if (previous?.block === p.block && p.txIndex < previous.txIndex) {
      throw invalid(
        `block ${p.block}: log ${p.logIndex} has a smaller txIndex than an earlier log (P26 §3.1, vector 53)`
      );
    }
  });
}

/**
 * P26 §4.2 on the headers of the blocks whose logs are read: with block `B`
 * stamped `T`, ordered by block number their timestamps strictly increase.
 */
function checkHeaderOrder(
  stamps: ReadonlyMap<bigint, bigint>,
  B: bigint,
  T: bigint
): void {
  const headers = new Map(stamps);
  const atB = headers.get(B);
  if (atB !== undefined && atB !== T) {
    throw invalid(
      `block B = ${B} has header timestamp ${atB}, not T = ${T} (P26 §4.2)`
    );
  }
  headers.set(B, T);
  const blocks = [...headers.keys()].sort((a, b) => (a < b ? -1 : 1));
  blocks.forEach((b, i) => {
    const a = blocks[i - 1];
    if (a !== undefined && (headers.get(b) as bigint) <= (headers.get(a) as bigint)) {
      throw invalid(
        `header timestamps do not increase from block ${a} to ${b} (P26 §4.2)`
      );
    }
  });
}

/**
 * The selected logs (P26 §3.1): those of the three collections and the
 * delegation contract in blocks `<= B` and not marked `removed`. Each is
 * given once, in txIndex order within its block.
 */
function selectLogs(
  logs: readonly TypedLog[],
  B: bigint,
  rules: Rules
): TypedLog[] {
  const sources = new Set([
    rules.memes,
    rules.gradients,
    rules.nextgen,
    rules.delegation,
  ]);
  const selected = logs.filter(
    (l) => sources.has(l.address) && l.position.block <= B && !l.removed
  );
  const seen = new Map<string, bigint>();
  for (const { position } of selected) {
    const key = positionKey(position.block, position.logIndex);
    const prior = seen.get(key);
    if (prior !== undefined) {
      throw invalid(
        `block ${position.block}, logIndex ${position.logIndex}: ${prior === position.txIndex ? "a log given twice" : "two logs"} (P26 §3.1)`
      );
    }
    seen.set(key, position.txIndex);
  }
  checkLogOrder(selected.map((l) => l.position));
  return selected;
}

/**
 * Raw logs to the cycle's inputs (P26 §3.1, §3.2, §4.2, §6.1): every entry
 * read at its types; the selected ones each given once and in order; their
 * blocks' header timestamps present and, with `B` stamped `T`, increasing;
 * then decoded. Later logs and removed ones are not inputs and are not
 * decoded.
 */
export function decodeLogs(
  input: RawLogsInput,
  B: bigint,
  T: bigint,
  rules: Rules
): DecodedLogs {
  const stamps = headerTimestamps(input.headerTimestamps);
  const selected = selectLogs(input.entries.map(readLog), B, rules);
  const used = new Map<bigint, bigint>();
  for (const { position } of selected) {
    const stamp = stamps.get(position.block);
    if (stamp === undefined) {
      throw invalid(
        `no header timestamp for block ${position.block} (P26 §4.2)`
      );
    }
    used.set(position.block, stamp);
  }
  checkHeaderOrder(used, B, T);
  const transfers: CanonicalTransfer[] = [];
  const events: CheckedEvent[] = [];
  const ignored: LogPosition[] = [];
  for (const log of selected) {
    const stamp = used.get(log.position.block) as bigint;
    const got = decodeTransferLog(log, stamp, rules);
    const event = decodeDelegationLog(log, stamp, rules);
    transfers.push(...got);
    if (event) {
      events.push(event);
    } else if (got.length === 0) {
      ignored.push(log.position);
    }
  }
  return { transfers, events, ignored };
}
