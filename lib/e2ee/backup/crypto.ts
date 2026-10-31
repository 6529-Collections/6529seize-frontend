import {
  base64ToBytes,
  bytesToBase64,
  concatBytes,
  randomBytes,
  toArrayBuffer,
  utf8Decode,
  utf8Encode,
} from "../bytes";
import { BackupError } from "./errors";

/**
 * Backup cryptography (history backup v2). Everything is WebCrypto:
 *
 *   K_b        random 32 bytes per backup generation (never stored raw)
 *   wrapKey    HKDF-SHA256(ikm = recovery secret, salt = backup_id bytes,
 *                          info = "6529 e2ee backup wrap v1") -> AES-256-GCM
 *   chunkKey   HKDF-SHA256(ikm = K_b, salt = backup_id bytes,
 *                          info = "6529 e2ee backup chunk v2") -> AES-256-GCM
 *   envelope   UTF-8 JSON {v, kdf, aead, methods: [{type: "recovery_code",
 *              nonce, ct}]}, ct = AES-GCM(wrapKey, nonce, K_b,
 *              aad = "6529-e2ee-backup-envelope-v1|{backup_id}|{profile_id}")
 *   chunk      nonce(12) || AES-GCM(chunkKey, nonce, pt,
 *              aad = "6529-e2ee-backup-chunk-v2|{backup_id}|{index}|{prev}")
 *              pt = header || json || zero padding, so the whole chunk is
 *              exactly one of CHUNK_BUCKETS bytes. The header is
 *                u8 version (2) || u32be epoch || u32be index || prev(32)
 *                || u8 flags (bit 0: base present) || u32be base index
 *                || base hash(32) || u32be len(json)
 *
 * Chunks form a hash chain per generation (see chain.ts): `index` counts
 * from 0 and `prev` is SHA-256 of the previous chunk's whole ciphertext
 * (32 zero bytes at index 0, written base64 in the aad). Index and prev are
 * bound by the aad and repeated in the header, so the server cannot
 * reorder, replay, duplicate or drop chunks; it can only cut off the
 * newest ones. A compaction snapshot (or a writer repairing a fork) starts
 * a new chain: index 0 again with a higher epoch, and `base` names the tip
 * (index and hash) of the chain it supersedes.
 *
 * The recovery secret has 256 bits of entropy, so a fast KDF is enough: the
 * stored envelope cannot be brute forced offline.
 */

export const CHUNK_BUCKETS: readonly number[] = [
  4096, 16_384, 65_536, 262_144, 1_048_576,
];
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
/** SHA-256 of a chunk's ciphertext: the link to the next chunk. */
const CHAIN_HASH_BYTES = 32;
const CHUNK_VERSION = 2;
const FLAG_BASE = 1;
// version, epoch, index, prev, flags, base index, base hash, json length
const HEADER_BYTES =
  1 + 4 + 4 + CHAIN_HASH_BYTES + 1 + 4 + CHAIN_HASH_BYTES + 4;
const OVERHEAD = NONCE_BYTES + TAG_BYTES + HEADER_BYTES;
/** Largest segment JSON (bytes) that fits the largest bucket. */
export const MAX_SEGMENT_BYTES = CHUNK_BUCKETS.at(-1)! - OVERHEAD;
const BACKUP_KEY_BYTES = 32;

const WRAP_INFO = "6529 e2ee backup wrap v1";
const CHUNK_INFO = "6529 e2ee backup chunk v2";
const ENVELOPE_AAD = "6529-e2ee-backup-envelope-v1";
const CHUNK_AAD = "6529-e2ee-backup-chunk-v2";

const subtle = () => globalThis.crypto.subtle;

function backupIdBytes(backupId: string): Uint8Array {
  return utf8Encode(backupId.toLowerCase());
}

async function deriveAesKey(
  ikm: Uint8Array,
  backupId: string,
  info: string
): Promise<CryptoKey> {
  const base = await subtle().importKey(
    "raw",
    toArrayBuffer(ikm),
    "HKDF",
    false,
    ["deriveKey"]
  );
  return subtle().deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toArrayBuffer(backupIdBytes(backupId)),
      info: toArrayBuffer(utf8Encode(info)),
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export const newBackupKey = (): Uint8Array => randomBytes(BACKUP_KEY_BYTES);

/** Non-extractable chunk key of a generation. */
export const deriveChunkKey = (
  backupKey: Uint8Array,
  backupId: string
): Promise<CryptoKey> => deriveAesKey(backupKey, backupId, CHUNK_INFO);

async function gcm(
  mode: "encrypt" | "decrypt",
  key: CryptoKey,
  nonce: Uint8Array,
  data: Uint8Array,
  aad: string
): Promise<Uint8Array> {
  const params: AesGcmParams = {
    name: "AES-GCM",
    iv: toArrayBuffer(nonce),
    additionalData: toArrayBuffer(utf8Encode(aad)),
  };
  const out =
    mode === "encrypt"
      ? await subtle().encrypt(params, key, toArrayBuffer(data))
      : await subtle().decrypt(params, key, toArrayBuffer(data));
  return new Uint8Array(out);
}

interface EnvelopeMethod {
  type: "recovery_code";
  nonce: string;
  ct: string;
}

interface EnvelopeJson {
  v: 1;
  kdf: "hkdf-sha256";
  aead: "aes-256-gcm";
  methods: EnvelopeMethod[];
}

const envelopeAad = (backupId: string, profileId: string) =>
  `${ENVELOPE_AAD}|${backupId.toLowerCase()}|${profileId}`;

/** Wraps K_b under the recovery secret; returns the envelope as base64. */
export async function sealEnvelope(input: {
  readonly recoverySecret: Uint8Array;
  readonly backupKey: Uint8Array;
  readonly backupId: string;
  readonly profileId: string;
}): Promise<string> {
  const wrapKey = await deriveAesKey(
    input.recoverySecret,
    input.backupId,
    WRAP_INFO
  );
  const nonce = randomBytes(NONCE_BYTES);
  const ct = await gcm(
    "encrypt",
    wrapKey,
    nonce,
    input.backupKey,
    envelopeAad(input.backupId, input.profileId)
  );
  const envelope: EnvelopeJson = {
    v: 1,
    kdf: "hkdf-sha256",
    aead: "aes-256-gcm",
    methods: [
      {
        type: "recovery_code",
        nonce: bytesToBase64(nonce),
        ct: bytesToBase64(ct),
      },
    ],
  };
  return bytesToBase64(utf8Encode(JSON.stringify(envelope)));
}

function parseEnvelope(envelope: string): EnvelopeMethod {
  try {
    const parsed: unknown = JSON.parse(utf8Decode(base64ToBytes(envelope)));
    const json = (parsed ?? {}) as { v?: unknown; methods?: unknown };
    const methods: unknown[] = Array.isArray(json.methods) ? json.methods : [];
    const method = methods.find(
      (entry): entry is Partial<EnvelopeMethod> =>
        typeof entry === "object" &&
        entry !== null &&
        (entry as { type?: unknown }).type === "recovery_code"
    );
    if (
      json.v !== 1 ||
      typeof method?.nonce !== "string" ||
      typeof method.ct !== "string"
    ) {
      throw new Error("bad envelope");
    }
    return { type: "recovery_code", nonce: method.nonce, ct: method.ct };
  } catch {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
}

/**
 * Unwraps K_b. A wrong (but well-formed) recovery code fails AES-GCM
 * authentication and throws E2EE_BACKUP_WRONG_CODE; nothing else is tried.
 */
export async function openEnvelope(input: {
  readonly envelope: string;
  readonly recoverySecret: Uint8Array;
  readonly backupId: string;
  readonly profileId: string;
}): Promise<Uint8Array> {
  const method = parseEnvelope(input.envelope);
  const wrapKey = await deriveAesKey(
    input.recoverySecret,
    input.backupId,
    WRAP_INFO
  );
  let key: Uint8Array;
  try {
    key = await gcm(
      "decrypt",
      wrapKey,
      base64ToBytes(method.nonce),
      base64ToBytes(method.ct),
      envelopeAad(input.backupId, input.profileId)
    );
  } catch {
    throw new BackupError("E2EE_BACKUP_WRONG_CODE");
  }
  if (key.length !== BACKUP_KEY_BYTES) {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  return key;
}

// -- chunks -------------------------------------------------------------------

/** Position of a chunk in its generation's hash chain. */
export interface ChunkLink {
  /** Chain number: 0 first, higher after each compaction or fork repair. */
  readonly epoch: number;
  /** 0 for the first chunk of a chain, then +1 per chunk. */
  readonly index: number;
  /** SHA-256 of the previous chunk's ciphertext; zero bytes at index 0. */
  readonly prev: Uint8Array;
  /** Index 0 only: the tip of the chain this one supersedes, if any. */
  readonly base: { readonly index: number; readonly hash: Uint8Array } | null;
}

/** The `prev` of every chain's first chunk. */
export const ZERO_CHAIN_HASH: Uint8Array = new Uint8Array(CHAIN_HASH_BYTES);

/** SHA-256 of a whole chunk (nonce and ciphertext): the next chunk's prev. */
export async function chunkHash(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await subtle().digest("SHA-256", toArrayBuffer(data)));
}

export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

const isU32 = (value: number) =>
  Number.isInteger(value) && value >= 0 && value <= 0xffffffff;

const chunkAad = (backupId: string, index: number, prev: Uint8Array) =>
  `${CHUNK_AAD}|${backupId.toLowerCase()}|${index}|${bytesToBase64(prev)}`;

/** Chain starts carry a zero prev; only chain starts may name a base. */
function isValidLink(link: ChunkLink): boolean {
  if (
    !isU32(link.epoch) ||
    !isU32(link.index) ||
    link.prev.length !== CHAIN_HASH_BYTES
  ) {
    return false;
  }
  if (link.index !== 0) {
    return link.base === null;
  }
  return (
    equalBytes(link.prev, ZERO_CHAIN_HASH) &&
    (link.base === null ||
      (isU32(link.base.index) && link.base.hash.length === CHAIN_HASH_BYTES))
  );
}

function writeHeader(link: ChunkLink, jsonLength: number): Uint8Array {
  const header = new Uint8Array(HEADER_BYTES);
  const view = new DataView(header.buffer);
  let at = 0;
  header[at] = CHUNK_VERSION;
  at += 1;
  view.setUint32(at, link.epoch);
  at += 4;
  view.setUint32(at, link.index);
  at += 4;
  header.set(link.prev, at);
  at += CHAIN_HASH_BYTES;
  header[at] = link.base ? FLAG_BASE : 0;
  at += 1;
  view.setUint32(at, link.base?.index ?? 0);
  at += 4;
  header.set(link.base?.hash ?? ZERO_CHAIN_HASH, at);
  at += CHAIN_HASH_BYTES;
  view.setUint32(at, jsonLength);
  return header;
}

/** Parses the decrypted header; null when it is malformed. */
function readHeader(
  plaintext: Uint8Array
): { link: ChunkLink; jsonLength: number } | null {
  if (plaintext.length < HEADER_BYTES) {
    return null;
  }
  const view = new DataView(
    plaintext.buffer,
    plaintext.byteOffset,
    plaintext.byteLength
  );
  let at = 0;
  const version = plaintext[at];
  at += 1;
  const epoch = view.getUint32(at);
  at += 4;
  const index = view.getUint32(at);
  at += 4;
  const prev = plaintext.slice(at, at + CHAIN_HASH_BYTES);
  at += CHAIN_HASH_BYTES;
  const flags = plaintext[at]!;
  at += 1;
  const baseIndex = view.getUint32(at);
  at += 4;
  const baseHash = plaintext.slice(at, at + CHAIN_HASH_BYTES);
  at += CHAIN_HASH_BYTES;
  const jsonLength = view.getUint32(at);
  if (
    version !== CHUNK_VERSION ||
    (flags & ~FLAG_BASE) !== 0 ||
    jsonLength > plaintext.length - HEADER_BYTES
  ) {
    return null;
  }
  const link: ChunkLink = {
    epoch,
    index,
    prev,
    base: flags & FLAG_BASE ? { index: baseIndex, hash: baseHash } : null,
  };
  return isValidLink(link) ? { link, jsonLength } : null;
}

/** Smallest bucket that holds `jsonBytes` bytes of segment JSON. */
function chunkBucketFor(jsonBytes: number): number | null {
  return CHUNK_BUCKETS.find((bucket) => bucket >= jsonBytes + OVERHEAD) ?? null;
}

/** Encrypts one segment at `link`; the result is exactly one bucket long. */
export async function sealChunk(
  key: CryptoKey,
  backupId: string,
  link: ChunkLink,
  json: Uint8Array
): Promise<Uint8Array> {
  if (!isValidLink(link)) {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  const bucket = chunkBucketFor(json.length);
  if (bucket === null) {
    throw new BackupError("E2EE_BACKUP_SEGMENT_TOO_LARGE");
  }
  const plaintext = new Uint8Array(bucket - NONCE_BYTES - TAG_BYTES);
  plaintext.set(writeHeader(link, json.length), 0);
  plaintext.set(json, HEADER_BYTES);
  const nonce = randomBytes(NONCE_BYTES);
  const ct = await gcm(
    "encrypt",
    key,
    nonce,
    plaintext,
    chunkAad(backupId, link.index, link.prev)
  );
  return concatBytes(nonce, ct);
}

/**
 * Decrypts one chunk that must sit at chain position (`index`, `prev`).
 * Any other position, a tampered chunk or a malformed header throws
 * E2EE_BACKUP_CORRUPT. Returns the full link and the segment JSON bytes.
 */
export async function openChunk(
  key: CryptoKey,
  backupId: string,
  expected: { readonly index: number; readonly prev: Uint8Array },
  data: Uint8Array
): Promise<{ link: ChunkLink; json: Uint8Array }> {
  if (data.length < OVERHEAD) {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  let plaintext: Uint8Array;
  try {
    plaintext = await gcm(
      "decrypt",
      key,
      data.subarray(0, NONCE_BYTES),
      data.subarray(NONCE_BYTES),
      chunkAad(backupId, expected.index, expected.prev)
    );
  } catch {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  const header = readHeader(plaintext);
  if (
    header?.link.index !== expected.index ||
    !equalBytes(header.link.prev, expected.prev)
  ) {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  return {
    link: header.link,
    json: plaintext.slice(HEADER_BYTES, HEADER_BYTES + header.jsonLength),
  };
}
