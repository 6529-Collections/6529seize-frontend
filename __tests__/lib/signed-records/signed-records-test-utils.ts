import VECTORS_JSON from "./signed-records-v1.json";
import type { SignedRecordEvent } from "@/lib/signed-records/record-event";

interface Rfc9180Vector {
  readonly info: string;
  readonly skEm: string;
  readonly pkEm: string;
  readonly skRm: string;
  readonly pkRm: string;
  readonly pt: string;
  readonly aad: string;
  readonly ct: string;
}

interface VectorInputs {
  readonly ed25519Seed: string;
  readonly deviceKey: string;
  readonly author: string;
  readonly authRef: string;
  readonly principal: string;
  readonly target: string;
  readonly senderKey: string;
  readonly sealNonce: string;
  readonly providerKeyId: string;
  readonly providerPrivateKey: string;
  readonly providerPublicKey: string;
  readonly wrapEphemeralPrivateKey: string;
}

interface VectorsFile {
  readonly rfc9180A1: Rfc9180Vector;
  readonly inputs: VectorInputs;
  readonly followRecord: SignedRecordEvent;
  readonly followUnset: SignedRecordEvent;
  readonly sealedSettings: {
    readonly event: SignedRecordEvent;
    readonly c: string;
  };
  readonly keys: {
    readonly event: SignedRecordEvent;
    readonly enc: string;
    readonly ct: string;
  };
}

/** The shared v1 vectors, the same file the backend tests read. */
export const RECORD_VECTORS = VECTORS_JSON as unknown as VectorsFile;

export const hexToBytes = (hex: string): Uint8Array =>
  new Uint8Array(Buffer.from(hex.replace(/^0x/, ""), "hex"));

export const bytesToHex = (bytes: Uint8Array): string =>
  `0x${Buffer.from(bytes).toString("hex")}`;

/** The `c` bytes of a SEALED vector body. */
export const sealedBodyBytes = (event: SignedRecordEvent): Uint8Array => {
  const body = JSON.parse(event.body ?? "{}") as { c: string };
  return new Uint8Array(Buffer.from(body.c, "base64url"));
};
