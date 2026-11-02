/**
 * @jest-environment node
 *
 * Loads the real OpenMLS WebAssembly module from public/e2ee and drives the
 * contract section 10 API end to end through a minimal delivery service that
 * applies the server checks of contract 3.2.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { encodeAbiParameters, keccak256, toBytes } from "viem";

import { E2EE_CIPHERSUITE } from "@/lib/e2ee/grant";
import type { MsgPayload } from "@/lib/e2ee/payload";
import type {
  GroupMetadata,
  WasmCommitOps,
  WasmCommitResult,
  WasmDecrypted,
  WasmEncrypted,
  WasmEntryOut,
  WasmGroupSummary,
  WasmKeyPackage,
  WasmModule,
  WasmProcessResult,
  WasmStagedSummary,
  WasmWelcomeSummary,
} from "@/lib/e2ee/wasm-types";
import {
  MLS_WASM_MANIFEST,
  loadMlsWasm,
  type MlsDevice,
  type MlsWasmExports,
} from "@/lib/e2ee/wasm";

/** groupSummary and acceptWelcome also report whether the device is a member. */
type GroupSummary = WasmGroupSummary & { active: boolean };

/** Log items as the minimal delivery service below stores and serves them. */
type EntryItem = WasmEntryOut & {
  seq: number;
  type: "entry";
  roster_add: string[];
  roster_remove: string[];
};
type MessageItem = WasmEncrypted & { seq: number; type: "message" };
type LogItem = EntryItem | MessageItem;

/** What Client.sync yields: processEntry results and decrypted messages. */
type SyncResult = WasmProcessResult | WasmDecrypted;

interface ModuleInfo {
  openmls: string;
  ciphersuite: number;
  metadata_extension: number;
}

const wasmBytes = (): Uint8Array =>
  new Uint8Array(
    readFileSync(join(process.cwd(), "public", MLS_WASM_MANIFEST.file))
  );

const b64ToBytes = (b64: string): Uint8Array =>
  new Uint8Array(Buffer.from(b64, "base64"));
const bytesToB64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64");
const hexToBytes = (hex: string): Uint8Array =>
  new Uint8Array(Buffer.from(hex.replace(/^0x/, ""), "hex"));
const parse = <T>(s: string): T => JSON.parse(s) as T;
const handle = (seed: string): string => keccak256(toBytes(`group-${seed}`));
const DAY = 24 * 3600;

const defined = <T>(value: T | null | undefined, what: string): T => {
  if (value === null || value === undefined) throw new Error(`no ${what}`);
  return value;
};
const kindOf = (result: SyncResult | undefined): string | undefined =>
  result !== undefined && "kind" in result ? result.kind : undefined;
const asMessage = (result: SyncResult | undefined): WasmDecrypted => {
  if (result === undefined || "kind" in result) {
    throw new Error(`not a decrypted message: ${JSON.stringify(result)}`);
  }
  return result;
};
const asStaged = (result: SyncResult | undefined): WasmStagedSummary => {
  if (result === undefined || !("kind" in result) || result.kind !== "commit") {
    throw new Error(`not a staged commit: ${JSON.stringify(result)}`);
  }
  return result;
};

const metadata = (
  g: string,
  kind: "dm" | "group",
  name: string | null = null
) =>
  JSON.stringify({
    v: 1,
    g,
    kind,
    name,
    admins: ["p-alice"],
    created_by: "p-alice",
    history: "from_join",
  });

let mls: MlsWasmExports;

beforeAll(async () => {
  mls = await loadMlsWasm({ bytes: wasmBytes() });
});

/** Minimal delivery service (contract 3.2 and messages for the current epoch). */
class DeliveryService {
  private readonly groups = new Map<
    string,
    { epoch: number; commitKey: string; items: LogItem[] }
  >();

  create(g: string, commitKey: string): void {
    this.groups.set(g, { epoch: 0, commitKey, items: [] });
  }

  submitEntry(g: string, entry: WasmEntryOut): number {
    const group = this.groups.get(g);
    if (!group) throw new Error("no group");
    if (entry.epoch !== group.epoch) throw new Error("E2EE_EPOCH_CONFLICT");
    const data = b64ToBytes(entry.data);
    expect(keccak256(data)).toBe(entry.entry_hash);
    expect(entry.padded_len).toBe(data.length);
    const digest = mls.entryDigest(
      g,
      entry.epoch,
      entry.kind,
      entry.entry_hash,
      entry.epoch_commitment,
      entry.next_commit_key,
      entry.padded_len
    );
    if (
      !mls.verifyEd25519(group.commitKey, hexToBytes(digest), entry.signature)
    ) {
      throw new Error("E2EE_BAD_SIGNATURE");
    }
    const seq = group.items.length + 1;
    group.items.push({
      ...entry,
      seq,
      type: "entry",
      roster_add: [],
      roster_remove: [],
    });
    if (entry.kind === "commit") {
      group.epoch += 1;
      group.commitKey = entry.next_commit_key;
    }
    return seq;
  }

  sendMessage(g: string, msg: WasmEncrypted): number {
    const group = this.groups.get(g);
    if (!group) throw new Error("no group");
    if (msg.epoch !== group.epoch) throw new Error("E2EE_EPOCH_STALE");
    const seq = group.items.length + 1;
    group.items.push({
      seq,
      type: "message",
      epoch: msg.epoch,
      data: msg.data,
      epoch_fp: msg.epoch_fp,
    });
    return seq;
  }

  itemsAfter(g: string, seq: number): LogItem[] {
    return (this.groups.get(g)?.items ?? []).filter((i) => i.seq > seq);
  }

  length(g: string): number {
    return this.groups.get(g)?.items.length ?? 0;
  }
}

class Client {
  device: MlsDevice;
  readonly cursor = new Map<string, number>();

  constructor(readonly name: string) {
    this.device = mls.MlsDevice.create();
    const wallet = keccak256(toBytes(name)).slice(0, 42);
    this.device.setCredential(
      `6529-e2ee-v1:${wallet}:${keccak256(toBytes(`grant-${name}`))}`
    );
  }

  keyPackage(): string {
    return parse<WasmKeyPackage[]>(
      this.device.createKeyPackages(1, false, 30 * DAY)
    )[0]!.data;
  }

  summary(g: string): GroupSummary {
    return parse<GroupSummary>(this.device.groupSummary(g));
  }

  createGroup(
    ds: DeliveryService,
    g: string,
    kind: "dm" | "group"
  ): GroupSummary {
    const summary = parse<GroupSummary>(
      this.device.createGroup(g, metadata(g, kind))
    );
    ds.create(g, summary.commit_key);
    this.cursor.set(g, 0);
    return summary;
  }

  commit(ds: DeliveryService, g: string, ops: WasmCommitOps): WasmCommitResult {
    this.sync(ds, g);
    const result = parse<WasmCommitResult>(
      this.device.createCommit(g, JSON.stringify(ops))
    );
    ds.submitEntry(g, result.entry);
    const own = this.sync(ds, g);
    expect(kindOf(own[0])).toBe("own");
    return result;
  }

  join(ds: DeliveryService, g: string, welcomeB64: string): GroupSummary {
    const staged = parse<WasmWelcomeSummary>(
      this.device.joinWelcome(g, b64ToBytes(welcomeB64))
    );
    expect(staged.g).toBe(g);
    const summary = parse<GroupSummary>(this.device.acceptWelcome(g));
    expect(summary.commit_key).toBe(staged.commit_key);
    this.cursor.set(g, ds.length(g));
    return summary;
  }

  send(ds: DeliveryService, g: string, text: string): number {
    this.sync(ds, g);
    const body = new TextEncoder().encode(
      JSON.stringify({ v: 1, t: "msg", id: "00", ts: 1, text })
    );
    return ds.sendMessage(
      g,
      parse<WasmEncrypted>(this.device.encryptMessage(g, body))
    );
  }

  sync(ds: DeliveryService, g: string): SyncResult[] {
    const out: SyncResult[] = [];
    for (const item of ds.itemsAfter(g, this.cursor.get(g) ?? 0)) {
      if (item.type === "entry") {
        const result = parse<WasmProcessResult>(
          this.device.processEntry(g, JSON.stringify(item))
        );
        if (result.kind === "commit") {
          if (!result.self_removed) {
            expect(result.declared_ok).toBe(true);
          }
          this.device.acceptStaged(g);
        }
        out.push(result);
      } else {
        try {
          out.push(
            parse<WasmDecrypted>(
              this.device.decryptMessage(g, JSON.stringify(item))
            )
          );
        } catch (error) {
          if (!String(error).includes("E2EE_WASM:OWN_MESSAGE")) throw error;
        }
      }
      this.cursor.set(g, item.seq);
      if (this.summary(g).active === false) break;
    }
    return out;
  }
}

const text = (msg: WasmDecrypted): string =>
  parse<Pick<MsgPayload, "text">>(
    Buffer.from(msg.body, "base64").toString("utf8")
  ).text;

describe("mls wasm module", () => {
  it("matches the engine's module interface and reports its facts", () => {
    const asEngineModule: WasmModule = mls;
    expect(typeof asEngineModule.MlsDevice.create).toBe("function");
    const info = parse<ModuleInfo>(mls.moduleInfo());
    expect(info.openmls).toBe("0.9.1");
    // The module and the grant must agree on the one suite (0x004F, X-Wing).
    expect(info.ciphersuite).toBe(E2EE_CIPHERSUITE);
    expect(info.ciphersuite).toBe(0x004f);
    expect(info.metadata_extension).toBe(0xf529);
  });

  it("computes H/TAG digests identical to viem ABI encoding", () => {
    expect(mls.hTag("6529.MlsEpoch.v1")).toBe(
      keccak256(toBytes("6529.MlsEpoch.v1"))
    );
    const g = `0x${"11".repeat(32)}` as const;
    const body = toBytes('{"v":1}');
    const expected = keccak256(
      encodeAbiParameters(
        [
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "uint32" },
          { type: "bytes32" },
        ],
        [keccak256(toBytes("6529.MlsMessageSig.v1")), g, 5, keccak256(body)]
      )
    );
    expect(mls.messageDigest(g, 5, body)).toBe(expected);
    const target = `0x${"66".repeat(32)}` as const;
    const revoker = `0x${"77".repeat(32)}` as const;
    const revoke = keccak256(
      encodeAbiParameters(
        [
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "uint64" },
        ],
        [
          keccak256(toBytes("6529.MlsDeviceRevoke.v1")),
          target,
          revoker,
          1760000000n,
        ]
      )
    );
    expect(mls.revokeDigest(target, revoker, 1760000000n)).toBe(revoke);
    expect(mls.revokeDigest(target, revoker, 1760000000)).toBe(revoke);
  });

  it("signs digests with the device key", () => {
    const device = mls.MlsDevice.create();
    const digest = hexToBytes(keccak256(toBytes("digest")));
    const sig = device.signDigest(digest);
    expect(sig).toMatch(/^0x[0-9a-f]{128}$/);
    expect(mls.verifyEd25519(device.deviceKey(), digest, sig)).toBe(true);
    expect(
      mls.verifyEd25519(
        device.deviceKey(),
        hexToBytes(keccak256(toBytes("other"))),
        sig
      )
    ).toBe(false);
    expect(device.credentialIdentity()).toBeUndefined();
    expect(() => device.createKeyPackages(1, false, DAY)).toThrow(
      /^E2EE_WASM:NO_CREDENTIAL:/
    );
    device.free();
  });

  it("runs a two-party DM end to end", () => {
    const ds = new DeliveryService();
    const g = handle("dm");
    const alice = new Client("alice");
    const bob = new Client("bob");
    alice.createGroup(ds, g, "dm");
    const result = alice.commit(ds, g, {
      add_key_packages: [bob.keyPackage()],
    });
    expect(result.added[0]!.device_key).toBe(bob.device.deviceKey());
    expect(result.entry.kind).toBe("commit");
    const joined = bob.join(ds, g, defined(result.welcome, "welcome"));
    expect(joined.epoch).toBe(1);
    expect(joined.epoch_fp).toBe(alice.summary(g).epoch_fp);
    expect(joined.metadata.kind).toBe("dm");

    alice.send(ds, g, "hello bob");
    const fromAlice = asMessage(bob.sync(ds, g)[0]);
    expect(text(fromAlice)).toBe("hello bob");
    expect(fromAlice.sig_ok).toBe(true);
    expect(fromAlice.sender.device_key).toBe(alice.device.deviceKey());
    // The inner signature is verifiable with the helpers (reports, 7.9).
    const body = b64ToBytes(fromAlice.body);
    expect(
      mls.verifyEd25519(
        alice.device.deviceKey(),
        hexToBytes(mls.messageDigest(g, fromAlice.epoch, body)),
        defined(fromAlice.sig, "sig")
      )
    ).toBe(true);

    bob.send(ds, g, "hello alice");
    expect(text(asMessage(alice.sync(ds, g)[0]))).toBe("hello alice");

    expect(() => alice.device.createCommit(g, "{}")).toThrow(
      /^E2EE_WASM:BAD_INPUT:/
    );
    alice.device.createCommit(g, JSON.stringify({ self_update: true }));
    expect(() =>
      alice.device.createCommit(g, JSON.stringify({ self_update: true }))
    ).toThrow(/^E2EE_WASM:PENDING_EXISTS:/);
    alice.device.discardPending(g);
  });

  it("runs a three-person group with a removal and survives a reload", () => {
    const ds = new DeliveryService();
    const g = handle("group");
    const alice = new Client("alice");
    const bob = new Client("bob");
    const carol = new Client("carol");
    alice.createGroup(ds, g, "group");
    const added = alice.commit(ds, g, {
      add_key_packages: [bob.keyPackage(), carol.keyPackage()],
    });
    bob.join(ds, g, defined(added.welcome, "welcome"));
    carol.join(ds, g, defined(added.welcome, "welcome"));
    expect(alice.summary(g).members).toHaveLength(3);

    carol.send(ds, g, "hi from carol");
    expect(text(asMessage(alice.sync(ds, g)[0]))).toBe("hi from carol");
    expect(text(asMessage(bob.sync(ds, g)[0]))).toBe("hi from carol");

    // Rename via metadata in its own commit.
    alice.commit(ds, g, {
      metadata: parse<GroupMetadata>(metadata(g, "group", "Friends")),
    });
    expect(asStaged(bob.sync(ds, g)[0]).metadata_after.name).toBe("Friends");
    carol.sync(ds, g);

    // Remove carol.
    const removal = alice.commit(ds, g, {
      remove_device_keys: [carol.device.deviceKey()],
    });
    expect(removal.removed[0]!.device_key).toBe(carol.device.deviceKey());
    const staged = asStaged(bob.sync(ds, g)[0]);
    expect(staged.removed[0]!.device_key).toBe(carol.device.deviceKey());
    expect(asStaged(carol.sync(ds, g)[0]).self_removed).toBe(true);
    expect(carol.summary(g).active).toBe(false);

    const seq = alice.send(ds, g, "carol is gone");
    expect(text(asMessage(bob.sync(ds, g)[0]))).toBe("carol is gone");
    const late = ds.itemsAfter(g, seq - 1)[0]!;
    expect(() => carol.device.decryptMessage(g, JSON.stringify(late))).toThrow(
      /^E2EE_WASM:NOT_MEMBER:/
    );

    // Export, reload and keep messaging.
    const state = bob.device.exportState();
    expect(new TextDecoder().decode(state.slice(0, 8))).toBe("6529MLS1");
    const key = bob.device.deviceKey();
    bob.device.free();
    bob.device = mls.MlsDevice.load(state);
    expect(bob.device.deviceKey()).toBe(key);
    expect(bob.summary(g).metadata.name).toBe("Friends");
    bob.send(ds, g, "after reload");
    expect(text(asMessage(alice.sync(ds, g)[0]))).toBe("after reload");
    alice.send(ds, g, "to reloaded bob");
    expect(text(asMessage(bob.sync(ds, g)[0]))).toBe("to reloaded bob");
  });

  it("rejects entries not signed by the epoch commit key", () => {
    const ds = new DeliveryService();
    const g = handle("forged");
    const alice = new Client("alice");
    const bob = new Client("bob");
    alice.createGroup(ds, g, "dm");
    bob.join(
      ds,
      g,
      defined(
        alice.commit(ds, g, { add_key_packages: [bob.keyPackage()] }).welcome,
        "welcome"
      )
    );
    const result = parse<WasmCommitResult>(
      alice.device.createCommit(g, JSON.stringify({ self_update: true }))
    );
    const forged = { ...result.entry, type: "entry" };
    const mallory = mls.MlsDevice.create();
    const digest = mls.entryDigest(
      g,
      forged.epoch,
      "commit",
      forged.entry_hash,
      forged.epoch_commitment,
      forged.next_commit_key,
      forged.padded_len
    );
    forged.signature = mallory.signDigest(hexToBytes(digest));
    expect(() => bob.device.processEntry(g, JSON.stringify(forged))).toThrow(
      /^E2EE_WASM:BAD_SIGNATURE:/
    );
    const tampered = {
      ...result.entry,
      data: bytesToB64(b64ToBytes(result.entry.data).reverse()),
    };
    expect(() => bob.device.processEntry(g, JSON.stringify(tampered))).toThrow(
      /^E2EE_WASM:BAD_ENTRY:/
    );
    expect(
      asStaged(
        parse<WasmProcessResult>(
          bob.device.processEntry(g, JSON.stringify(result.entry))
        )
      ).declared_ok
    ).toBe(true);
  });

  it("never fetches a module itself: init takes verified bytes only", async () => {
    await jest.isolateModulesAsync(async () => {
      const { default: init } =
        await import("@/lib/e2ee/wasm/generated/mls_wasm");
      const fetchSpy = jest.spyOn(globalThis, "fetch");
      try {
        await expect(
          init({ module_or_path: "https://example.invalid/mls.wasm" })
        ).rejects.toThrow(/^E2EE_WASM:BAD_INPUT:/);
        await expect(init()).rejects.toThrow(/^E2EE_WASM:BAD_INPUT:/);
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  it("refuses a module whose hash does not match the manifest", async () => {
    await jest.isolateModulesAsync(async () => {
      const { loadMlsWasm: freshLoad } = await import("@/lib/e2ee/wasm");
      const bytes = wasmBytes();
      bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0xff;
      await expect(freshLoad({ bytes })).rejects.toThrow(
        /^E2EE_WASM:INTEGRITY:/
      );
      await expect(freshLoad({ bytes: bytes.slice(1) })).rejects.toThrow(
        /^E2EE_WASM:INTEGRITY:/
      );
    });
  });
});
