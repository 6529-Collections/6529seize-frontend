import { bytesToHex, hexToBytes, type Hex } from "viem";

const ED25519 = { name: "Ed25519" } as const;

let supportPromise: Promise<boolean> | null = null;

// Typed as optional: insecure contexts and some runtimes lack WebCrypto.
const getSubtle = (): SubtleCrypto | null =>
  (globalThis as { readonly crypto?: Partial<Crypto> }).crypto?.subtle ?? null;

/** Copies hex into a buffer WebCrypto accepts in every realm. */
const toBytes = (hex: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array(hexToBytes(hex as Hex));

async function detectEd25519Support(): Promise<boolean> {
  const subtle = getSubtle();
  if (!subtle) {
    return false;
  }
  try {
    const pair = await subtle.generateKey(ED25519, false, ["sign", "verify"]);
    return "privateKey" in pair && "publicKey" in pair;
  } catch {
    return false;
  }
}

/** Whether this browser can hold a non-extractable Ed25519 key (cached). */
export function isEd25519Supported(): Promise<boolean> {
  supportPromise ??= detectEd25519Support();
  return supportPromise;
}

/** Creates a key pair whose private key never leaves the browser. */
export async function generateDeviceKeyPair(): Promise<{
  readonly keyPair: CryptoKeyPair;
  readonly publicKeyHex: Hex;
}> {
  const subtle = getSubtle();
  if (!subtle) {
    throw new Error("WebCrypto is unavailable");
  }
  const keyPair = await subtle.generateKey(ED25519, false, ["sign", "verify"]);
  // Public keys stay exportable even when the pair is non-extractable.
  const raw = await subtle.exportKey("raw", keyPair.publicKey);
  return { keyPair, publicKeyHex: bytesToHex(new Uint8Array(raw)) };
}

/** Signs the 32 raw bytes of an event id. */
export async function signEventId(
  privateKey: CryptoKey,
  eventId: Hex
): Promise<Hex> {
  const subtle = getSubtle();
  if (!subtle) {
    throw new Error("WebCrypto is unavailable");
  }
  const signature = await subtle.sign(ED25519, privateKey, toBytes(eventId));
  return bytesToHex(new Uint8Array(signature));
}

/** Verifies an Ed25519 signature over the raw bytes of an event id. */
export async function verifyEventIdSignature({
  publicKeyHex,
  eventId,
  signatureHex,
}: {
  readonly publicKeyHex: string;
  readonly eventId: string;
  readonly signatureHex: string;
}): Promise<boolean> {
  const subtle = getSubtle();
  if (!subtle) {
    return false;
  }
  try {
    const publicKey = await subtle.importKey(
      "raw",
      toBytes(publicKeyHex),
      ED25519,
      false,
      ["verify"]
    );
    return await subtle.verify(
      ED25519,
      publicKey,
      toBytes(signatureHex),
      toBytes(eventId)
    );
  } catch {
    return false;
  }
}
