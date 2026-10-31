import {
  base64ToBytes,
  bytesToBase64,
  concatBytes,
  randomBytes,
  toArrayBuffer,
  u32be,
  utf8Decode,
  utf8Encode,
} from "../bytes";
import { BackupError } from "./errors";

/**
 * Backup cryptography (history backup v1). Everything is WebCrypto:
 *
 *   K_b        random 32 bytes per backup generation (never stored raw)
 *   wrapKey    HKDF-SHA256(ikm = recovery secret, salt = backup_id bytes,
 *                          info = "6529 e2ee backup wrap v1") -> AES-256-GCM
 *   chunkKey   HKDF-SHA256(ikm = K_b, salt = backup_id bytes,
 *                          info = "6529 e2ee backup chunk v1") -> AES-256-GCM
 *   envelope   UTF-8 JSON {v, kdf, aead, methods: [{type: "recovery_code",
 *              nonce, ct}]}, ct = AES-GCM(wrapKey, nonce, K_b,
 *              aad = "6529-e2ee-backup-envelope-v1|{backup_id}|{profile_id}")
 *   chunk      nonce(12) || AES-GCM(chunkKey, nonce, pt,
 *              aad = "6529-e2ee-backup-chunk-v1|{backup_id}")
 *              pt = u32be(len(json)) || json || zero padding, so the whole
 *              chunk is exactly one of CHUNK_BUCKETS bytes.
 *
 * The recovery secret has 256 bits of entropy, so a fast KDF is enough: the
 * stored envelope cannot be brute forced offline.
 */

export const CHUNK_BUCKETS: readonly number[] = [
  4096, 16_384, 65_536, 262_144, 1_048_576,
];
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const LENGTH_BYTES = 4;
const OVERHEAD = NONCE_BYTES + TAG_BYTES + LENGTH_BYTES;
/** Largest segment JSON (bytes) that fits the largest bucket. */
export const MAX_SEGMENT_BYTES = CHUNK_BUCKETS.at(-1)! - OVERHEAD;
export const BACKUP_KEY_BYTES = 32;

const WRAP_INFO = "6529 e2ee backup wrap v1";
const CHUNK_INFO = "6529 e2ee backup chunk v1";
const ENVELOPE_AAD = "6529-e2ee-backup-envelope-v1";
const CHUNK_AAD = "6529-e2ee-backup-chunk-v1";

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
    const parsed = JSON.parse(
      utf8Decode(base64ToBytes(envelope))
    ) as Partial<EnvelopeJson> | null;
    const method = parsed?.methods?.find(
      (entry) => entry?.type === "recovery_code"
    );
    if (
      parsed?.v !== 1 ||
      typeof method?.nonce !== "string" ||
      typeof method.ct !== "string"
    ) {
      throw new Error("bad envelope");
    }
    return method;
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

const chunkAad = (backupId: string) => `${CHUNK_AAD}|${backupId.toLowerCase()}`;

/** Smallest bucket that holds `jsonBytes` bytes of segment JSON. */
export function chunkBucketFor(jsonBytes: number): number | null {
  return CHUNK_BUCKETS.find((bucket) => bucket >= jsonBytes + OVERHEAD) ?? null;
}

/** Encrypts one segment; the result is exactly one bucket long. */
export async function sealChunk(
  key: CryptoKey,
  backupId: string,
  json: Uint8Array
): Promise<Uint8Array> {
  const bucket = chunkBucketFor(json.length);
  if (bucket === null) {
    throw new BackupError("E2EE_BACKUP_SEGMENT_TOO_LARGE");
  }
  const plaintext = new Uint8Array(bucket - NONCE_BYTES - TAG_BYTES);
  plaintext.set(u32be(json.length), 0);
  plaintext.set(json, LENGTH_BYTES);
  const nonce = randomBytes(NONCE_BYTES);
  const ct = await gcm("encrypt", key, nonce, plaintext, chunkAad(backupId));
  return concatBytes(nonce, ct);
}

/** Decrypts one chunk back to its segment JSON bytes. */
export async function openChunk(
  key: CryptoKey,
  backupId: string,
  data: Uint8Array
): Promise<Uint8Array> {
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
      chunkAad(backupId)
    );
  } catch {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  const view = new DataView(
    plaintext.buffer,
    plaintext.byteOffset,
    plaintext.byteLength
  );
  const length = view.getUint32(0);
  if (length > plaintext.length - LENGTH_BYTES) {
    throw new BackupError("E2EE_BACKUP_CORRUPT");
  }
  return plaintext.slice(LENGTH_BYTES, LENGTH_BYTES + length);
}
