import type { LookupReads } from "./lookup-reads";
import type { HistoryPageOptions } from "./history-order";
import type { E2eeApiClient } from "./api";
import type { BackupHistory } from "./backup/format";
import type { BackupStateStore } from "./backup/state";
import type { E2eeNoticeType } from "./notice-types";
import type { E2eeStorage } from "./storage";
import type { WasmModule } from "./wasm-types";

/** Contract section 12: the engine <-> UI interface. */

export type { E2eeNoticeType } from "./notice-types";
export type { E2eeApiClient } from "./api";
export type { E2eeStorage } from "./storage";
export type { WasmModule } from "./wasm-types";

export type E2eeEngineStatus =
  | "unsupported" // no WebAssembly / IndexedDB / WebCrypto
  | "loading"
  | "needs-enrollment" // no device for this profile on this browser
  | "enrolling" // waiting for the wallet signature / registration
  | "ready"
  | "device-limit" // 10 active devices: user must revoke one
  | "error";

export interface E2eeDeviceInfo {
  linkedAuthorProof?: boolean;
  authorProofGrantId?: string;
  deviceKey: string;
  label: string;
  platform: "web" | "desktop" | "phone";
  createdAt: number;
  lastSeenAt: number | null;
  expiresAt: number; // ms
  revokedAt: number | null;
  isThisDevice: boolean;
  verified: boolean;
  /** Lowercase wallet that signed the device's grant. */
  wallet?: string;
  /**
   * Another active device of this profile that this device does not add to
   * chats until the user adds it ("Add device", `trustDevice`): its wallet
   * is not this device's and was not added here, or its signature could not
   * be checked here.
   */
  needsApproval?: boolean;
}

export interface E2eeMember {
  profileId: string;
  handle: string | null;
  pfp: string | null;
  wallets: string[];
  isAdmin: boolean;
  /**
   * `wallet`: the lowercase wallet that signed the device's grant.
   * `walletPinned`: this device trusts that wallet for the member (pinned
   * for them, added with "Add device", or, for the viewer, this device's own
   * wallet); false means the device is not yet verified for the member here.
   */
  devices: {
    deviceKey: string;
    label: string;
    verified: boolean;
    wallet: string | null;
    walletPinned?: boolean;
  }[];
}

/**
 * A device of a chat member that is not added automatically: its grant is
 * signed by a wallet not yet trusted for that person ("new-wallet"), or by a
 * contract wallet whose signature this device could not check ("unverified").
 */
export interface E2eeUntrustedDevice {
  profileId: string;
  deviceKey: string;
  wallet: string; // lowercase
  reason: "new-wallet" | "unverified";
}

export interface E2eeAttachment {
  blob: string;
  mime: string;
  size: number;
  name: string;
  width?: number;
  height?: number; // key material stays inside the engine
}

/** Why an own message stayed unsent (E2eeMessage.unsent). */
export type E2eeUnsentReason = "suite_upgrade";

export interface E2eeMessage {
  id: string;
  g: string;
  seq: number;
  kind: "message" | "notice";
  senderProfileId: string | null;
  senderDeviceKey: string | null;
  ts: number; // sender clock
  serverTs: number; // server receive time
  text: string;
  mentions: string[];
  reply: string | null;
  attachments: E2eeAttachment[];
  editedAt: number | null;
  deleted: boolean;
  reactions: Record<string, string[]>; // reaction -> profileIds
  sigOk: boolean;
  undecryptable: boolean;
  pending: boolean; // in the outbox, not yet sequenced
  /**
   * An own message that was never sent and no longer sends (`pending` is
   * false). "suite_upgrade": its conversation was superseded (D172) while
   * the message was still queued. Its text is kept on this device only; the
   * user may resend it in the conversation that continues this one
   * (`resendUnsent`) or delete it (`discardUnsent`). Absent otherwise.
   */
  unsent?: E2eeUnsentReason;
  notice?: {
    type: E2eeNoticeType;
    actorProfileId: string | null;
    targetProfileIds: string[];
    detail?: string;
    /** device_added: not yet verified for its owner on this device. */
    unverified?: boolean;
  };
  /** Moved from an unencrypted 6529.io DM: not verified (D146). */
  imported?: E2eeImported;
}

/**
 * Where an imported message came from. Its author and times are what
 * 6529's server copy said; the importer's device signed the message, so
 * nothing proves the original author wrote it.
 */
export interface E2eeImported {
  waveId: string;
  dropId: string;
  part: number;
  serialNo: number;
  authorProfileId: string;
  authorHandle: string | null;
  createdAt: number; // ms, original server time
  editedAt: number | null;
  replyToDropId: string | null;
  /** Images and files of the original that were not carried over. */
  mediaNotImported: number;
  reactions: [string, number][];
}

/** One signed payload a report would send, as its reader would see it. */
export interface E2eeReportVersion {
  text: string;
  attachmentNames: string[];
}

export interface E2eeReportPreview {
  /** The version shown now (the latest edit); null when it can't be sent. */
  latest: E2eeReportVersion | null;
  /** The original of an edited message; null when not edited or unavailable. */
  original: E2eeReportVersion | null;
}

/** What keeps a delayed conversation waiting (8.3). */
export type E2eeDelayedReason = "send" | "commit";

export interface E2eeConversation {
  /** Original DM peer, retained for titles after leaving; not a current member. */
  dmPeer?: E2eeMember | null;
  g: string;
  kind: "dm" | "group";
  name: string | null;
  members: E2eeMember[];
  admins: string[];
  createdBy: string;
  epoch: number;
  safetyCode: string; // "abcd efgh ijkl mnop"
  /**
   * "restored": from a history backup, read-only until this device joins.
   * "superseded": made under an earlier MLS ciphersuite (D172). Its history
   * stays readable on this device; it is read-only (sends, edits, reactions
   * and membership changes throw E2EE_SUPERSEDED) and continues through
   * `restart(g)`.
   */
  status: "active" | "invalid" | "left" | "removed" | "restored" | "superseded";
  /** The group's MLS ciphersuite (79 = 0x004F, 78 = 0x004E); informational. */
  ciphersuite?: number;
  /** The conversation that continues this one, when this device knows it. */
  successor?: string | null;
  /** The conversation this one continues (the reverse of `successor`). */
  predecessor?: string | null;
  delayed: boolean; // 8.3 stall banner
  /**
   * What keeps a delayed conversation waiting (8.3), null when not delayed:
   * "commit" while a required group change cannot go through, "send" while
   * only sending keeps failing. A stuck commit wins when both apply.
   */
  delayedReason: E2eeDelayedReason | null;
  splitView: boolean; // 8.6 alarm
  /** Members' devices waiting for "Add device" or "Ignore". */
  untrustedDevices: E2eeUntrustedDevice[];
  lastMessage: E2eeMessage | null;
  /** Notification cursor; excludes pending sends, own messages and imported history. */
  lastIncomingSeq?: number;
  unread: number;
  mentions: number;
  /** A local saved-history read failed; retry without changing MLS state. */
  historyError?: boolean;
  updatedAt: number;
}

/** The shared DM admission code behind POLICY or BLOCKED (legacy DM codes). */
export type E2eeEligibilityReason =
  | "DM_RECIPIENT_NOT_ACCEPTING"
  | "DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY"
  | "DM_RECIPIENT_GROUP_MEMBERS_ONLY"
  | "DM_SENDER_BLOCKED_RECIPIENT";

export interface E2eeEligibility {
  profileId: string;
  /** BLOCKED is only the viewer's own block; a recipient's block is POLICY. */
  status: "OK" | "POLICY" | "BLOCKED" | "NO_DEVICES";
  reason?: E2eeEligibilityReason | null;
}

export interface E2eeEngine {
  // state (synchronous snapshots) + change subscription
  getStatus(): E2eeEngineStatus;
  getError(): string | null;
  getThisDevice(): E2eeDeviceInfo | null;
  getDevices(): E2eeDeviceInfo[];
  /** Whether the server accepts encrypted attachments (false until known). */
  getAttachmentsEnabled(): boolean;
  getConversations(): E2eeConversation[]; // sorted by updatedAt desc
  getConversation(g: string): E2eeConversation | null;
  getMessages(g: string): E2eeMessage[]; // ascending seq, notices interleaved
  subscribe(listener: () => void): () => void; // any state change

  // lifecycle
  enroll(): Promise<void>; // the single wallet prompt
  /**
   * Whether turning on needs a brand-new device key: no stored device that
   * enroll() would resume, register or renew. A combined sign-in (NC8) can
   * grant that key instead of the grant prompt.
   */
  needsNewDevice(): Promise<boolean>;
  /**
   * NC8: registers the key a combined sign-in just stored for this profile,
   * with no wallet prompt, and starts the engine. Resolves with the status
   * it settles on; a refused sign-in grant leaves "needs-enrollment".
   */
  enrollWithLoginGrant(): Promise<E2eeEngineStatus>;
  /**
   * Non-null while this device has moved off an earlier MLS ciphersuite and
   * not enrolled again (status "needs-enrollment"): the UI shows upgrade
   * copy instead of first-time copy. `superseded` counts the read-only
   * conversations kept. Enrolling still asks for at most one signature
   * (`needsNewDevice()` is true, so a combined sign-in can carry it).
   */
  getUpgrade(): { superseded: number } | null;
  sync(): Promise<void>; // pull inbox + all groups now
  dispose(): void;

  // conversations
  checkEligibility(profileIds: string[]): Promise<E2eeEligibility[]>;
  createConversation(input: {
    profileIds: string[];
    kind: "dm" | "group";
    name?: string | null;
  }): Promise<string>; // g
  findDm(profileId: string): string | null;
  send(
    g: string,
    input: {
      text: string;
      mentions?: string[];
      reply?: string | null;
      files?: File[];
    }
  ): Promise<void>;
  /**
   * Sends one message moved from an unencrypted DM, labelled imported, with
   * no push notification. A copy already in the chat is skipped (resolves).
   */
  sendImported(
    g: string,
    input: {
      text: string;
      imported: E2eeImported;
      reply?: string | null;
      files?: File[];
    }
  ): Promise<void>;
  edit(g: string, id: string, text: string): Promise<void>;
  remove(g: string, id: string): Promise<void>; // delete own message
  react(g: string, id: string, reaction: string, on: boolean): Promise<void>;
  markRead(g: string): void;
  rename(g: string, name: string): Promise<void>;
  addMembers(g: string, profileIds: string[]): Promise<E2eeEligibility[]>;
  removeMember(g: string, profileId: string): Promise<void>;
  setAdmin(g: string, profileId: string, admin: boolean): Promise<void>;
  leave(g: string): Promise<void>;
  /**
   * A new conversation with the same people (and name), returning its g. On
   * a "superseded" conversation it creates the successor on the current
   * suite once and returns the same g on later calls; people who cannot be
   * reached yet are skipped (E2EE_NO_DEVICES when nobody can be).
   */
  restart(g: string): Promise<string>;
  /**
   * Sends a copy of an unsent message (E2eeMessage.unsent) in the
   * conversation that continues `g` (as `restart(g)` returns it: the linked
   * successor, or a new one), then deletes the unsent copy. Text, mentions
   * and attachments are kept; a reply is not (it points into `g`). Returns
   * where the copy went. Concurrent calls share one send; a message that is
   * not unsent fails with E2EE_NO_MESSAGE.
   */
  resendUnsent(g: string, id: string): Promise<{ g: string; id: string }>;
  /** Deletes an unsent message from this device; nothing was ever sent. */
  discardUnsent(g: string, id: string): Promise<void>;
  /**
   * Reports the message as the reader sees it (its latest edit, signed);
   * `includeOriginal` also sends the original of an edited message.
   */
  report(
    g: string,
    id: string,
    reason: string,
    notes?: string,
    options?: { includeOriginal?: boolean }
  ): Promise<void>;
  /** Exactly what `report` would send, decoded from the signed payloads. */
  reportPreview(
    g: string,
    id: string
  ): E2eeReportPreview | Promise<E2eeReportPreview>;
  /** Page already processed local records; no ciphertext replay. */
  loadHistory?(
    g: string,
    options?: HistoryPageOptions & { around?: string }
  ): Promise<void>;
  getMessage?(g: string, id: string): Promise<E2eeMessage | null>;
  findImportedMessage?(
    g: string,
    waveId: string,
    dropId: string,
    part: number
  ): Promise<E2eeMessage | null>;
  search(
    query: string,
    g?: string,
    signal?: AbortSignal
  ): Promise<E2eeMessage[]>; // local only
  getAttachment(
    g: string,
    id: string,
    blob: string,
    signal?: AbortSignal
  ): Promise<Blob>;

  // devices
  /** Trusts the device's wallet for its owner, then adds it to their chats. */
  trustDevice(deviceKey: string): Promise<void>;
  /** Dismisses the untrusted-device notice; the device stays out. */
  ignoreDevice(deviceKey: string): Promise<void>;
  revokeDevice(deviceKey: string): Promise<void>;
  renameThisDevice(label: string): Promise<void>; // local label only is fine
}

export interface E2eeEngineDeps {
  profileId: string;
  wallet: string; // active profile + its connected wallet
  origin: string; // grant origin (2.1)
  platform: "web" | "desktop" | "phone";
  /** Name for a new device, e.g. "Chrome on Windows" (default "Device"). */
  deviceLabel?: string;
  signTypedData: (td: {
    domain: object;
    types: object;
    primaryType: string;
    message: object;
  }) => Promise<string>;
  api: E2eeApiClient; // REST client (section 4)
  lookupReads?: LookupReads;
  resolveProfiles: (
    profileIds: string[],
    resume?: boolean
  ) => Promise<
    Record<
      string,
      { handle: string | null; pfp: string | null; wallets: string[] }
    >
  >;
  verifyContractSignature?: (
    wallet: string,
    hash: string,
    sig: string
  ) => Promise<boolean>;
  onWake?: (
    listener: (event: { type: string; data: unknown }) => void
  ) => () => void; // WS events
  now?: () => number;
  storage?: E2eeStorage; // default IndexedDB; tests inject memory
  loadWasm?: () => Promise<WasmModule>; // default fetch public/e2ee wasm
}

// ---------------------------------------------------------------------------
// Engine-side extensions (optional; the section 12 interface above is complete
// without them).
// ---------------------------------------------------------------------------

export interface E2eeTimerHandle {
  readonly id: number;
}

/** Timer source; tests inject a controllable one. */
export interface E2eeScheduler {
  setTimeout(callback: () => void, ms: number): E2eeTimerHandle;
  clearTimeout(handle: E2eeTimerHandle): void;
}

export interface E2eeEngineExtraDeps {
  scheduler?: E2eeScheduler;
  /** Uniform [0, 1) source for the 8.4/8.5 random delays. */
  random?: () => number;
  /** Clients refuse Welcomes whose inviter they blocked (7.1). */
  isBlocked?: (profileId: string) => boolean | Promise<boolean>;
  /** Disable the polling fallback (tests drive sync explicitly). */
  polling?: boolean;
  /**
   * Called once when a write is refused because another engine (another tab)
   * persisted newer state. The engine has stopped; the host should dispose it.
   */
  onStateConflict?: () => void;
  /** Encrypted-backup local state; wiped with the device (default IndexedDB). */
  backupState?: BackupStateStore;
}

export type E2eeEngineOptions = E2eeEngineDeps & E2eeEngineExtraDeps;

export interface E2eeEngineExt extends E2eeEngine {
  /** Copies of the decrypted history for the encrypted backup (no MLS state). */
  backupHistory(): Promise<BackupHistory> | BackupHistory;
  /** Merges restored history; unknown chats are added read-only. */
  importBackupHistory(
    history: BackupHistory
  ): Promise<{ conversations: number; messages: number }>;
  /** Tells the engine which conversation is on screen (5 s polling). */
  setOpenConversation(g: string | null): void;
  /** Resolves when no operation or background task is in flight. */
  idle(): Promise<void>;
}
