import { canonicalJson } from "@/lib/device-signing/canonical-json";
import {
  isWellFormed,
  RECORD_KEY_MAX_BYTES,
  RECORD_TYPE_PATTERN,
} from "./record-kinds";

/**
 * Sealed record contents. A device seals items under its own sender key S
 * for (class, generation) and wraps S with HPKE (RFC 9180 base mode, X25519 /
 * HKDF-SHA256 / AES-128-GCM) to each reader: 6529.io's provider keys for the
 * PROVIDER class, the person's other devices later. WebCrypto only; the
 * backend's node:crypto version reads and writes the same bytes.
 * @api
 */
export const SealedClass = { PROVIDER: 1, OWN: 2 } as const;

const SealedFormat = { ITEMS: 0x01, KEYS: 0x02 } as const;

/** @api */
export interface SealedItem {
  readonly t: string;
  readonly k: string;
  /** null unsets the key. */
  readonly b: Record<string, unknown> | null;
}

/** @api */
export interface KeyWrap {
  readonly cls: number;
  readonly gen: number;
  readonly from: string;
  readonly to: string;
  readonly enc: string;
  readonly ct: string;
}

/** @api */
export interface KeysDocument {
  readonly v: 1;
  readonly dev: string;
  readonly box: string | null;
  readonly wraps: readonly KeyWrap[];
}

/** @api */
export interface ProviderPublicKey {
  readonly id: string;
  readonly publicKey: Uint8Array;
}

const SEALED_INFO = "6529.PersonalSealed.v1";
const WRAP_INFO = "6529.PersonalKeyWrap.v1";
const PADDING_BUCKETS = [256, 1024, 4096, 16384, 32768];
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const ITEMS_HEADER_BYTES = 1 + 1 + 4 + 32 + NONCE_BYTES;
const DEVICE_KEY = /^0x[0-9a-f]{64}$/;
const X25519 = { name: "X25519" } as const;
const X25519_PKCS8_PREFIX = "302e020100300506032b656e04220420";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

const subtle = (): SubtleCrypto => {
  const value = (globalThis as { readonly crypto?: Partial<Crypto> }).crypto
    ?.subtle;
  if (!value) {
    throw new Error("WebCrypto is unavailable");
  }
  return value;
};

/** Copies into a fresh ArrayBuffer, which WebCrypto accepts in every realm. */
const own = (bytes: Uint8Array): Uint8Array<ArrayBuffer> =>
  new Uint8Array(bytes);

const concat = (...parts: readonly Uint8Array[]): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const u32 = (value: number): Uint8Array => {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value);
  return out;
};

const u16 = (value: number): Uint8Array => {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value);
  return out;
};

const fromHex = (hex: string): Uint8Array<ArrayBuffer> => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

const toHex = (bytes: Uint8Array): string =>
  `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;

/** @api */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

/** @api */
export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
}

// ---- HKDF (RFC 5869) over HMAC-SHA256 ----

async function hmac(
  key: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  // HMAC pads short keys with zeros, so an empty salt is 32 zero bytes;
  // WebCrypto refuses an empty HMAC key.
  const imported = await subtle().importKey(
    "raw",
    own(key.length ? key : new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await subtle().sign("HMAC", imported, own(data)));
}

const hkdfExtract = (salt: Uint8Array, ikm: Uint8Array) => hmac(salt, ikm);

async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array<ArrayBuffer>> {
  const out: Uint8Array[] = [];
  let produced = 0;
  let previous: Uint8Array = new Uint8Array(0);
  for (let i = 1; produced < length; i++) {
    previous = await hmac(prk, concat(previous, info, new Uint8Array([i])));
    out.push(previous);
    produced += previous.length;
  }
  return concat(...out).slice(0, length);
}

// ---- HPKE (RFC 9180), base mode, suite 0x0020 / 0x0001 / 0x0001 ----

const HPKE_V1 = encoder.encode("HPKE-v1");
const KEM_SUITE = concat(encoder.encode("KEM"), u16(0x0020));
const HPKE_SUITE = concat(
  encoder.encode("HPKE"),
  u16(0x0020),
  u16(0x0001),
  u16(0x0001)
);
const EMPTY = new Uint8Array(0);

const labeledExtract = (
  suite: Uint8Array,
  salt: Uint8Array,
  label: string,
  ikm: Uint8Array
) => hkdfExtract(salt, concat(HPKE_V1, suite, encoder.encode(label), ikm));

const labeledExpand = (
  suite: Uint8Array,
  prk: Uint8Array,
  label: string,
  info: Uint8Array,
  length: number
) =>
  hkdfExpand(
    prk,
    concat(u16(length), HPKE_V1, suite, encoder.encode(label), info),
    length
  );

async function x25519PrivateFromRaw(raw: Uint8Array): Promise<CryptoKey> {
  return await subtle().importKey(
    "pkcs8",
    concat(fromHex(X25519_PKCS8_PREFIX), raw),
    X25519,
    false,
    ["deriveBits"]
  );
}

/**
 * Whether this browser offers X25519 in WebCrypto, which sealing needs.
 * @api
 */
export async function isSealSupported(): Promise<boolean> {
  try {
    const pair = (await subtle().generateKey(X25519, true, [
      "deriveBits",
    ])) as CryptoKeyPair;
    return "privateKey" in pair && "publicKey" in pair;
  } catch {
    return false;
  }
}

/**
 * One HPKE base-mode seal (sequence 0). `ephemeralPrivateKey` is for test
 * vectors only; real wraps use a fresh key.
 * @api
 */
export async function hpkeSealBase(args: {
  readonly recipientPublicKey: Uint8Array;
  readonly info: Uint8Array;
  readonly aad: Uint8Array;
  readonly plaintext: Uint8Array;
  readonly ephemeralPrivateKey?: Uint8Array | undefined;
}): Promise<{ enc: Uint8Array; ct: Uint8Array }> {
  let ephemeral: CryptoKey;
  let enc: Uint8Array;
  if (args.ephemeralPrivateKey) {
    ephemeral = await x25519PrivateFromRaw(args.ephemeralPrivateKey);
    enc = await x25519PublicOfPrivate(args.ephemeralPrivateKey);
  } else {
    const pair = (await subtle().generateKey(X25519, true, [
      "deriveBits",
    ])) as CryptoKeyPair;
    ephemeral = pair.privateKey;
    enc = new Uint8Array(await subtle().exportKey("raw", pair.publicKey));
  }
  const recipient = await subtle().importKey(
    "raw",
    own(args.recipientPublicKey),
    X25519,
    false,
    []
  );
  const dh = new Uint8Array(
    await subtle().deriveBits(
      { name: "X25519", public: recipient },
      ephemeral,
      256
    )
  );
  const eaePrk = await labeledExtract(KEM_SUITE, EMPTY, "eae_prk", dh);
  const shared = await labeledExpand(
    KEM_SUITE,
    eaePrk,
    "shared_secret",
    concat(enc, args.recipientPublicKey),
    32
  );
  const pskIdHash = await labeledExtract(
    HPKE_SUITE,
    EMPTY,
    "psk_id_hash",
    EMPTY
  );
  const infoHash = await labeledExtract(
    HPKE_SUITE,
    EMPTY,
    "info_hash",
    args.info
  );
  const context = concat(new Uint8Array([0]), pskIdHash, infoHash);
  const secret = await labeledExtract(HPKE_SUITE, shared, "secret", EMPTY);
  const key = await labeledExpand(HPKE_SUITE, secret, "key", context, 16);
  const nonce = await labeledExpand(
    HPKE_SUITE,
    secret,
    "base_nonce",
    context,
    12
  );
  const aesKey = await subtle().importKey("raw", key, "AES-GCM", false, [
    "encrypt",
  ]);
  const ct = new Uint8Array(
    await subtle().encrypt(
      { name: "AES-GCM", iv: nonce, additionalData: own(args.aad) },
      aesKey,
      own(args.plaintext)
    )
  );
  return { enc, ct };
}

/** The X25519 public key of a raw private key (test vectors). */
async function x25519PublicOfPrivate(raw: Uint8Array): Promise<Uint8Array> {
  const extractable = await subtle().importKey(
    "pkcs8",
    concat(fromHex(X25519_PKCS8_PREFIX), raw),
    X25519,
    true,
    ["deriveBits"]
  );
  const jwk = await subtle().exportKey("jwk", extractable);
  return fromBase64Url(jwk.x ?? "");
}

// ---- Sealed items (format 0x01) ----

const utf8Length = (value: string): number => encoder.encode(value).length;

/** The same checks as the backend's: types first, so nothing is coerced. */
function checkItem(value: unknown): SealedItem {
  const item = value as Partial<SealedItem> | null;
  const body = item?.b;
  // typeof "object" already rules out undefined; null is checked first.
  const bodyValid =
    body === null || (typeof body === "object" && !Array.isArray(body));
  if (
    typeof item !== "object" ||
    item === null ||
    typeof item.t !== "string" ||
    !RECORD_TYPE_PATTERN.test(item.t) ||
    typeof item.k !== "string" ||
    !isWellFormed(item.k) ||
    utf8Length(item.k) > RECORD_KEY_MAX_BYTES ||
    !bodyValid ||
    Object.keys(item).length !== 3
  ) {
    throw new Error('Sealed item must be {"t","k","b"}');
  }
  return { t: item.t, k: item.k, b: body ?? null };
}

function checkClassAndGeneration(cls: number, gen: number): void {
  if (cls !== SealedClass.PROVIDER && cls !== SealedClass.OWN) {
    throw new Error(`Unknown sealed class ${cls}`);
  }
  if (!Number.isInteger(gen) || gen < 1 || gen > 0xffffffff) {
    throw new Error(`Invalid generation ${gen}`);
  }
}

async function itemsKey(
  senderKey: Uint8Array,
  wave: string,
  cls: number,
  gen: number
): Promise<CryptoKey> {
  if (senderKey.length !== KEY_BYTES) {
    throw new Error("Sender key must be 32 bytes");
  }
  const prk = await hkdfExtract(encoder.encode(wave), senderKey);
  const raw = await hkdfExpand(
    prk,
    concat(encoder.encode(SEALED_INFO), new Uint8Array([cls]), u32(gen)),
    KEY_BYTES
  );
  return await subtle().importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

const itemsAad = (wave: string, header: Uint8Array) =>
  concat(encoder.encode(`${SEALED_INFO}|${wave}`), header);

function pad(json: Uint8Array): Uint8Array {
  const size = PADDING_BUCKETS.find((bucket) => bucket >= 4 + json.length);
  if (size === undefined) {
    throw new Error("Sealed items are too large");
  }
  const plaintext = new Uint8Array(size);
  new DataView(plaintext.buffer).setUint32(0, json.length);
  plaintext.set(json, 4);
  return plaintext;
}

function unpad(plaintext: Uint8Array): Uint8Array {
  if (!PADDING_BUCKETS.includes(plaintext.length)) {
    throw new Error("Sealed plaintext is not a padding bucket");
  }
  const length = new DataView(
    plaintext.buffer,
    plaintext.byteOffset,
    plaintext.byteLength
  ).getUint32(0);
  if (
    length > plaintext.length - 4 ||
    plaintext.subarray(4 + length).some((byte) => byte !== 0)
  ) {
    throw new Error("Sealed plaintext length or padding is wrong");
  }
  return plaintext.subarray(4, 4 + length);
}

/**
 * Seals items under a sender key; returns the `c` bytes of a SEALED body.
 * @api
 */
export async function sealItems(args: {
  readonly wave: string;
  readonly cls: number;
  readonly gen: number;
  readonly deviceKey: string;
  readonly senderKey: Uint8Array;
  readonly items: readonly SealedItem[];
  /** Test vectors only: production seals always take a random nonce. */
  readonly fixedNonceForTests?: Uint8Array | undefined;
}): Promise<Uint8Array> {
  checkClassAndGeneration(args.cls, args.gen);
  if (!DEVICE_KEY.test(args.deviceKey)) {
    throw new Error("Device key must be 0x + 64 lowercase hex");
  }
  if (args.items.length === 0) {
    throw new Error("Nothing to seal");
  }
  if (
    args.fixedNonceForTests !== undefined &&
    args.fixedNonceForTests.length !== NONCE_BYTES
  ) {
    throw new Error("A nonce is 12 bytes");
  }
  const items = args.items.map(checkItem);
  const nonce =
    args.fixedNonceForTests ??
    globalThis.crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  const header = concat(
    new Uint8Array([SealedFormat.ITEMS, args.cls]),
    u32(args.gen),
    fromHex(args.deviceKey),
    nonce
  );
  const json = encoder.encode(canonicalJson({ items, v: 1 }));
  const ct = await subtle().encrypt(
    {
      name: "AES-GCM",
      iv: own(nonce),
      additionalData: itemsAad(args.wave, header),
    },
    await itemsKey(args.senderKey, args.wave, args.cls, args.gen),
    own(pad(json))
  );
  return concat(header, new Uint8Array(ct));
}

/**
 * Opens format 0x01 (the person's own devices, and tests).
 * @api
 */
export async function openSealedItems(args: {
  readonly wave: string;
  readonly bytes: Uint8Array;
  readonly senderKey: Uint8Array;
}): Promise<{
  cls: number;
  gen: number;
  deviceKey: string;
  items: SealedItem[];
}> {
  const { bytes } = args;
  if (
    bytes.length < ITEMS_HEADER_BYTES + TAG_BYTES ||
    bytes[0] !== SealedFormat.ITEMS
  ) {
    throw new Error("Not sealed items");
  }
  const cls = bytes[1] ?? 0;
  const gen = new DataView(bytes.buffer, bytes.byteOffset + 2, 4).getUint32(0);
  checkClassAndGeneration(cls, gen);
  const header = bytes.subarray(0, ITEMS_HEADER_BYTES);
  let plaintext: Uint8Array;
  try {
    plaintext = new Uint8Array(
      await subtle().decrypt(
        {
          name: "AES-GCM",
          iv: own(header.subarray(ITEMS_HEADER_BYTES - NONCE_BYTES)),
          additionalData: itemsAad(args.wave, header),
        },
        await itemsKey(args.senderKey, args.wave, cls, gen),
        own(bytes.subarray(ITEMS_HEADER_BYTES))
      )
    );
  } catch {
    throw new Error("Sealed items do not open with this key");
  }
  let parsed: unknown;
  let text: string;
  try {
    // Fatal decoding: invalid UTF-8 is refused, never replaced.
    text = decoder.decode(unpad(plaintext));
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Sealed items are not UTF-8 JSON");
  }
  // JSON can be any value: anything but an object is refused here.
  const doc =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { items?: unknown; v?: unknown })
      : null;
  if (
    doc?.v !== 1 ||
    !Array.isArray(doc.items) ||
    doc.items.length === 0 ||
    Object.keys(doc).length !== 2 ||
    canonicalJson(doc) !== text
  ) {
    throw new Error('Sealed items must be canonical {"items","v":1}');
  }
  return {
    cls,
    gen,
    deviceKey: toHex(bytes.subarray(6, 38)),
    items: doc.items.map(checkItem),
  };
}

// ---- Keys documents (format 0x02) and wraps ----

/** @api */
export const providerRecipient = (provider: Pick<ProviderPublicKey, "id">) =>
  `svc:${provider.id}`;

/**
 * Wraps a sender key to a provider key, for a `keys` record.
 * @api
 */
export async function wrapSenderKey(args: {
  readonly wave: string;
  readonly cls: number;
  readonly gen: number;
  readonly from: string;
  readonly recipient: ProviderPublicKey;
  readonly senderKey: Uint8Array;
  readonly ephemeralPrivateKey?: Uint8Array | undefined;
}): Promise<KeyWrap> {
  checkClassAndGeneration(args.cls, args.gen);
  const to = providerRecipient(args.recipient);
  const { enc, ct } = await hpkeSealBase({
    recipientPublicKey: args.recipient.publicKey,
    info: encoder.encode(
      `${WRAP_INFO}|${args.wave}|${args.cls}|${args.gen}|${args.from}|${to}`
    ),
    aad: EMPTY,
    plaintext: args.senderKey,
    ephemeralPrivateKey: args.ephemeralPrivateKey,
  });
  return {
    cls: args.cls,
    gen: args.gen,
    from: args.from,
    to,
    enc: toBase64Url(enc),
    ct: toBase64Url(ct),
  };
}

/** @api */
export function encodeKeysDocument(doc: KeysDocument): Uint8Array {
  return concat(
    new Uint8Array([SealedFormat.KEYS]),
    encoder.encode(canonicalJson(doc))
  );
}
