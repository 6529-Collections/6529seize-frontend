/* tslint:disable */
/* eslint-disable */

/**
 * One MLS device (signature key, credential, groups).
 */
export class MlsDevice {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    acceptStaged(g: string): string;
    acceptWelcome(g: string): string;
    createCommit(g: string, ops_json: string): string;
    createGroup(g: string, metadata_json: string): string;
    createKeyPackages(count: number, last_resort: boolean, lifetime_secs: number): string;
    /**
     * Fresh device with a new Ed25519 signature key.
     */
    static create(): MlsDevice;
    credentialIdentity(): string | undefined;
    decryptMessage(g: string, item_json: string): string;
    deleteGroup(g: string): void;
    deviceKey(): string;
    discardPending(g: string): void;
    /**
     * Addition to contract 10: drop pending Remove proposals targeting
     * `deviceKey` (engine policy rejection, 8.1.2). Returns the count.
     */
    dropProposals(g: string, device_key: string): number;
    encryptMessage(g: string, body: Uint8Array): string;
    /**
     * Signer, credential, all MLS storage, pending and staged commits.
     * Staged Welcomes are not included (call `joinWelcome` again).
     */
    exportState(): Uint8Array;
    groupSummary(g: string): string;
    hasGroup(g: string): boolean;
    joinWelcome(g: string, welcome: Uint8Array, ratchet_tree?: Uint8Array | null): string;
    /**
     * Restore a device from `exportState()` bytes.
     */
    static load(state: Uint8Array): MlsDevice;
    mergePending(g: string): string;
    processEntry(g: string, item_json: string): string;
    proposeRemove(g: string, device_keys_json: string): string;
    rejectStaged(g: string): void;
    rejectWelcome(g: string): void;
    setCredential(identity: string): void;
    signDigest(digest32: Uint8Array): string;
    signRoster(g: string, device_keys_json: string): string;
}

/**
 * `entry_digest` (contract 3.2). `kind`: "commit" | "proposal".
 */
export function entryDigest(g: string, epoch: number, kind: string, entry_hash: string, epoch_commitment: string, next_commit_key: string, padded_len: number): string;

/**
 * `epochCommitment = H("6529.MlsEpoch.v1", g, epoch, groupContextHash)`.
 */
export function epochCommitment(g: string, epoch: number, group_context_hash: string): string;

/**
 * `TAG(name) = keccak256(ASCII name)`, `0x` hex.
 */
export function hTag(name: string): string;

/**
 * `H("6529.MlsMessageSig.v1", bytes32 g, uint32 epoch, bytes32 keccak256(body))`.
 */
export function messageDigest(g: string, epoch: number, body: Uint8Array): string;

/**
 * Module facts: versions and constants (JSON).
 */
export function moduleInfo(): string;

/**
 * `H("6529.MlsDeviceRevoke.v1", bytes32 target, bytes32 revoker, uint64 revokedAt)`.
 */
export function revokeDigest(target: string, revoker: string, revoked_at_secs: bigint | number): string;

/**
 * Roster repair digest (ApiE2eeRosterRepairRequest).
 */
export function rosterDigest(g: string, epoch: number, device_keys_json: string): string;

/**
 * Strict Ed25519 verification over 32 raw digest bytes. False on any
 * malformed input.
 */
export function verifyEd25519(public_key: string, digest32: Uint8Array, sig: string): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_mlsdevice_free: (a: number, b: number) => void;
    readonly entryDigest: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
    readonly epochCommitment: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly hTag: (a: number, b: number, c: number) => void;
    readonly messageDigest: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_acceptStaged: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_acceptWelcome: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_create: (a: number) => void;
    readonly mlsdevice_createCommit: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_createGroup: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_createKeyPackages: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly mlsdevice_credentialIdentity: (a: number, b: number) => void;
    readonly mlsdevice_decryptMessage: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_deleteGroup: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_deviceKey: (a: number, b: number) => void;
    readonly mlsdevice_discardPending: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_dropProposals: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_encryptMessage: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_exportState: (a: number, b: number) => void;
    readonly mlsdevice_groupSummary: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_hasGroup: (a: number, b: number, c: number) => number;
    readonly mlsdevice_joinWelcome: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly mlsdevice_load: (a: number, b: number, c: number) => void;
    readonly mlsdevice_mergePending: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_processEntry: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_proposeRemove: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly mlsdevice_rejectStaged: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_rejectWelcome: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_setCredential: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_signDigest: (a: number, b: number, c: number, d: number) => void;
    readonly mlsdevice_signRoster: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly moduleInfo: (a: number) => void;
    readonly revokeDigest: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly rosterDigest: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly verifyEd25519: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly __wbindgen_export: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
