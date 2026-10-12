import type { E2eeApiClient } from "./api";
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
  deviceKey: string;
  label: string;
  platform: "web" | "desktop" | "phone";
  createdAt: number;
  lastSeenAt: number | null;
  expiresAt: number; // ms
  revokedAt: number | null;
  isThisDevice: boolean;
  verified: boolean;
}

export interface E2eeMember {
  profileId: string;
  handle: string | null;
  pfp: string | null;
  wallets: string[];
  isAdmin: boolean;
  devices: { deviceKey: string; label: string; verified: boolean }[];
}

export interface E2eeAttachment {
  blob: string;
  mime: string;
  size: number;
  name: string;
  width?: number;
  height?: number; // key material stays inside the engine
}

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
  notice?: {
    type: E2eeNoticeType;
    actorProfileId: string | null;
    targetProfileIds: string[];
    detail?: string;
  };
}

export interface E2eeConversation {
  g: string;
  kind: "dm" | "group";
  name: string | null;
  members: E2eeMember[];
  admins: string[];
  createdBy: string;
  epoch: number;
  safetyCode: string; // "abcd efgh ijkl mnop"
  status: "active" | "invalid" | "left" | "removed";
  delayed: boolean; // 8.3 stall banner
  splitView: boolean; // 8.6 alarm
  lastMessage: E2eeMessage | null;
  unread: number;
  mentions: number;
  updatedAt: number;
}

export interface E2eeEligibility {
  profileId: string;
  status: "OK" | "POLICY" | "BLOCKED" | "NO_DEVICES";
}

export interface E2eeEngine {
  // state (synchronous snapshots) + change subscription
  getStatus(): E2eeEngineStatus;
  getError(): string | null;
  getThisDevice(): E2eeDeviceInfo | null;
  getDevices(): E2eeDeviceInfo[];
  getConversations(): E2eeConversation[]; // sorted by updatedAt desc
  getConversation(g: string): E2eeConversation | null;
  getMessages(g: string): E2eeMessage[]; // ascending seq, notices interleaved
  subscribe(listener: () => void): () => void; // any state change

  // lifecycle
  enroll(): Promise<void>; // the single wallet prompt
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
  edit(g: string, id: string, text: string): Promise<void>;
  remove(g: string, id: string): Promise<void>; // delete own message
  react(g: string, id: string, reaction: string, on: boolean): Promise<void>;
  markRead(g: string): void;
  rename(g: string, name: string): Promise<void>;
  addMembers(g: string, profileIds: string[]): Promise<E2eeEligibility[]>;
  removeMember(g: string, profileId: string): Promise<void>;
  setAdmin(g: string, profileId: string, admin: boolean): Promise<void>;
  leave(g: string): Promise<void>;
  restart(g: string): Promise<string>; // new group, same people
  report(g: string, id: string, reason: string, notes?: string): Promise<void>;
  search(query: string, g?: string): Promise<E2eeMessage[]>; // local only
  getAttachment(g: string, id: string, blob: string): Promise<Blob>;

  // devices
  revokeDevice(deviceKey: string): Promise<void>;
  renameThisDevice(label: string): Promise<void>; // local label only is fine
}

export interface E2eeEngineDeps {
  profileId: string;
  wallet: string; // active profile + its connected wallet
  origin: string; // grant origin (2.1)
  platform: "web" | "desktop" | "phone";
  signTypedData: (td: {
    domain: object;
    types: object;
    primaryType: string;
    message: object;
  }) => Promise<string>;
  api: E2eeApiClient; // REST client (section 4)
  resolveProfiles: (
    profileIds: string[]
  ) => Promise<
    Record<string, { handle: string | null; pfp: string | null; wallets: string[] }>
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
}

export type E2eeEngineOptions = E2eeEngineDeps & E2eeEngineExtraDeps;

export interface E2eeEngineExt extends E2eeEngine {
  /** Tells the engine which conversation is on screen (5 s polling). */
  setOpenConversation(g: string | null): void;
  /** Resolves when no operation or background task is in flight. */
  idle(): Promise<void>;
}
