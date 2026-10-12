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

import type { WasmModule } from "@/lib/e2ee/wasm-types";
import {
  MLS_WASM_MANIFEST,
  loadMlsWasm,
  type MlsDevice,
  type MlsWasmExports,
} from "@/lib/e2ee/wasm";

type Json = Record<string, any>;

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
const parse = (s: string): Json => JSON.parse(s) as Json;
const handle = (seed: string): string => keccak256(toBytes(`group-${seed}`));
const DAY = 24 * 3600;

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
    { epoch: number; commitKey: string; items: Json[] }
  >();

  create(g: string, commitKey: string): void {
    this.groups.set(g, { epoch: 0, commitKey, items: [] });
  }

  submitEntry(g: string, entry: Json): number {
    const group = this.groups.get(g);
    if (!group) throw new Error("no group");
    if (entry["epoch"] !== group.epoch) throw new Error("E2EE_EPOCH_CONFLICT");
    const data = b64ToBytes(entry["data"]);
    expect(keccak256(data)).toBe(entry["entry_hash"]);
    expect(entry["padded_len"]).toBe(data.length);
    const digest = mls.entryDigest(
      g,
      entry["epoch"],
      entry["kind"],
      entry["entry_hash"],
      entry["epoch_commitment"],
      entry["next_commit_key"],
      entry["padded_len"]
    );
    if (
      !mls.verifyEd25519(
        group.commitKey,
        hexToBytes(digest),
        entry["signature"]
      )
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
    if (entry["kind"] === "commit") {
      group.epoch += 1;
      group.commitKey = entry["next_commit_key"];
    }
    return seq;
  }

  sendMessage(g: string, msg: Json): number {
    const group = this.groups.get(g);
    if (!group) throw new Error("no group");
    if (msg["epoch"] !== group.epoch) throw new Error("E2EE_EPOCH_STALE");
    const seq = group.items.length + 1;
    group.items.push({
      seq,
      type: "message",
      epoch: msg["epoch"],
      data: msg["data"],
      epoch_fp: msg["epoch_fp"],
    });
    return seq;
  }

  itemsAfter(g: string, seq: number): Json[] {
    return (this.groups.get(g)?.items ?? []).filter((i) => i["seq"] > seq);
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
    return parse(this.device.createKeyPackages(1, false, 30 * DAY))[0]["data"];
  }

  summary(g: string): Json {
    return parse(this.device.groupSummary(g));
  }

  createGroup(ds: DeliveryService, g: string, kind: "dm" | "group"): Json {
    const summary = parse(this.device.createGroup(g, metadata(g, kind)));
    ds.create(g, summary["commit_key"]);
    this.cursor.set(g, 0);
    return summary;
  }

  commit(ds: DeliveryService, g: string, ops: Json): Json {
    this.sync(ds, g);
    const result = parse(this.device.createCommit(g, JSON.stringify(ops)));
    ds.submitEntry(g, result["entry"]);
    const own = this.sync(ds, g);
    expect(own[0]?.["kind"]).toBe("own");
    return result;
  }

  join(ds: DeliveryService, g: string, welcomeB64: string): Json {
    const staged = parse(this.device.joinWelcome(g, b64ToBytes(welcomeB64)));
    expect(staged["g"]).toBe(g);
    const summary = parse(this.device.acceptWelcome(g));
    expect(summary["commit_key"]).toBe(staged["commit_key"]);
    this.cursor.set(g, ds.length(g));
    return summary;
  }

  send(ds: DeliveryService, g: string, text: string): number {
    this.sync(ds, g);
    const body = new TextEncoder().encode(
      JSON.stringify({ v: 1, t: "msg", id: "00", ts: 1, text })
    );
    return ds.sendMessage(g, parse(this.device.encryptMessage(g, body)));
  }

  sync(ds: DeliveryService, g: string): Json[] {
    const out: Json[] = [];
    for (const item of ds.itemsAfter(g, this.cursor.get(g) ?? 0)) {
      if (item["type"] === "entry") {
        const result = parse(this.device.processEntry(g, JSON.stringify(item)));
        if (result["kind"] === "commit") {
          if (!result["self_removed"]) {
            expect(result["declared_ok"]).toBe(true);
          }
          this.device.acceptStaged(g);
        }
        out.push(result);
      } else {
        try {
          out.push(parse(this.device.decryptMessage(g, JSON.stringify(item))));
        } catch (error) {
          if (!String(error).includes("E2EE_WASM:OWN_MESSAGE")) throw error;
        }
      }
      this.cursor.set(g, item["seq"]);
      if (this.summary(g)["active"] === false) break;
    }
    return out;
  }
}

const text = (msg: Json): string =>
  (JSON.parse(Buffer.from(msg["body"], "base64").toString("utf8")) as Json)[
    "text"
  ];

describe("mls wasm module", () => {
  it("matches the engine's module interface and reports its facts", () => {
    const asEngineModule: WasmModule = mls;
    expect(typeof asEngineModule.MlsDevice.create).toBe("function");
    const info = parse(mls.moduleInfo());
    expect(info["openmls"]).toBe("0.9.1");
    expect(info["ciphersuite"]).toBe(1);
    expect(info["metadata_extension"]).toBe(0xf529);
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
    expect(result["added"][0]["device_key"]).toBe(bob.device.deviceKey());
    expect(result["entry"]["kind"]).toBe("commit");
    const joined = bob.join(ds, g, result["welcome"]);
    expect(joined["epoch"]).toBe(1);
    expect(joined["epoch_fp"]).toBe(alice.summary(g)["epoch_fp"]);
    expect(joined["metadata"]["kind"]).toBe("dm");

    alice.send(ds, g, "hello bob");
    const [fromAlice] = bob.sync(ds, g);
    expect(text(fromAlice!)).toBe("hello bob");
    expect(fromAlice!["sig_ok"]).toBe(true);
    expect(fromAlice!["sender"]["device_key"]).toBe(alice.device.deviceKey());
    // The inner signature is verifiable with the helpers (reports, 7.9).
    const body = b64ToBytes(fromAlice!["body"]);
    expect(
      mls.verifyEd25519(
        alice.device.deviceKey(),
        hexToBytes(mls.messageDigest(g, fromAlice!["epoch"], body)),
        fromAlice!["sig"]
      )
    ).toBe(true);

    bob.send(ds, g, "hello alice");
    expect(text(alice.sync(ds, g)[0]!)).toBe("hello alice");

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
    bob.join(ds, g, added["welcome"]);
    carol.join(ds, g, added["welcome"]);
    expect(alice.summary(g)["members"]).toHaveLength(3);

    carol.send(ds, g, "hi from carol");
    expect(text(alice.sync(ds, g)[0]!)).toBe("hi from carol");
    expect(text(bob.sync(ds, g)[0]!)).toBe("hi from carol");

    // Rename via metadata in its own commit.
    alice.commit(ds, g, {
      metadata: JSON.parse(metadata(g, "group", "Friends")),
    });
    expect(bob.sync(ds, g)[0]!["metadata_after"]["name"]).toBe("Friends");
    carol.sync(ds, g);

    // Remove carol.
    const removal = alice.commit(ds, g, {
      remove_device_keys: [carol.device.deviceKey()],
    });
    expect(removal["removed"][0]["device_key"]).toBe(carol.device.deviceKey());
    const [staged] = bob.sync(ds, g);
    expect(staged!["removed"][0]["device_key"]).toBe(carol.device.deviceKey());
    expect(carol.sync(ds, g)[0]!["self_removed"]).toBe(true);
    expect(carol.summary(g)["active"]).toBe(false);

    const seq = alice.send(ds, g, "carol is gone");
    expect(text(bob.sync(ds, g)[0]!)).toBe("carol is gone");
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
    expect(bob.summary(g)["metadata"]["name"]).toBe("Friends");
    bob.send(ds, g, "after reload");
    expect(text(alice.sync(ds, g)[0]!)).toBe("after reload");
    alice.send(ds, g, "to reloaded bob");
    expect(text(bob.sync(ds, g)[0]!)).toBe("to reloaded bob");
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
      alice.commit(ds, g, { add_key_packages: [bob.keyPackage()] })["welcome"]
    );
    const result = parse(
      alice.device.createCommit(g, JSON.stringify({ self_update: true }))
    );
    const forged = { ...result["entry"], type: "entry" };
    const mallory = mls.MlsDevice.create();
    const digest = mls.entryDigest(
      g,
      forged["epoch"],
      "commit",
      forged["entry_hash"],
      forged["epoch_commitment"],
      forged["next_commit_key"],
      forged["padded_len"]
    );
    forged["signature"] = mallory.signDigest(hexToBytes(digest));
    expect(() => bob.device.processEntry(g, JSON.stringify(forged))).toThrow(
      /^E2EE_WASM:BAD_SIGNATURE:/
    );
    const tampered = {
      ...result["entry"],
      data: bytesToB64(b64ToBytes(result["entry"]["data"]).reverse()),
    };
    expect(() => bob.device.processEntry(g, JSON.stringify(tampered))).toThrow(
      /^E2EE_WASM:BAD_ENTRY:/
    );
    expect(
      parse(bob.device.processEntry(g, JSON.stringify(result["entry"])))[
        "declared_ok"
      ]
    ).toBe(true);
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
