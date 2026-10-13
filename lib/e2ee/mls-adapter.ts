import { base64ToBytes } from "./bytes";
import type {
  GroupMetadata,
  MlsDeviceHandle,
  WasmCommitOps,
  WasmCommitResult,
  WasmDecrypted,
  WasmEncrypted,
  WasmEntryOut,
  WasmGroupSummary,
  WasmKeyPackage,
  WasmModule,
  WasmProcessResult,
  WasmRosterSignature,
  WasmWelcomeSummary,
} from "./wasm-types";

/** Error raised by the WASM module (message only; never contains plaintext). */
export class MlsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MlsError";
  }
}

const describe = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : "MLS operation failed";
};

function guard<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    throw new MlsError(describe(error));
  }
}

function parse(json: string): unknown {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    throw new MlsError("MLS module returned malformed JSON");
  }
}

/** Typed facade over one MlsDevice handle (contract section 10). */
export class MlsClient {
  readonly module: WasmModule;
  private readonly handle: MlsDeviceHandle;

  constructor(module: WasmModule, handle: MlsDeviceHandle) {
    this.module = module;
    this.handle = handle;
  }

  static create(module: WasmModule): MlsClient {
    return new MlsClient(
      module,
      guard(() => module.MlsDevice.create())
    );
  }

  static load(module: WasmModule, state: Uint8Array): MlsClient {
    return new MlsClient(
      module,
      guard(() => module.MlsDevice.load(state))
    );
  }

  exportState(): Uint8Array {
    return guard(() => this.handle.exportState());
  }

  deviceKey(): string {
    return guard(() => this.handle.deviceKey()).toLowerCase();
  }

  setCredential(identity: string): void {
    guard(() => {
      this.handle.setCredential(identity);
    });
  }

  credentialIdentity(): string | null {
    return guard(() => this.handle.credentialIdentity()) ?? null;
  }

  signDigest(digest32: Uint8Array): string {
    return guard(() => this.handle.signDigest(digest32));
  }

  createKeyPackages(
    count: number,
    lastResort: boolean,
    lifetimeSecs: number
  ): WasmKeyPackage[] {
    return parse(
      guard(() =>
        this.handle.createKeyPackages(count, lastResort, lifetimeSecs)
      )
    ) as WasmKeyPackage[];
  }

  createGroup(g: string, metadata: GroupMetadata): WasmGroupSummary {
    return parse(
      guard(() => this.handle.createGroup(g, JSON.stringify(metadata)))
    ) as WasmGroupSummary;
  }

  groupSummary(g: string): WasmGroupSummary {
    return parse(guard(() => this.handle.groupSummary(g))) as WasmGroupSummary;
  }

  hasGroup(g: string): boolean {
    return guard(() => this.handle.hasGroup(g));
  }

  deleteGroup(g: string): void {
    guard(() => {
      this.handle.deleteGroup(g);
    });
  }

  createCommit(g: string, ops: WasmCommitOps): WasmCommitResult {
    return parse(
      guard(() => this.handle.createCommit(g, JSON.stringify(ops)))
    ) as WasmCommitResult;
  }

  mergePending(g: string): WasmGroupSummary {
    return parse(guard(() => this.handle.mergePending(g))) as WasmGroupSummary;
  }

  discardPending(g: string): void {
    guard(() => {
      this.handle.discardPending(g);
    });
  }

  proposeRemove(g: string, deviceKeys: string[]): WasmEntryOut[] {
    return parse(
      guard(() => this.handle.proposeRemove(g, JSON.stringify(deviceKeys)))
    ) as WasmEntryOut[];
  }

  processEntry(g: string, item: object): WasmProcessResult {
    return parse(
      guard(() => this.handle.processEntry(g, JSON.stringify(item)))
    ) as WasmProcessResult;
  }

  acceptStaged(g: string): WasmGroupSummary {
    return parse(guard(() => this.handle.acceptStaged(g))) as WasmGroupSummary;
  }

  rejectStaged(g: string): void {
    guard(() => {
      this.handle.rejectStaged(g);
    });
  }

  joinWelcome(
    g: string,
    welcomeB64: string,
    ratchetTreeB64: string | null
  ): WasmWelcomeSummary {
    const welcome = base64ToBytes(welcomeB64);
    const tree = ratchetTreeB64 ? base64ToBytes(ratchetTreeB64) : null;
    return parse(
      guard(() => this.handle.joinWelcome(g, welcome, tree))
    ) as WasmWelcomeSummary;
  }

  acceptWelcome(g: string): WasmGroupSummary {
    return parse(guard(() => this.handle.acceptWelcome(g))) as WasmGroupSummary;
  }

  rejectWelcome(g: string): void {
    guard(() => {
      this.handle.rejectWelcome(g);
    });
  }

  encryptMessage(g: string, body: Uint8Array): WasmEncrypted {
    return parse(
      guard(() => this.handle.encryptMessage(g, body))
    ) as WasmEncrypted;
  }

  decryptMessage(g: string, item: object): WasmDecrypted {
    return parse(
      guard(() => this.handle.decryptMessage(g, JSON.stringify(item)))
    ) as WasmDecrypted;
  }

  /** Drops pending Remove proposals targeting `deviceKey` (if supported). */
  dropProposals(g: string, deviceKey: string): number {
    const drop = this.handle.dropProposals?.bind(this.handle);
    return drop ? guard(() => drop(g, deviceKey)) : 0;
  }

  signRoster(g: string, deviceKeys: string[]): WasmRosterSignature {
    return parse(
      guard(() => this.handle.signRoster(g, JSON.stringify(deviceKeys)))
    ) as WasmRosterSignature;
  }

  verifyEd25519(pub: string, digest32: Uint8Array, sig: string): boolean {
    try {
      return this.module.verifyEd25519(pub, digest32, sig);
    } catch {
      return false;
    }
  }

  dispose(): void {
    try {
      this.handle.free?.();
    } catch {
      // Already freed.
    }
  }
}
