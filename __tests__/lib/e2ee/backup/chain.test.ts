/**
 * @jest-environment node
 *
 * History backup v2 hash chain: the server cannot reorder, replay,
 * duplicate or drop chunks, a restarted device continues the chain, and
 * compaction and multi-device writers keep a verifiable chain.
 */
import type { E2eeBackupApi } from "@/lib/e2ee/backup/api";
import { linkChunk, type ChainTip } from "@/lib/e2ee/backup/chain";
import {
  type ChunkLink,
  chunkHash,
  deriveChunkKey,
  newBackupKey,
  sealChunk,
  ZERO_CHAIN_HASH,
} from "@/lib/e2ee/backup/crypto";
import type {
  BackupGroupRecord,
  BackupHistory,
  BackupMessageRecord,
} from "@/lib/e2ee/backup/format";
import {
  type BackupEngine,
  E2eeBackupManager,
  type PreparedBackup,
} from "@/lib/e2ee/backup/manager";
import {
  type BackupLocalState,
  type BackupStateStore,
  createMemoryBackupStateStore,
} from "@/lib/e2ee/backup/state";
import {
  base64ToBytes,
  bytesToBase64,
  randomHex,
  utf8Encode,
} from "@/lib/e2ee/bytes";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import {
  createFakeBackupServer,
  type FakeBackupServer,
} from "../support/fakeBackupServer";

const PROFILE = "alice";
const G = `0x${"ab".repeat(16)}`;

const idleScheduler = {
  setTimeout: () => 0,
  clearTimeout: () => undefined,
};

const errorCode = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return (error as { code?: string }).code ?? "unknown";
  }
  return null;
};

// -- chain unit checks ----------------------------------------------------------

async function verify(
  key: CryptoKey,
  backupId: string,
  chunks: readonly Uint8Array[]
): Promise<"ok" | "corrupt"> {
  let tip: ChainTip | null = null;
  for (const data of chunks) {
    const linked = await linkChunk(key, backupId, tip, data, "restore");
    if (!linked) {
      return "corrupt";
    }
    tip = linked.tip;
  }
  return "ok";
}

async function sealChain(
  key: CryptoKey,
  backupId: string,
  count: number,
  start: Pick<ChunkLink, "epoch" | "base"> = { epoch: 0, base: null }
): Promise<Uint8Array[]> {
  const out: Uint8Array[] = [];
  let prev = ZERO_CHAIN_HASH;
  for (let index = 0; index < count; index += 1) {
    const link: ChunkLink = {
      epoch: start.epoch,
      index,
      prev,
      base: index === 0 ? start.base : null,
    };
    const data = await sealChunk(
      key,
      backupId,
      link,
      utf8Encode(`{"n":${index}}`)
    );
    out.push(data);
    prev = await chunkHash(data);
  }
  return out;
}

describe("backup hash chain", () => {
  it("accepts the chain in order and rejects reorder, replay, duplicates, gaps and bad links", async () => {
    const backupId = randomHex(16);
    const key = await deriveChunkKey(newBackupKey(), backupId);
    const [c0, c1, c2, c3] = await sealChain(key, backupId, 4);
    await expect(verify(key, backupId, [c0!, c1!, c2!, c3!])).resolves.toBe(
      "ok"
    );
    for (const tampered of [
      [c0!, c2!, c1!, c3!], // reordered
      [c1!, c0!, c2!, c3!], // reordered start
      [c0!, c1!, c2!, c3!, c1!], // replayed older chunk
      [c0!, c1!, c1!, c2!, c3!], // duplicated
      [c0!, c1!, c2!, c3!, c0!], // replayed chain start
      [c0!, c1!, c3!], // dropped middle chunk
      [c1!, c2!, c3!], // dropped first chunk
    ]) {
      await expect(verify(key, backupId, tampered)).resolves.toBe("corrupt");
    }

    // A chunk with the right key but a wrong previous hash or index.
    const wrongPrev = await chunkHash(c0!);
    const forged = await sealChunk(
      key,
      backupId,
      { epoch: 0, index: 2, prev: wrongPrev, base: null },
      utf8Encode("{}")
    );
    await expect(verify(key, backupId, [c0!, c1!, forged])).resolves.toBe(
      "corrupt"
    );
    const skipped = await sealChunk(
      key,
      backupId,
      { epoch: 0, index: 3, prev: await chunkHash(c1!), base: null },
      utf8Encode("{}")
    );
    await expect(verify(key, backupId, [c0!, c1!, skipped])).resolves.toBe(
      "corrupt"
    );
    // Flipped bytes or another generation's chunks never link.
    const flipped = c2!.slice();
    flipped[200] = flipped[200]! ^ 1;
    await expect(verify(key, backupId, [c0!, c1!, flipped])).resolves.toBe(
      "corrupt"
    );
    const otherId = randomHex(16);
    const otherKey = await deriveChunkKey(newBackupKey(), otherId);
    const [foreign] = await sealChain(otherKey, otherId, 1);
    await expect(verify(key, backupId, [foreign!])).resolves.toBe("corrupt");
  });

  it("starts a new chain only with a higher epoch whose base is the current tip", async () => {
    const backupId = randomHex(16);
    const key = await deriveChunkKey(newBackupKey(), backupId);
    const old = await sealChain(key, backupId, 3);
    const tip = { index: 2, hash: await chunkHash(old[2]!) };
    const next = await sealChain(key, backupId, 2, { epoch: 1, base: tip });
    // Before compaction both chains are there; after it only the new one.
    await expect(verify(key, backupId, [...old, ...next])).resolves.toBe("ok");
    await expect(verify(key, backupId, next)).resolves.toBe("ok");
    // Dropping the old chain's tail, replaying the old chain after the new
    // one, or a restart that does not name the tip all fail.
    await expect(
      verify(key, backupId, [old[0]!, old[1]!, ...next])
    ).resolves.toBe("corrupt");
    await expect(verify(key, backupId, [...next, ...old])).resolves.toBe(
      "corrupt"
    );
    const sameEpoch = await sealChain(key, backupId, 1, {
      epoch: 0,
      base: tip,
    });
    await expect(verify(key, backupId, [...old, ...sameEpoch])).resolves.toBe(
      "corrupt"
    );
    const noBase = await sealChain(key, backupId, 1, { epoch: 1, base: null });
    await expect(verify(key, backupId, [...old, ...noBase])).resolves.toBe(
      "corrupt"
    );
  });
});

// -- manager scenarios ------------------------------------------------------------

const groupRecord: BackupGroupRecord = {
  g: G,
  metadata: {
    v: 1,
    g: G,
    kind: "dm",
    name: null,
    admins: [],
    created_by: PROFILE,
  } as unknown as BackupGroupRecord["metadata"],
  members: [],
  epoch: 1,
  epochFp: "fp",
  createdAt: 1,
  joinedAt: 1,
  updatedAt: 1,
};

function message(
  id: string,
  text: string,
  extra: Partial<BackupMessageRecord> = {}
): BackupMessageRecord {
  return {
    id,
    g: G,
    seq: 1,
    kind: "message",
    senderProfileId: PROFILE,
    senderDeviceKey: null,
    ts: 1,
    serverTs: 1,
    text,
    mentions: [],
    reply: null,
    attachments: [],
    editedAt: null,
    deleted: false,
    reactions: {},
    sigOk: true,
    undecryptable: false,
    epoch: 1,
    body: null,
    sig: null,
    ...extra,
  };
}

class FakeEngine implements BackupEngine {
  history: BackupHistory = { groups: [], messages: [] };
  readonly imported: BackupHistory[] = [];
  private readonly deviceKey = randomHex(32);

  getStatus = () => "ready" as const;
  getThisDevice = () =>
    ({ deviceKey: this.deviceKey }) as unknown as E2eeDeviceInfo;
  subscribe = () => () => undefined;
  backupHistory = () => structuredClone(this.history);
  importBackupHistory = (history: BackupHistory) => {
    this.imported.push(structuredClone(history));
    return Promise.resolve({
      conversations: history.groups.length,
      messages: history.messages.length,
    });
  };

  /** Adds or replaces a message (an edit or delete is a new version). */
  put(record: BackupMessageRecord): void {
    this.history.messages = [
      ...this.history.messages.filter((m) => m.id !== record.id),
      record,
    ];
  }
}

interface Device {
  engine: FakeEngine;
  state: BackupStateStore;
  manager: E2eeBackupManager;
}

function deviceWith(
  api: E2eeBackupApi,
  options: {
    engine?: FakeEngine;
    state?: BackupStateStore;
    compactAtChunks?: number;
  } = {}
): Device {
  const engine = options.engine ?? new FakeEngine();
  const state = options.state ?? createMemoryBackupStateStore();
  const manager = new E2eeBackupManager({
    profileId: PROFILE,
    engine,
    api,
    state,
    scheduler: idleScheduler,
    ...(options.compactAtChunks
      ? { compactAtChunks: options.compactAtChunks }
      : {}),
  });
  return { engine, state, manager };
}

async function allSeqs(api: E2eeBackupApi, backupId: string) {
  const page = await api.listChunks(backupId, 0, 10_000);
  return page.items.map((item) => item.seq);
}

/**
 * A malicious server view: serves the generation's chunks in the order
 * `pick` returns (reordered, replayed, dropped or altered) under fresh,
 * consistent seq numbers, so only the chain itself can catch it.
 */
function serveAs(
  api: E2eeBackupApi,
  pick: (seqs: number[]) => number[],
  alter: (seq: number, data: Uint8Array) => Uint8Array = (_s, data) => data
): E2eeBackupApi {
  const order = async (backupId: string) => pick(await allSeqs(api, backupId));
  return {
    ...api,
    listChunks: async (backupId, afterSeq) => {
      const seqs = await order(backupId);
      return {
        items: seqs
          .map((_, i) => ({ seq: i + 1, size: 4096, created_at: 0 }))
          .filter((item) => item.seq > afterSeq),
        next_after_seq: null,
      };
    },
    getChunk: async (backupId, seq) => {
      const real = (await order(backupId))[seq - 1]!;
      const chunk = await api.getChunk(backupId, real);
      return {
        seq,
        data: bytesToBase64(alter(real, base64ToBytes(chunk.data))),
      };
    },
  };
}

const texts = (history: BackupHistory | undefined) =>
  Object.fromEntries(
    (history?.messages ?? []).map((m) => [m.id, m.deleted ? null : m.text])
  );

async function restoreWith(
  api: E2eeBackupApi,
  prepared: PreparedBackup
): Promise<{ code: string | null; engine: FakeEngine }> {
  const device = deviceWith(api);
  await device.manager.start();
  const code = await errorCode(device.manager.restore(prepared.code));
  return { code, engine: device.engine };
}

/** Turns backup on, then edits, deletes and adds one record per run. */
async function backupWithHistory(server: FakeBackupServer) {
  const api = server.clientFor(PROFILE);
  const writer = deviceWith(api);
  writer.engine.history = {
    groups: [groupRecord],
    messages: [message("m1", "one"), message("m2", "two")],
  };
  await writer.manager.start();
  const prepared = await writer.manager.prepareBackup();
  await writer.manager.confirmBackup(prepared);
  writer.engine.put(message("m1", "one edited", { editedAt: 2 }));
  await writer.manager.backupNow();
  writer.engine.put(message("m2", "two", { deleted: true }));
  await writer.manager.backupNow();
  writer.engine.put(message("m3", "three"));
  await writer.manager.backupNow();
  const backupId = server.generations(PROFILE)[0]!.backup_id;
  expect(await allSeqs(api, backupId)).toEqual([1, 2, 3, 4]);
  return { api, writer, prepared, backupId };
}

const FINAL = { m1: "one edited", m2: null, m3: "three" };

describe("backup restore verifies the chain", () => {
  it("round-trips the history in chain order", async () => {
    const server = createFakeBackupServer(() => 1);
    const { api, prepared } = await backupWithHistory(server);
    const { code, engine } = await restoreWith(api, prepared);
    expect(code).toBeNull();
    expect(texts(engine.imported[0])).toEqual(FINAL);
  });

  it.each([
    ["reordered chunks", (s: number[]) => [s[0]!, s[2]!, s[1]!, s[3]!]],
    ["a replayed older chunk", (s: number[]) => [...s, s[1]!]],
    [
      "a duplicated chunk",
      (s: number[]) => [s[0]!, s[1]!, s[1]!, s[2]!, s[3]!],
    ],
    ["a replayed chain start", (s: number[]) => [...s, s[0]!]],
    ["a dropped middle chunk", (s: number[]) => [s[0]!, s[1]!, s[3]!]],
    ["a dropped first chunk", (s: number[]) => s.slice(1)],
  ])("rejects %s and imports nothing", async (_name, pick) => {
    const server = createFakeBackupServer(() => 1);
    const { api, prepared } = await backupWithHistory(server);
    const { code, engine } = await restoreWith(serveAs(api, pick), prepared);
    expect(code).toBe("E2EE_BACKUP_CORRUPT");
    expect(engine.imported).toHaveLength(0);
  });

  it("rejects a tampered chunk", async () => {
    const server = createFakeBackupServer(() => 1);
    const { api, prepared } = await backupWithHistory(server);
    const flip = (seq: number, data: Uint8Array) => {
      if (seq !== 3) {
        return data;
      }
      const out = data.slice();
      out[50] = out[50]! ^ 1;
      return out;
    };
    const { code, engine } = await restoreWith(
      serveAs(api, (s) => s, flip),
      prepared
    );
    expect(code).toBe("E2EE_BACKUP_CORRUPT");
    expect(engine.imported).toHaveLength(0);
  });

  it("cannot detect the newest chunks being cut off (no trusted tip)", async () => {
    const server = createFakeBackupServer(() => 1);
    const { api, prepared } = await backupWithHistory(server);
    const { code, engine } = await restoreWith(
      serveAs(api, (s) => s.slice(0, -1)),
      prepared
    );
    expect(code).toBeNull();
    expect(texts(engine.imported[0])).toEqual({ m1: "one edited", m2: null });
  });
});

describe("backup writers keep one chain", () => {
  it("persists the chain position and continues it after a restart", async () => {
    const server = createFakeBackupServer(() => 1);
    const { api, writer, prepared, backupId } = await backupWithHistory(server);
    const saved = (await writer.state.get(PROFILE)) as BackupLocalState;
    expect(saved.chain).toMatchObject({ epoch: 0, index: 3, seq: 4 });
    expect(base64ToBytes(saved.chain.hash)).toHaveLength(32);

    // A reloaded page: same persisted state, new manager.
    const reloaded = deviceWith(api, {
      engine: writer.engine,
      state: writer.state,
    });
    await reloaded.manager.start();
    writer.engine.put(message("m4", "four"));
    await reloaded.manager.backupNow();
    expect(await allSeqs(api, backupId)).toEqual([1, 2, 3, 4, 5]);
    expect((await writer.state.get(PROFILE))?.chain).toMatchObject({
      index: 4,
      seq: 5,
    });
    const { code, engine } = await restoreWith(api, prepared);
    expect(code).toBeNull();
    expect(texts(engine.imported[0])).toEqual({ ...FINAL, m4: "four" });
  });

  it("follows its own append whose response was lost", async () => {
    const server = createFakeBackupServer(() => 1);
    const { api, writer, prepared, backupId } = await backupWithHistory(server);
    let dropResponse = true;
    const flaky: E2eeBackupApi = {
      ...api,
      appendChunk: async (id, body) => {
        const result = await api.appendChunk(id, body);
        if (dropResponse) {
          dropResponse = false;
          throw new Error("network");
        }
        return result;
      },
    };
    const device = deviceWith(flaky, {
      engine: writer.engine,
      state: writer.state,
    });
    await device.manager.start();
    writer.engine.put(message("m4", "four"));
    await expect(errorCode(device.manager.backupNow())).resolves.toBe(
      "E2EE_BACKUP_FAILED"
    );
    writer.engine.put(message("m5", "five"));
    await device.manager.backupNow();
    // The lost chunk (seq 5) is adopted; m4 is uploaded again after it.
    expect(await allSeqs(api, backupId)).toEqual([1, 2, 3, 4, 5, 6]);
    const { code, engine } = await restoreWith(api, prepared);
    expect(code).toBeNull();
    expect(texts(engine.imported[0])).toEqual({
      ...FINAL,
      m4: "four",
      m5: "five",
    });
  });

  it("drops local state saved before the v2 chain format", async () => {
    const server = createFakeBackupServer(() => 1);
    const { api, writer } = await backupWithHistory(server);
    const saved = (await writer.state.get(
      PROFILE
    )) as Partial<BackupLocalState>;
    delete saved.chain;
    await writer.state.put(saved as BackupLocalState);
    const reloaded = deviceWith(api, {
      engine: writer.engine,
      state: writer.state,
    });
    await reloaded.manager.start();
    expect(reloaded.manager.getSnapshot().phase).toBe("available");
    await expect(writer.state.get(PROFILE)).resolves.toBeNull();
  });

  it("compacts into a new chain that still verifies, also mid-compaction", async () => {
    const server = createFakeBackupServer(() => 1);
    const api = server.clientFor(PROFILE);
    let failCompact = true;
    const compactOnce: E2eeBackupApi = {
      ...api,
      compact: async (id, body) => {
        if (failCompact) {
          failCompact = false;
          throw new Error("network");
        }
        return api.compact(id, body);
      },
    };
    const writer = deviceWith(compactOnce, { compactAtChunks: 3 });
    writer.engine.history = {
      groups: [groupRecord],
      messages: [message("m1", "one")],
    };
    await writer.manager.start();
    const prepared = await writer.manager.prepareBackup();
    await writer.manager.confirmBackup(prepared);
    writer.engine.put(message("m2", "two"));
    await writer.manager.backupNow();
    writer.engine.put(message("m1", "one", { deleted: true }));
    await writer.manager.backupNow();
    const backupId = server.generations(PROFILE)[0]!.backup_id;
    expect(await allSeqs(api, backupId)).toEqual([1, 2, 3]);
    expect((await writer.state.get(PROFILE))?.chain.restart).toBe(true);

    // The snapshot is uploaded as chain epoch 1; compaction fails once, so
    // both chains are on the server and the restore still verifies.
    await expect(errorCode(writer.manager.backupNow())).resolves.toBe(
      "E2EE_BACKUP_FAILED"
    );
    expect(await allSeqs(api, backupId)).toEqual([1, 2, 3, 4]);
    let restored = await restoreWith(api, prepared);
    expect(restored.code).toBeNull();
    expect(texts(restored.engine.imported[0])).toEqual({ m1: null, m2: "two" });
    // Dropping the old chain's tail before the new chain is caught.
    restored = await restoreWith(
      serveAs(api, (s) => [s[0]!, s[1]!, s[3]!]),
      prepared
    );
    expect(restored.code).toBe("E2EE_BACKUP_CORRUPT");

    // The retry compacts: only the new chain is left and it verifies.
    await writer.manager.backupNow();
    expect(await allSeqs(api, backupId)).toEqual([4]);
    writer.engine.put(message("m3", "three"));
    await writer.manager.backupNow();
    expect(await allSeqs(api, backupId)).toEqual([4, 5]);
    expect((await writer.state.get(PROFILE))?.chain).toMatchObject({
      epoch: 1,
      index: 1,
      restart: false,
      seq: 5,
    });
    restored = await restoreWith(api, prepared);
    expect(restored.code).toBeNull();
    expect(texts(restored.engine.imported[0])).toEqual({
      m1: null,
      m2: "two",
      m3: "three",
    });
  });

  it("continues one chain across devices and repairs a concurrent fork", async () => {
    const server = createFakeBackupServer(() => 1);
    const {
      api,
      writer: a,
      prepared,
      backupId,
    } = await backupWithHistory(server);

    // B restores and keeps the same backup up to date; A follows B's chunk.
    const b = deviceWith(api);
    await b.manager.start();
    await b.manager.restore(prepared.code);
    b.engine.history = a.engine.backupHistory();
    b.engine.put(message("m4", "four"));
    a.engine.put(message("m4", "four"));
    await b.manager.backupNow();
    a.engine.put(message("m5", "five"));
    b.engine.put(message("m5", "five"));
    await a.manager.backupNow();
    expect(await allSeqs(api, backupId)).toEqual([1, 2, 3, 4, 5, 6]);
    let restored = await restoreWith(api, prepared);
    expect(restored.code).toBeNull();
    expect(texts(restored.engine.imported[0])).toEqual({
      ...FINAL,
      m4: "four",
      m5: "five",
    });

    // Both devices append at the same moment: B lands between A's catch-up
    // and A's append, so both chunks claim the same chain position.
    let raceB: (() => Promise<void>) | null = () => b.manager.backupNow();
    const racingApi: E2eeBackupApi = {
      ...api,
      appendChunk: async (id, body) => {
        const race = raceB;
        raceB = null;
        await race?.();
        return api.appendChunk(id, body);
      },
    };
    const racingA = deviceWith(racingApi, { engine: a.engine, state: a.state });
    await racingA.manager.start();
    a.engine.put(message("m6", "six"));
    b.engine.put(message("m6", "six"));
    b.engine.put(message("m7", "seven"));
    a.engine.put(message("m7", "seven"));
    await racingA.manager.backupNow();
    expect(await allSeqs(api, backupId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // The fork fails closed until it is repaired.
    restored = await restoreWith(api, prepared);
    expect(restored.code).toBe("E2EE_BACKUP_CORRUPT");
    expect((await a.state.get(PROFILE))?.chain.restart).toBe(true);

    // A's next run starts a new chain with a full snapshot and compacts.
    await racingA.manager.backupNow();
    expect(await allSeqs(api, backupId)).toEqual([9]);
    restored = await restoreWith(api, prepared);
    expect(restored.code).toBeNull();
    const all = { ...FINAL, m4: "four", m5: "five", m6: "six", m7: "seven" };
    expect(texts(restored.engine.imported[0])).toEqual(all);

    // B follows the new chain and keeps appending to it.
    b.engine.put(message("m8", "eight"));
    await b.manager.backupNow();
    expect(await allSeqs(api, backupId)).toEqual([9, 10]);
    expect((await b.state.get(PROFILE))?.chain).toMatchObject({
      epoch: 1,
      index: 1,
      seq: 10,
    });
    restored = await restoreWith(api, prepared);
    expect(restored.code).toBeNull();
    expect(texts(restored.engine.imported[0])).toEqual({ ...all, m8: "eight" });
  });
});
