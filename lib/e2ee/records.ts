import type { HistorySummary } from "./history-order";
import type {
  ApiE2eeDeviceGrant,
  ApiE2eeNotifyHint,
  ApiE2eePlatform,
} from "./api-types";
import type { ImportedPayload } from "./imported-payload";
import type { Payload, PayloadAttachment } from "./payload";
import type { E2eeNoticeType } from "./notice-types";
import type { GroupMetadata, WasmLeaf } from "./wasm-types";

/** Records the engine persists per profile (contract 8.7). */

export interface StoredDevice {
  profileId: string;
  deviceKey: string;
  wallet: string;
  grant: ApiE2eeDeviceGrant;
  grantId: string;
  walletSignature: string;
  /** False until POST /e2ee/devices succeeded (the signature is kept). */
  registered: boolean;
  /**
   * NC8: set when a combined sign-in grant also granted this device's MLS
   * key; registration then goes through POST /e2ee/devices/login-grant with
   * this grant id, and no wallet prompt. `walletSignature` is the SIWE one.
   */
  loginGrantId?: string;
  /** True once the MLS credential is set and the first KeyPackages uploaded. */
  provisioned: boolean;
  label: string;
  platform: ApiE2eePlatform;
  createdAt: number;
  /** When the current last-resort KeyPackage was uploaded (ms). */
  lastResortAt: number | null;
  /** Which wallets this profile trusts for each person (engine/trust.ts). */
  trust?: StoredTrust;
  /**
   * A device of an earlier MLS suite, retired with its history kept (D172):
   * kept only for its trust pins until the next device replaces it.
   */
  retired?: boolean;
}

/**
 * Trust on first use for device owners. The server says which profile a
 * device belongs to; only the wallet signature on its grant is checked, so
 * each person's wallets are pinned when first seen and a device signed by any
 * other wallet waits for the user's explicit "Add device".
 */
export interface StoredTrust {
  /** profile id -> lowercase wallets pinned for that person. */
  wallets: Record<string, string[]>;
  /** Device keys the user added explicitly (new or unverified wallet). */
  approved: string[];
  /** Device keys whose new-wallet notice the user dismissed. */
  ignored: string[];
}

export interface StoredMember {
  deviceKey: string;
  profileId: string | null;
  leaf: number;
  identity: string;
}

export interface LeafActivity {
  /** Last commit by or adding the leaf (ms). */
  at: number;
  /** False when only the join time is known (history before joining). */
  known: boolean;
}

export interface PendingCommitRecord {
  epoch: number;
  entryHash: string;
  added: WasmLeaf[];
  removed: WasmLeaf[];
  metadataAfter: GroupMetadata | null;
  selfUpdate: boolean;
  newEpochFp: string;
  createdAt: number;
}

/**
 * "restored": known only from a history backup, read-only until joined.
 * "superseded": made under an earlier MLS ciphersuite; history kept, MLS
 * state dropped, read-only (D172).
 */
export type StoredGroupStatus =
  | "active"
  | "invalid"
  | "left"
  | "removed"
  | "restored"
  | "superseded";

export interface StoredGroup {
  g: string;
  status: StoredGroupStatus;
  metadata: GroupMetadata;
  /** Last processed log seq. */
  cursor: number;
  epoch: number;
  epochFp: string;
  /** Recent epoch -> epoch_fp (split-view detection, 8.1.3). */
  epochFps: Record<string, string>;
  commitKey: string;
  members: StoredMember[];
  splitView: boolean;
  invalidReason: string | null;
  delayed: boolean;
  /** Device keys whose principal proposed leaving (STRICT removals). */
  leaving: string[];
  /** Device keys whose grant failed verification when seen (STRICT). */
  badGrants: string[];
  activity: Record<string, LeafActivity>;
  lastSelfUpdateAt: number;
  selfUpdateRequested: boolean;
  rosterCheckNeeded: boolean;
  /** Seqs of our own messages (we cannot decrypt our own ciphertext). */
  sentSeqs: number[];
  readSeq: number;
  /** Incremental summary of processed, persisted local history. */
  history?: HistorySummary;
  createdAt: number;
  joinedAt: number;
  updatedAt: number;
  pendingCommit: PendingCommitRecord | null;
  /** The MLS ciphersuite (absent: groups made before D172, 0x004F). */
  ciphersuite?: number;
  /** The conversation that continues this superseded one (this device). */
  successor?: string | null;
  /**
   * True while that successor is still being set up (members not added
   * yet): it is stored with the new group, but not reused or shown until
   * the creation finished.
   */
  successorPending?: boolean;
  /** The superseded conversation this one continues (this device). */
  predecessor?: string | null;
}

export interface StoredNotice {
  type: E2eeNoticeType;
  actorProfileId: string | null;
  targetProfileIds: string[];
  detail?: string;
}

/** One signed payload exactly as received, enough for a verifiable report. */
export interface SignedVersion {
  epoch: number;
  body: string;
  sig: string;
  senderDeviceKey: string;
}

export interface StoredMessage {
  id: string;
  g: string;
  seq: number;
  kind: "message" | "notice";
  senderProfileId: string | null;
  senderDeviceKey: string | null;
  ts: number;
  serverTs: number;
  text: string;
  mentions: string[];
  reply: string | null;
  /** Includes the per-file key material; never leaves the engine. */
  attachments: PayloadAttachment[];
  editedAt: number | null;
  deleted: boolean;
  reactions: Record<string, string[]>;
  sigOk: boolean;
  undecryptable: boolean;
  pending: boolean;
  notice?: StoredNotice;
  /** Epoch and exact body bytes (base64) + sig64 for verifiable reports. */
  epoch: number | null;
  body: string | null;
  sig: string | null;
  /**
   * The latest applied edit's own signed `edit` payload, the version the
   * reader sees. Null when that edit has no signed copy (this device's own
   * edit). Absent on messages never edited, and on ones edited before this
   * field existed.
   */
  latestEdit?: SignedVersion | null;
  /** Set when the message was moved from an unencrypted DM (D146). */
  imported?: ImportedPayload;
  /**
   * Set on an own message that was never sent and no longer will be from
   * here (D172: its conversation was superseded while it was still queued).
   * Local only; `pending` is false. The text stays until the user resends
   * it in the conversation that continues this one, or deletes it.
   */
  unsent?: { reason: StoredUnsentReason; at: number };
}

/** Why an own message stayed unsent (see StoredMessage.unsent). */
export type StoredUnsentReason = "suite_upgrade";

export interface SealedOutboxMessage {
  epoch: number;
  data: string;
  epochFp: string;
}

export interface StoredOutboxItem {
  id: string;
  g: string;
  payload: Payload;
  notify: ApiE2eeNotifyHint[];
  createdAt: number;
  /** The ciphertext last submitted (lets a crashed send be recognized). */
  sealed: SealedOutboxMessage | null;
}
