/**
 * Contract section 10: the OpenMLS WebAssembly module surface as the engine
 * sees it. Structured results are JSON strings; `mls-adapter.ts` parses them.
 */

export interface MlsDeviceHandle {
  exportState(): Uint8Array;
  deviceKey(): string;
  setCredential(identity: string): void;
  credentialIdentity(): string | undefined;
  signDigest(digest32: Uint8Array): string;
  createKeyPackages(
    count: number,
    lastResort: boolean,
    lifetimeSecs: number
  ): string;
  createGroup(g: string, metadataJson: string): string;
  groupSummary(g: string): string;
  hasGroup(g: string): boolean;
  deleteGroup(g: string): void;
  createCommit(g: string, opsJson: string): string;
  mergePending(g: string): string;
  discardPending(g: string): void;
  proposeRemove(g: string, deviceKeysJson: string): string;
  processEntry(g: string, itemJson: string): string;
  acceptStaged(g: string): string;
  rejectStaged(g: string): void;
  joinWelcome(
    g: string,
    welcome: Uint8Array,
    ratchetTree?: Uint8Array | null
  ): string;
  acceptWelcome(g: string): string;
  rejectWelcome(g: string): void;
  encryptMessage(g: string, body: Uint8Array): string;
  decryptMessage(g: string, itemJson: string): string;
  signRoster(g: string, deviceKeysJson: string): string;
  /**
   * Module addition to contract 10: drops pending Remove proposals that
   * target `deviceKey` (8.1.2 policy rejection). Returns the count.
   */
  dropProposals?(g: string, deviceKey: string): number;
  free?(): void;
}

export interface MlsDeviceStatic {
  create(): MlsDeviceHandle;
  load(state: Uint8Array): MlsDeviceHandle;
}

export interface WasmModule {
  MlsDevice: MlsDeviceStatic;
  hTag(name: string): string;
  verifyEd25519(pub: string, digest32: Uint8Array, sig: string): boolean;
  messageDigest(g: string, epoch: number, body: Uint8Array): string;
  revokeDigest(
    target: string,
    revoker: string,
    revokedAtSecs: bigint | number
  ): string;
  /** Module additions (cross-checks of the TS digests). */
  entryDigest?(
    g: string,
    epoch: number,
    kind: string,
    entryHash: string,
    epochCommitment: string,
    nextCommitKey: string,
    paddedLen: number
  ): string;
  rosterDigest?(g: string, epoch: number, deviceKeysJson: string): string;
  epochCommitment?(g: string, epoch: number, groupContextHash: string): string;
}

/** 3.5 group context extension value. */
export interface GroupMetadata {
  v: 1;
  g: string;
  kind: "dm" | "group";
  name: string | null;
  admins: string[];
  created_by: string;
  history: "from_join";
}

export interface WasmLeaf {
  leaf: number;
  device_key: string;
  identity: string;
}

export interface WasmPendingProposal {
  proposer: WasmLeaf;
  remove: WasmLeaf;
}

export interface WasmGroupSummary {
  g: string;
  epoch: number;
  /** Null once this device is no longer an active member. */
  epoch_fp: string;
  commit_key: string;
  own_device_key: string;
  own_leaf: number;
  metadata: GroupMetadata;
  members: WasmLeaf[];
  pending_proposals: WasmPendingProposal[];
}

export interface WasmCommitOps {
  add_key_packages?: string[];
  remove_device_keys?: string[];
  include_pending_proposals?: boolean;
  metadata?: GroupMetadata;
  self_update?: boolean;
}

export interface WasmEntryOut {
  kind: "commit" | "proposal";
  epoch: number;
  data: string;
  entry_hash: string;
  epoch_commitment: string;
  next_commit_key: string;
  signature: string;
  padded_len: number;
}

export interface WasmCommitResult {
  entry: WasmEntryOut;
  welcome: string | null;
  /** Present when the module emits the ratchet tree separately from the Welcome. */
  ratchet_tree?: string | null;
  added: WasmLeaf[];
  removed: WasmLeaf[];
  new_epoch: number;
  new_epoch_fp: string;
}

export interface WasmStagedSummary {
  kind: "commit";
  sender: WasmLeaf;
  added: WasmLeaf[];
  removed: WasmLeaf[];
  metadata_before: GroupMetadata;
  metadata_after: GroupMetadata;
  self_removed: boolean;
  new_epoch: number;
  /** Null when `self_removed` (the removed member cannot derive it). */
  new_epoch_fp: string | null;
  /** Null when `self_removed`. */
  declared_ok: boolean | null;
  /** Module addition: the committer's leaf after its update path, if any. */
  sender_leaf_after?: WasmLeaf | null;
}

export interface WasmProposalSummary {
  kind: "proposal";
  sender: WasmLeaf;
  remove: WasmLeaf | null;
  /** Module addition: the proposal was queued in the proposal store. */
  stored?: boolean;
  /** Module addition: our own proposal, now sequenced. */
  own?: boolean;
}

export interface WasmOwnSummary {
  kind: "own";
}

export type WasmProcessResult =
  | WasmStagedSummary
  | WasmProposalSummary
  | WasmOwnSummary;

export interface WasmWelcomeSummary {
  g: string;
  epoch: number;
  epoch_fp: string;
  metadata: GroupMetadata;
  members: WasmLeaf[];
  sender: WasmLeaf;
  commit_key: string;
}

export interface WasmEncrypted {
  epoch: number;
  data: string;
  epoch_fp: string;
}

export interface WasmDecrypted {
  sender: WasmLeaf;
  body: string;
  sig_ok: boolean;
  epoch: number;
  /** sig64 hex when the module exposes it (needed for verifiable reports). */
  sig?: string;
  /** Module addition: our epoch_fp for that epoch (split-view check). */
  epoch_fp?: string;
}

export interface WasmKeyPackage {
  data: string;
  ref: string;
  expires_at: number;
}

export interface WasmRosterSignature {
  epoch: number;
  signature: string;
}
