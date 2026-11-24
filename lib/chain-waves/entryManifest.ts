import { sha256 } from "js-sha256";
import type { Hex } from "viem";
import type { ApiCompetitionSignature } from "@/generated/models/ApiCompetitionSignature";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { canonicalCompetitionJson } from "@/services/wallet-signatures/competition-signature";
import { DropHasher } from "@/utils/drop-hasher";
import { DocClass, docBytes, docCid, docCommitment } from "./docs";

/**
 * The entry manifest, version 1: the document a SUBMISSION_CREATE commits to
 * (docClass 8, P40 5.2). The chain keeps only its commitment
 * (`manifestHash`) and its CID (`contentCid`); the gateway's document store
 * keeps the bytes under that CID.
 *
 * Bytes: canonical JSON (keys sorted by UTF-16 code units, no whitespace)
 * and a newline, as every waves document (docs.ts).
 *   manifestHash = H("6529.OffchainDoc.v1", uint8 8, bytes32 nonce32,
 *                    bytes32 keccak256(bytes))
 *   contentCid   = 0x01 0x55 0x12 0x20 || sha256(bytes)
 * where nonce32 is `nonce` followed by 16 zero bytes.
 *
 * Fields:
 *   v          1
 *   kind       "entry"
 *   nonce      the fresh 128-bit nonce, 0x and 32 hex digits
 *   decision   the chain decisionId the entry goes to
 *   wave       the decision's chain waveId
 *   author     the author's principalId (the transaction's principal)
 *   created_at when the author's browser made the manifest, ms
 *   consent    the author's signature over the entry and the terms, or null
 *              when the wave asks for none (below)
 * Every other field is the entry as 6529.io's create-drop request carries
 * it, under 6529.io's own names, so 6529.io's index reads native and
 * imported entries alike: `wave_id` (6529.io's wave id), `drop_type`
 * ("PARTICIPATORY"), `title`, `parts` ([{ content, media: [{ url,
 * mime_type, media_upload_id? }], quoted_drop?, attachments? }]),
 * `metadata` ([{ data_key, data_value }]), `referenced_nfts`,
 * `mentioned_users`, and when the request has them `mentioned_waves`,
 * `mentioned_groups`, `hide_link_preview`, `collaborator_ids` and
 * `is_additional_action_promised`. The Memes submission's fields (meme
 * name, artist, traits, payment_info, airdrop_config, allowlist_batches,
 * additional_media, commentary, about_artist, additional_action_plan, the
 * proposal frame) are its `metadata` rows, as 6529.io stores them. The
 * request's proof fields (`signature`, `signature_message`,
 * `signer_address`, `is_safe_signature`, `client_drop_id`,
 * `device_signature`) are not entry fields; the ones a consent needs are
 * in `consent`. Undefined members are left out.
 *
 * consent: { scheme, terms, terms_sha256, config_version, signer_address,
 *   is_safe_signature, client_drop_id, signature_message, signature }
 *   scheme "6529-competition-v1": 6529.io's competition ENTRY_CREATE
 *     signature (personal_sign of `signature_message`, a 6529-competition-v1
 *     envelope). Its `payload_hash` is sha256 of the competition canonical
 *     JSON of `{ drop: <entry fields> + { signature: null }, drop_id: null }`.
 *     `config_version` is the competition's, whose terms were accepted.
 *   scheme "6529-drop": 6529.io's drop signature, as POST /drops checks it:
 *     DropHasher's sha256 over <entry fields> + `signer_address` +
 *     `client_drop_id` and `is_safe_signature` (each when not null) +
 *     `terms_of_service` = `terms` (when set); signed as the hash, or as
 *     `signature_message` when that is set.
 *   `terms` is the terms text the author accepted, `terms_sha256` 0x and
 *   sha256 of it (null without terms). `signer_address` is the wallet as
 *   the signed request or envelope wrote it, case and all: DropHasher hashes
 *   it as written, so a lowercased one could not rebuild the drop signature.
 *   Compare it with other addresses case-insensitively. `consentPayload`
 *   below rebuilds what each scheme's signature covers from the manifest.
 */

export const ENTRY_MANIFEST_VERSION = 1;

export type EntryConsentScheme = "6529-competition-v1" | "6529-drop";

export interface EntryConsent {
  readonly scheme: EntryConsentScheme;
  readonly terms: string | null;
  readonly terms_sha256: string | null;
  readonly config_version: number | null;
  /** As signed, case and all (compare case-insensitively). */
  readonly signer_address: string;
  /** Null when the signed request had no `is_safe_signature`. */
  readonly is_safe_signature: boolean | null;
  readonly client_drop_id: string | null;
  readonly signature_message: string | null;
  readonly signature: string;
}

/** The entry as 6529.io's create-drop request carries it, proofs left out. */
export type EntryFields = Readonly<Record<string, unknown>>;

export interface EntryManifest extends Readonly<Record<string, unknown>> {
  readonly v: 1;
  readonly kind: "entry";
  readonly nonce: Hex;
  readonly decision: Hex;
  readonly wave: Hex;
  readonly author: Hex;
  readonly created_at: number;
  readonly consent: EntryConsent | null;
}

const ENVELOPE_KEYS: ReadonlySet<string> = new Set([
  "v",
  "kind",
  "nonce",
  "decision",
  "wave",
  "author",
  "created_at",
  "consent",
]);

/** Request fields that prove who sent a drop rather than describe it. */
const PROOF_KEYS: ReadonlySet<string> = new Set([
  "signature",
  "signature_message",
  "signer_address",
  "is_safe_signature",
  "client_drop_id",
  "device_signature",
]);

/** A JSON round trip: undefined members go, as on the wire. */
const wire = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const termsHash = (terms: string | null): string | null =>
  terms ? `0x${sha256(terms)}` : null;

/** The entry fields of a create-drop request. */
export function entryFieldsOf(request: ApiCreateDropRequest): EntryFields {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(wire(request))) {
    if (!PROOF_KEYS.has(key) && !ENVELOPE_KEYS.has(key)) {
      fields[key] = value;
    }
  }
  return fields;
}

/** The entry fields of a manifest: everything but its envelope. */
export function entryFieldsOfManifest(manifest: EntryManifest): EntryFields {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(manifest)) {
    if (!ENVELOPE_KEYS.has(key)) {
      fields[key] = value;
    }
  }
  return fields;
}

/** The payload 6529.io's competition ENTRY_CREATE signature covers. */
export const competitionEntryPayload = (fields: EntryFields) => ({
  drop: { ...fields, signature: null },
  drop_id: null,
});

/** The consent of a competition entry from its ENTRY_CREATE signature. */
export function competitionConsent(input: {
  readonly signature: ApiCompetitionSignature;
  readonly terms: string | null;
  readonly configVersion: number;
  readonly isSafeSignature: boolean;
}): EntryConsent {
  const envelope = JSON.parse(input.signature.message) as {
    readonly actor_wallet?: unknown;
  };
  if (typeof envelope.actor_wallet !== "string") {
    throw new Error("The consent signature names no wallet.");
  }
  return {
    scheme: "6529-competition-v1",
    terms: input.terms,
    terms_sha256: termsHash(input.terms),
    config_version: input.configVersion,
    signer_address: envelope.actor_wallet,
    is_safe_signature: input.isSafeSignature,
    client_drop_id: null,
    signature_message: input.signature.message,
    signature: input.signature.signature,
  };
}

/**
 * The consent a signed create-drop request carries (the wave's terms
 * signature from the composer), or null when the request is unsigned.
 */
export function dropConsent(
  request: ApiCreateDropRequest,
  terms: string | null
): EntryConsent | null {
  if (!request.signature || !request.signer_address) {
    return null;
  }
  return {
    scheme: "6529-drop",
    terms,
    terms_sha256: termsHash(terms),
    config_version: null,
    signer_address: request.signer_address,
    is_safe_signature: request.is_safe_signature ?? null,
    client_drop_id: request.client_drop_id ?? null,
    signature_message: request.signature_message ?? null,
    signature: request.signature,
  };
}

/**
 * What the consent's signature covers, rebuilt from the manifest: for
 * "6529-competition-v1" the competition canonical JSON whose sha256 is the
 * envelope's `payload_hash`; for "6529-drop" DropHasher's hex hash. Null
 * without a consent. 6529.io's index checks a native entry's consent with
 * this.
 */
export function consentPayload(manifest: EntryManifest): string | null {
  const { consent } = manifest;
  if (consent === null) {
    return null;
  }
  const fields = entryFieldsOfManifest(manifest);
  if (consent.scheme === "6529-competition-v1") {
    return canonicalCompetitionJson(competitionEntryPayload(fields));
  }
  const signed = {
    ...fields,
    ...(consent.client_drop_id === null
      ? {}
      : { client_drop_id: consent.client_drop_id }),
    signer_address: consent.signer_address,
    ...(consent.is_safe_signature === null
      ? {}
      : { is_safe_signature: consent.is_safe_signature }),
  } as unknown as ApiCreateDropRequest;
  return new DropHasher().hash({ drop: signed, termsOfService: consent.terms });
}

/** The 16 nonce bytes of a committed document's 32-byte nonce word. */
const nonceBytes = (nonceWord: Hex): Hex => {
  if (!/^0x[0-9a-f]{32}0{32}$/i.test(nonceWord)) {
    throw new RangeError("not a 128-bit document nonce");
  }
  return nonceWord.slice(0, 34).toLowerCase() as Hex;
};

/** The nonce word a manifest's commitment takes. */
export const manifestNonceWord = (manifest: EntryManifest): Hex =>
  `${manifest.nonce.toLowerCase()}${"00".repeat(16)}` as Hex;

/** A version 1 manifest for a create-drop request's entry. */
export function buildEntryManifest(input: {
  readonly nonceWord: Hex;
  readonly decisionId: Hex;
  readonly waveId: Hex;
  readonly author: Hex;
  readonly createdAt: number;
  readonly fields: EntryFields;
  readonly consent: EntryConsent | null;
}): EntryManifest {
  return wire({
    ...input.fields,
    v: ENTRY_MANIFEST_VERSION,
    kind: "entry",
    nonce: nonceBytes(input.nonceWord),
    decision: input.decisionId.toLowerCase() as Hex,
    wave: input.waveId.toLowerCase() as Hex,
    author: input.author.toLowerCase() as Hex,
    created_at: input.createdAt,
    consent: input.consent,
  });
}

/** The manifest's bytes, its commitment and its CID. */
export function entryManifestDocument(manifest: EntryManifest): {
  readonly bytes: Uint8Array;
  readonly manifestHash: Hex;
  readonly contentCid: Hex;
} {
  const bytes = docBytes(manifest);
  return {
    bytes,
    manifestHash: docCommitment(
      DocClass.ENTRY_MANIFEST,
      manifestNonceWord(manifest),
      bytes
    ),
    contentCid: docCid(bytes),
  };
}
