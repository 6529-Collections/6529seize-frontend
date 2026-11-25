import { bytesToHex, hexToBytes, type Hex } from "viem";
import { publicKeyId } from "@/lib/chain/codec/ids";
import { createStore, del, get, set } from "@/lib/storage/idb-keyval";

/**
 * This browser's session key for one identity: an Ed25519 key (keyType 2)
 * whose private half never leaves the browser. A CAPABILITY_GRANT signed by
 * the identity's wallet lets it sign PROFILE_REPLACE and RATING_SET (and,
 * from rule version 7, VOTE_SET and POLL_BALLOT_SET), within the grant's
 * budgets, until the grant ends.
 */
export interface StoredSessionKey {
  /** Lowercase principal id. */
  readonly principalId: Hex;
  readonly keyId: Hex;
  readonly publicKeyHex: Hex;
  /** Non-extractable; IndexedDB keeps it by structured clone. */
  readonly keyPair: CryptoKeyPair;
  /** The grant that enrolled it: the CAPABILITY_GRANT's object id. */
  readonly grantId: Hex;
  readonly expiresAtMs: number;
  /**
   * The operations its grant lists. Keys kept before votes reached the
   * chain have none here: they sign PROFILE_REPLACE and RATING_SET only.
   */
  readonly ops?: readonly number[] | undefined;
}

const ED25519 = { name: "Ed25519" } as const;
const KEY_TYPE_ED25519 = 2;

let store: ReturnType<typeof createStore> | null = null;
const getStore = () => {
  store ??= createStore("6529-chain-session-keys", "keys");
  return store;
};

const getSubtle = (): SubtleCrypto | null =>
  (globalThis as { readonly crypto?: Partial<Crypto> }).crypto?.subtle ?? null;

/** Whether this browser can hold a non-extractable Ed25519 key. */
export async function canHoldSessionKey(): Promise<boolean> {
  const subtle = getSubtle();
  if (!subtle || typeof indexedDB === "undefined") {
    return false;
  }
  try {
    await subtle.generateKey(ED25519, false, ["sign", "verify"]);
    return true;
  } catch {
    return false;
  }
}

/** A new key pair and its keyId, `H("6529.KeyId.v1", 2, keccak256(pk))`. */
export async function createSessionKeyPair(): Promise<{
  readonly keyPair: CryptoKeyPair;
  readonly publicKeyHex: Hex;
  readonly keyId: Hex;
}> {
  const subtle = getSubtle();
  if (!subtle) {
    throw new Error("This browser can't hold a session key.");
  }
  const keyPair = await subtle.generateKey(ED25519, false, ["sign", "verify"]);
  const raw = await subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyHex = bytesToHex(new Uint8Array(raw));
  return {
    keyPair,
    publicKeyHex,
    keyId: publicKeyId(KEY_TYPE_ED25519, publicKeyHex),
  };
}

/** Signs a 32-byte txId with the session key (64 bytes, Ed25519). */
export async function signWithSessionKey(
  privateKey: CryptoKey,
  txId: Hex
): Promise<Hex> {
  const subtle = getSubtle();
  if (!subtle) {
    throw new Error("This browser can't hold a session key.");
  }
  const signature = await subtle.sign(
    ED25519,
    privateKey,
    new Uint8Array(hexToBytes(txId))
  );
  return bytesToHex(new Uint8Array(signature));
}

const keyOf = (principalId: Hex): string => principalId.toLowerCase();

export const sessionKeyStore = {
  read: async (principalId: Hex): Promise<StoredSessionKey | null> => {
    const record = await get<StoredSessionKey>(keyOf(principalId), getStore());
    return record ?? null;
  },
  write: (record: StoredSessionKey): Promise<void> =>
    set(keyOf(record.principalId), record, getStore()),
  remove: (principalId: Hex): Promise<void> =>
    del(keyOf(principalId), getStore()),
};
